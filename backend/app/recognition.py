"""Riconoscimento automatico da foto: OCR + decodifica barcode + match negozio.

v1: fuzzy match testuale contro il catalogo `stores` (nome + alias).
v2 (futuro): embedding visivo del logo per match anche senza testo leggibile.
"""

import difflib
import io

import pytesseract
from PIL import Image
from pyzbar.pyzbar import decode as zbar_decode
from sqlalchemy.orm import Session

from app.models import BarcodeFormat, Store

_ZBAR_TO_FORMAT = {
    "EAN13": BarcodeFormat.EAN13,
    "EAN8": BarcodeFormat.EAN8,
    "CODE128": BarcodeFormat.CODE128,
    "CODE39": BarcodeFormat.CODE39,
    "QRCODE": BarcodeFormat.QRCODE,
    "PDF417": BarcodeFormat.PDF417,
    "CODABAR": BarcodeFormat.CODABAR,
}


def extract_text(image_bytes: bytes) -> str:
    image = Image.open(io.BytesIO(image_bytes))
    return pytesseract.image_to_string(image, lang="ita+eng").strip()


def decode_barcode(image_bytes: bytes):
    image = Image.open(io.BytesIO(image_bytes))
    results = zbar_decode(image)
    if not results:
        return None, None
    result = results[0]
    value = result.data.decode("utf-8", errors="ignore")

    if result.type == "UPCA":
        # UPC-A e' letteralmente un EAN-13 senza il suo "0" iniziale (system
        # digit): lo ripristiniamo per non perdere quella cifra che il
        # barcode fisico ha davvero stampata.
        return f"0{value}", BarcodeFormat.EAN13

    fmt = _ZBAR_TO_FORMAT.get(result.type, BarcodeFormat.CODE128)
    return value, fmt


def match_store(db: Session, text: str, threshold: float = 0.6) -> Store | None:
    if not text:
        return None

    candidates = db.query(Store).all()
    best_match = None
    best_ratio = 0.0

    text_lower = text.lower()
    for store in candidates:
        names_to_check = [store.name] + (
            store.aliases.split(",") if store.aliases else []
        )
        for name in names_to_check:
            name = name.strip().lower()
            if not name:
                continue
            if name in text_lower:
                return store
            ratio = difflib.SequenceMatcher(None, name, text_lower).ratio()
            if ratio > best_ratio:
                best_ratio = ratio
                best_match = store

    return best_match if best_ratio >= threshold else None
