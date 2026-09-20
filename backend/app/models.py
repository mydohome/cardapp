import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    String,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    username = Column(String, unique=True, index=True, nullable=False)
    # Facoltativa di proposito: serve solo un nome utente semplice per accedere
    # e per essere trovati da chi vuole condividere una carta.
    email = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=False)
    display_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    cards = relationship("Card", back_populates="owner", cascade="all, delete-orphan")


class Store(Base):
    """Catalogo negozi noti, usato per l'associazione automatica del logo."""

    __tablename__ = "stores"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False, index=True)
    aliases = Column(String, nullable=True)  # lista separata da virgole, usata nel fuzzy match
    logo_url = Column(String, nullable=True)
    category = Column(String, nullable=True)

    cards = relationship("Card", back_populates="store")


class BarcodeFormat(str, enum.Enum):
    EAN13 = "EAN13"
    EAN8 = "EAN8"
    CODE128 = "CODE128"
    CODE39 = "CODE39"
    QRCODE = "QRCODE"
    PDF417 = "PDF417"
    AZTEC = "AZTEC"
    CODABAR = "CODABAR"


class Card(Base):
    __tablename__ = "cards"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    owner_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    store_id = Column(UUID(as_uuid=False), ForeignKey("stores.id"), nullable=True)

    label = Column(String, nullable=False)  # nome mostrato, es. "Esselunga Fidaty"
    barcode_value = Column(String, nullable=False)
    barcode_format = Column(Enum(BarcodeFormat), default=BarcodeFormat.EAN13)
    notes = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="cards")
    store = relationship("Store", back_populates="cards")
    shares = relationship("CardShare", back_populates="card", cascade="all, delete-orphan")
    favorited_by = relationship("CardFavorite", back_populates="card", cascade="all, delete-orphan")


class SharePermission(str, enum.Enum):
    VIEW = "view"
    EDIT = "edit"


class CardShare(Base):
    __tablename__ = "card_shares"
    __table_args__ = (UniqueConstraint("card_id", "shared_with_user_id"),)

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    card_id = Column(UUID(as_uuid=False), ForeignKey("cards.id"), nullable=False)
    shared_with_user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    permission = Column(Enum(SharePermission), default=SharePermission.VIEW)
    created_at = Column(DateTime, default=datetime.utcnow)

    card = relationship("Card", back_populates="shares")
    shared_with_user = relationship("User")


class CardFavorite(Base):
    """Preferito personale: tabella separata (non un campo su Card) perche' una
    carta condivisa e' la stessa riga per tutti - un booleano su Card avrebbe
    reso "preferita" la carta per il proprietario ogni volta che un utente con
    cui e' condivisa la segna come tale."""

    __tablename__ = "card_favorites"
    __table_args__ = (UniqueConstraint("user_id", "card_id"),)

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    card_id = Column(UUID(as_uuid=False), ForeignKey("cards.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    card = relationship("Card", back_populates="favorited_by")


class ShareInvite(Base):
    """Link di condivisione con token e scadenza, per invitare anche utenti non ancora registrati."""

    __tablename__ = "share_invites"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    card_id = Column(UUID(as_uuid=False), ForeignKey("cards.id"), nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)
    permission = Column(Enum(SharePermission), default=SharePermission.VIEW)
    expires_at = Column(DateTime, nullable=True)
    used_by_user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
