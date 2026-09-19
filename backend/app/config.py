from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg2://cardapp:change_me@postgres:5432/cardapp"
    redis_url: str = "redis://redis:6379/0"

    minio_endpoint: str = "minio:9000"
    minio_root_user: str = "cardapp"
    minio_root_password: str = "change_me_too"
    minio_bucket: str = "cardapp-media"

    jwt_secret: str = "change_this_to_a_long_random_string"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 30

    class Config:
        env_file = ".env"


settings = Settings()
