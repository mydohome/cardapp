import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Card, CardShare, ShareInvite, User
from app.schemas import ShareCreate, ShareInviteCreate, ShareInviteOut, ShareOut
from app.security import get_current_user

router = APIRouter(prefix="/api/cards/{card_id}/shares", tags=["shares"])


def _get_owned_card(card_id: str, db: Session, user: User) -> Card:
    card = db.query(Card).filter(Card.id == card_id, Card.owner_id == user.id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Carta non trovata o non sei il proprietario")
    return card


@router.get("", response_model=list[ShareOut])
def list_shares(card_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    card = _get_owned_card(card_id, db, user)
    return [
        ShareOut(
            user_id=s.shared_with_user_id,
            username=s.shared_with_user.username,
            display_name=s.shared_with_user.display_name,
            permission=s.permission,
        )
        for s in card.shares
    ]


@router.post("", status_code=201)
def share_with_user(card_id: str, payload: ShareCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    card = _get_owned_card(card_id, db, user)

    target = db.query(User).filter(User.username == payload.username).first()
    if not target:
        raise HTTPException(status_code=404, detail="Utente non trovato: deve essere già registrato, altrimenti usa un link di invito")
    if target.id == user.id:
        raise HTTPException(status_code=400, detail="Non puoi condividere una carta con te stesso")

    existing = db.query(CardShare).filter(CardShare.card_id == card.id, CardShare.shared_with_user_id == target.id).first()
    if existing:
        existing.permission = payload.permission
    else:
        db.add(CardShare(card_id=card.id, shared_with_user_id=target.id, permission=payload.permission))
    db.commit()
    return {"status": "ok"}


@router.delete("/{user_id}", status_code=204)
def revoke_share(card_id: str, user_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    card = _get_owned_card(card_id, db, user)
    db.query(CardShare).filter(CardShare.card_id == card.id, CardShare.shared_with_user_id == user_id).delete()
    db.commit()


@router.post("/invite", response_model=ShareInviteOut, status_code=201)
def create_invite(card_id: str, payload: ShareInviteCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Crea un link di condivisione con scadenza, utile per invitare chi non è ancora registrato."""
    card = _get_owned_card(card_id, db, user)

    invite = ShareInvite(
        card_id=card.id,
        token=secrets.token_urlsafe(24),
        permission=payload.permission,
        expires_at=datetime.utcnow() + timedelta(hours=payload.expires_in_hours),
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)
    return invite
