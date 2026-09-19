from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import CardShare, ShareInvite, User
from app.security import get_current_user

router = APIRouter(prefix="/api/invites", tags=["invites"])


@router.post("/{token}/accept", status_code=200)
def accept_invite(token: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    invite = db.query(ShareInvite).filter(ShareInvite.token == token).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invito non valido")
    if invite.expires_at and invite.expires_at < datetime.utcnow():
        raise HTTPException(status_code=410, detail="Invito scaduto")

    existing = (
        db.query(CardShare)
        .filter(CardShare.card_id == invite.card_id, CardShare.shared_with_user_id == user.id)
        .first()
    )
    if not existing:
        db.add(
            CardShare(
                card_id=invite.card_id,
                shared_with_user_id=user.id,
                permission=invite.permission,
            )
        )
    invite.used_by_user_id = user.id
    db.commit()
    return {"status": "ok", "card_id": invite.card_id}
