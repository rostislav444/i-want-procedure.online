from datetime import datetime, date, time
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel

from app.models.appointment import AppointmentStatus


class AppointmentCreate(BaseModel):
    doctor_id: int
    service_id: int
    date: date
    start_time: time


class AppointmentUpdate(BaseModel):
    status: AppointmentStatus


class ClientInfo(BaseModel):
    id: int
    first_name: str
    last_name: Optional[str] = None
    phone: Optional[str] = None
    telegram_username: Optional[str] = None

    class Config:
        from_attributes = True


class ServiceInfo(BaseModel):
    id: int
    name: str
    duration_minutes: int
    price: Decimal

    class Config:
        from_attributes = True


class AppointmentResponse(BaseModel):
    id: int
    company_id: int
    doctor_id: int
    client_id: int
    service_id: int
    specialist_profile_id: Optional[int] = None
    date: date
    start_time: time
    end_time: time
    status: AppointmentStatus
    created_at: datetime
    client: Optional[ClientInfo] = None
    service: Optional[ServiceInfo] = None

    class Config:
        from_attributes = True


class AvailableSlot(BaseModel):
    date: date
    start_time: time
    end_time: time
