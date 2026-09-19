from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Card, CardShare, SharePermission, User
from app.recognition import decode_barcode, extract_text, match_store
from app.schemas import CardCreate, CardOut, CardUpdate, PhotoRecognitionResult
from app.security import get_current_user
from app.storage import get_photo_url, upload_photo

router = APIRouter(prefix="/api/cards", tags=["cards"])


def _card_out(card: Card, shared_by: str | None = None) -> CardOut:
    out = CardOut.model_validate(card)
    out.shared_by = shared_by
    return out


@router.get("", response_model=list[CardOut])
def list_cards(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Ritorna tutte le carte dell'utente: proprie + condivise con lui.

    Pensato per essere caricato tutto in un colpo solo all'avvio della app,
    cosi' la ricerca lato client (Fuse.js) e' istantanea e funziona offline.
    """
    own = db.query(Card).filter(Card.owner_id == user.id).all()
    shared = (
        db.query(Card)
        .join(CardShare, CardShare.card_id == Card.id)
        .filter(CardShare.shared_with_user_id == user.id)
        .all()
    )

    result = [_card_out(c) for c in own]
    for c in shared:
        result.append(_card_out(c, shared_by=c.owner.display_name or c.owner.username))
    return result


@router.post("", response_model=CardOut, status_code=201)
def create_card(payload: CardCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    card = Card(owner_id=user.id, **payload.model_dump())
    db.add(card)
    db.commit()
    db.refresh(card)
    return _card_out(card)


def _get_editable_card(card_id: str, db: Session, user: User) -> Card:
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Carta non trovata")
    if card.owner_id == user.id:
        return card
    share = (
        db.query(CardShare)
        .filter(CardShare.card_id == card_id, CardShare.shared_with_user_id == user.id)
        .first()
    )
    if share and share.permission == SharePermission.EDIT:
        return card
    raise HTTPException(status_code=403, detail="Non hai i permessi per modificare questa carta")


@router.patch("/{card_id}", response_model=CardOut)
def update_card(card_id: str, payload: CardUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    card = _get_editable_card(card_id, db, user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(card, field, value)
    db.commit()
    db.refresh(card)
    return _card_out(card)


@router.delete("/{card_id}", status_code=204)
def delete_card(card_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    card = db.query(Card).filter(Card.id == card_id, Card.owner_id == user.id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Carta non trovata")
    db.delete(card)
    db.commit()


@router.post("/{card_id}/photo", response_model=CardOut)
async def upload_card_photo(card_id: str, file: UploadFile, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    card = _get_editable_card(card_id, db, user)
    content = await file.read()
    key = upload_photo(content, file.content_type or "image/jpeg")
    card.photo_key = key
    db.commit()
    db.refresh(card)
    return _card_out(card)


@router.get("/{card_id}/photo-url")
def card_photo_url(card_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card or not card.photo_key:
        raise HTTPException(status_code=404, detail="Foto non trovata")
    return {"url": get_photo_url(card.photo_key)}


@router.post("/recognize-photo", response_model=PhotoRecognitionResult)
async def recognize_photo(file: UploadFile, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Analizza una foto della carta: prova a leggere il barcode e a riconoscere il negozio via OCR.

    Usato come fallback quando lo scan live dalla fotocamera non funziona,
    e per l'associazione automatica del logo negozio.
    """
    content = await file.read()

    barcode_value, barcode_format = decode_barcode(content)
    text = extract_text(content)
    store = match_store(db, text) if text else None

    return PhotoRecognitionResult(
        detected_text=text or None,
        matched_store=store,
        decoded_barcode_value=barcode_value,
        decoded_barcode_format=barcode_format,
    )
