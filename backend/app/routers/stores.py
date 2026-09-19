from fastapi import APIRouter, Depends
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Store, User
from app.schemas import StoreOut
from app.security import get_current_user

router = APIRouter(prefix="/api/stores", tags=["stores"])


@router.get("", response_model=list[StoreOut])
def search_stores(q: str = "", db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    query = db.query(Store)
    if q:
        like = f"%{q}%"
        query = query.filter(or_(Store.name.ilike(like), Store.aliases.ilike(like)))
    return query.order_by(Store.name).limit(50).all()
