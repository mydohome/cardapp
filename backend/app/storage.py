import uuid

import boto3
from botocore.client import Config as BotoConfig

from app.config import settings

_s3 = boto3.client(
    "s3",
    endpoint_url=f"http://{settings.minio_endpoint}",
    aws_access_key_id=settings.minio_root_user,
    aws_secret_access_key=settings.minio_root_password,
    config=BotoConfig(signature_version="s3v4"),
)


def ensure_bucket():
    existing = [b["Name"] for b in _s3.list_buckets().get("Buckets", [])]
    if settings.minio_bucket not in existing:
        _s3.create_bucket(Bucket=settings.minio_bucket)


def upload_photo(content: bytes, content_type: str) -> str:
    key = f"card-photos/{uuid.uuid4()}"
    _s3.put_object(Bucket=settings.minio_bucket, Key=key, Body=content, ContentType=content_type)
    return key


def get_photo_url(key: str, expires_in: int = 3600) -> str:
    return _s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.minio_bucket, "Key": key},
        ExpiresIn=expires_in,
    )
