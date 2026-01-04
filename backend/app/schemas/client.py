from datetime import datetime
from typing import Optional
from pydantic import BaseModel

from app.models.client import Language


class ClientCreate(BaseModel):
    telegram_id: int
    telegram_username: Optional[str] = None
    first_name: str
    last_name: Optional[str] = None
    phone: Optional[str] = None
    language: Language = Language.UK


class ClientResponse(BaseModel):
    id: int
    telegram_id: int
    telegram_username: Optional[str] = None
    first_name: str
    last_name: Optional[str] = None
    phone: Optional[str] = None
    language: Language
    created_at: datetime

    class Config:
        from_attributes = True
