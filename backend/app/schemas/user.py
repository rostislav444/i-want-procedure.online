from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr

from app.models.user import UserRole


class UserResponse(BaseModel):
    id: int
    company_id: int
    email: Optional[EmailStr] = None
    first_name: str
    last_name: str
    patronymic: Optional[str] = None
    phone: Optional[str] = None
    telegram_id: Optional[int] = None
    telegram_username: Optional[str] = None
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    patronymic: Optional[str] = None
    phone: Optional[str] = None
    telegram_id: Optional[int] = None
