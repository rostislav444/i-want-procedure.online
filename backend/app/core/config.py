from pathlib import Path

from pydantic_settings import BaseSettings
from typing import Optional

# Base directory of the backend app
BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    # Base directory
    BASE_DIR: Path = BASE_DIR
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@db:5432/procedure"

    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Telegram Bots
    CLIENT_BOT_TOKEN: Optional[str] = None
    CLIENT_BOT_NAME: Optional[str] = None
    DOCTOR_BOT_TOKEN: Optional[str] = None
    DOCTOR_BOT_NAME: Optional[str] = None

    # Google OAuth
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/google/callback"

    # AI (Anthropic)
    ANTHROPIC_API_KEY: Optional[str] = None

    # API
    API_URL: str = "http://localhost:8000"
    API_V1_PREFIX: str = "/api/v1"

    # Frontend
    FRONTEND_URL: str = "http://localhost:3000"

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # Redis
    REDIS_URL: Optional[str] = None

    # Debug
    DEBUG: bool = False

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
