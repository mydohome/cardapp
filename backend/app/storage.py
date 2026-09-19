"""Storage locale su filesystem per le foto delle carte.

Usiamo il disco invece di un object storage (S3/MinIO) perche' l'unico
bisogno e' salvare le foto caricate durante lo scan: niente qui richiede
semantica S3 (bucket, versioning, multi-regione), e un servizio in meno
da mantenere/buildare per un uso self-hosted personale/familiare.
"""

import mimetypes
import uuid
from pathlib import Path

STORAGE_ROOT = Path("/data/uploads")


def ensure_storage_dir() -> None:
    (STORAGE_ROOT / "card-photos").mkdir(parents=True, exist_ok=True)


def upload_photo(content: bytes, content_type: str) -> str:
    extension = mimetypes.guess_extension(content_type) or ""
    key = f"card-photos/{uuid.uuid4()}{extension}"
    (STORAGE_ROOT / key).write_bytes(content)
    return key


def get_photo_path(key: str) -> Path:
    return STORAGE_ROOT / key
