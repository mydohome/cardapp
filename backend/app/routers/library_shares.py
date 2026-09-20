from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import LibraryShare, User
from app.schemas import LibraryShareCreate, LibraryShareOut
from app.security import get_current_user

router = APIRouter(prefix="/api/library-shares", tags=["library-shares"])


@router.get("", response_model=list[LibraryShareOut])
def list_library_shares(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    shares = db.query(LibraryShare).filter(LibraryShare.owner_id == user.id).all()
    return [
        LibraryShareOut(
            user_id=s.shared_with_user_id,
            username=s.shared_with_user.username,
            display_name=s.shared_with_user.display_name,
            permission=s.permission,
        )
        for s in shares
    ]


@router.post("", status_code=201)
def share_library(
    payload: LibraryShareCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    target = db.query(User).filter(User.username == payload.username).first()
    if not target:
        raise HTTPException(status_code=404, detail="Utente non trovato")
    if target.id == user.id:
        raise HTTPException(status_code=400, detail="Non puoi condividere la libreria con te stesso")

    existing = (
        db.query(LibraryShare)
        .filter(LibraryShare.owner_id == user.id, LibraryShare.shared_with_user_id == target.id)
        .first()
    )
    if existing:
        existing.permission = payload.permission
    else:
        db.add(LibraryShare(owner_id=user.id, shared_with_user_id=target.id, permission=payload.permission))
    db.commit()
    return {"status": "ok"}


@router.delete("/{user_id}", status_code=204)
def revoke_library_share(user_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    db.query(LibraryShare).filter(
        LibraryShare.owner_id == user.id, LibraryShare.shared_with_user_id == user_id
    ).delete()
    db.commit()
