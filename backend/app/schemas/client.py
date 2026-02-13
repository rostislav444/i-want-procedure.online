from datetime import datetime
from typing import Optional
from pydantic import BaseModel

from app.models.client import Language


class ClientCreate(BaseModel):
    telegram_id: Optional[int] = None
    telegram_username: Optional[str] = None
    first_name: str
    last_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    language: Language = Language.UK


class ClientCreateAdmin(BaseModel):
    """For creating clients from admin panel (no telegram_id required)."""
    first_name: str
    last_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    language: Language = Language.UK


class ClientResponse(BaseModel):
    id: int
    telegram_id: Optional[int] = None
    telegram_username: Optional[str] = None
    first_name: str
    last_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    language: Language
    created_at: datetime

    class Config:
        from_attributes = True


class ClientSearchResponse(BaseModel):
    id: int
    first_name: str
    last_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    telegram_username: Optional[str] = None

    class Config:
        from_attributes = True


class ClientListResponse(BaseModel):
    """Client with appointment statistics for list view."""
    id: int
    telegram_id: Optional[int] = None
    telegram_username: Optional[str] = None
    first_name: str
    last_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    language: Language
    created_at: datetime
    # Appointment stats
    total_appointments: int = 0
    completed_appointments: int = 0
    upcoming_appointments: int = 0
    # Next appointment details
    next_visit_date: Optional[datetime] = None
    next_visit_time: Optional[str] = None
    next_visit_service: Optional[str] = None
    # Last visit details
    last_visit_date: Optional[datetime] = None
    last_visit_service: Optional[str] = None

    class Config:
        from_attributes = True
