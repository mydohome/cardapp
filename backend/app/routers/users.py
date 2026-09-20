from fastapi import APIRouter, Depends
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import UserSummary
from app.security import get_current_user

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=list[UserSummary])
def search_users(q: str = "", db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Autocomplete per la condivisione (singola carta o libreria intera):
    solo utenti gia' registrati, mai stesso utente, mai email/password."""
    if not q.strip():
        return []
    like = f"%{q.strip()}%"
    return (
        db.query(User)
        .filter(User.id != user.id)
        .filter(or_(User.username.ilike(like), User.display_name.ilike(like)))
        .order_by(User.username)
        .limit(10)
        .all()
    )
