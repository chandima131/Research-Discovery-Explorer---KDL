from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    database_url: str = "postgresql+psycopg://research@localhost:5432/research"
    cors_origins: list[str] = ["http://localhost:4173", "http://localhost:8080"]
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    embedding_revision: str = "c9745ed1d9f207416be6d2e6f8de32d1f16199bf"
    max_request_bytes: int = 16384


@lru_cache
def get_settings() -> Settings:
    return Settings()
