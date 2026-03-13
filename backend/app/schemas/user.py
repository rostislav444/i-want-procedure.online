from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr

from app.schemas.city import CityShort


class UserResponse(BaseModel):
    id: int
    email: Optional[EmailStr] = None
    first_name: str
    last_name: str
    patronymic: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None  # legacy
    city_id: Optional[int] = None
    city_info: Optional[CityShort] = None
    address: Optional[str] = None
    telegram_id: Optional[int] = None
    telegram_username: Optional[str] = None
    is_active: bool
    is_superadmin: bool = False
    created_at: datetime

    class Config:
        from_attributes = True

    @classmethod
    def from_user(cls, user) -> "UserResponse":
        data = {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "patronymic": user.patronymic,
            "phone": user.phone,
            "city": user.city,
            "city_id": user.city_id,
            "address": user.address,
            "telegram_id": user.telegram_id,
            "telegram_username": user.telegram_username,
            "is_active": user.is_active,
            "is_superadmin": user.is_superadmin,
            "created_at": user.created_at,
        }
        if user.city_ref:
            data["city_info"] = CityShort.model_validate(user.city_ref)
        return cls(**data)


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    patronymic: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None  # legacy
    city_id: Optional[int] = None
    address: Optional[str] = None
    telegram_id: Optional[int] = None
