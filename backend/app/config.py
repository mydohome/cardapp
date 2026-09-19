from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg2://cardapp:change_me@postgres:5432/cardapp"
    redis_url: str = "redis://redis:6379/0"

    jwt_secret: str = "change_this_to_a_long_random_string"
    jwt_algorithm: str = "HS256"
    # Non c'e' ancora un refresh-token flow: l'access token e' l'unica credenziale.
    # Scadenza lunga di proposito, perche' l'uso offline (mostrare le carte gia'
    # sincronizzate) deve restare possibile per giorni senza dover rifare login.
    access_token_expire_minutes: int = 60 * 24 * 14  # 14 giorni
    refresh_token_expire_days: int = 30

    class Config:
        env_file = ".env"


settings = Settings()
