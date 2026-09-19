from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from app.models import BarcodeFormat, SharePermission

# Nome utente semplice: lettere/cifre/punto/underscore/trattino, 3-32 caratteri.
# Serve solo per login e per essere trovati da chi vuole condividere una carta;
# l'email resta facoltativa.
USERNAME_PATTERN = r"^[a-zA-Z0-9_.-]{3,32}$"


# --- Auth ---

class UserCreate(BaseModel):
    username: str = Field(pattern=USERNAME_PATTERN)
    password: str
    email: Optional[EmailStr] = None
    display_name: Optional[str] = None


class UserOut(BaseModel):
    id: str
    username: str
    email: Optional[EmailStr] = None
    display_name: Optional[str] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# --- Store ---

class StoreOut(BaseModel):
    id: str
    name: str
    logo_url: Optional[str] = None
    category: Optional[str] = None

    class Config:
        from_attributes = True


# --- Card ---

class CardCreate(BaseModel):
    label: str
    barcode_value: str
    barcode_format: BarcodeFormat = BarcodeFormat.EAN13
    store_id: Optional[str] = None
    notes: Optional[str] = None


class CardUpdate(BaseModel):
    label: Optional[str] = None
    barcode_value: Optional[str] = None
    barcode_format: Optional[BarcodeFormat] = None
    store_id: Optional[str] = None
    notes: Optional[str] = None


class CardOut(BaseModel):
    id: str
    label: str
    barcode_value: str
    barcode_format: BarcodeFormat
    store: Optional[StoreOut] = None
    photo_key: Optional[str] = None
    notes: Optional[str] = None
    updated_at: datetime
    shared_by: Optional[str] = None  # nome del proprietario, valorizzato solo per carte condivise

    class Config:
        from_attributes = True


# --- Sharing ---

class ShareCreate(BaseModel):
    username: str
    permission: SharePermission = SharePermission.VIEW


class ShareOut(BaseModel):
    user_id: str
    username: str
    display_name: Optional[str] = None
    permission: SharePermission


class ShareInviteCreate(BaseModel):
    permission: SharePermission = SharePermission.VIEW
    expires_in_hours: int = 72


class ShareInviteOut(BaseModel):
    token: str
    expires_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Photo recognition ---

class PhotoRecognitionResult(BaseModel):
    detected_text: Optional[str] = None
    matched_store: Optional[StoreOut] = None
    decoded_barcode_value: Optional[str] = None
    decoded_barcode_format: Optional[BarcodeFormat] = None
