from datetime import datetime, date, time
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field, model_validator

from app.models.appointment import AppointmentStatus
from app.schemas.client import ClientCreateAdmin


class AppointmentCreate(BaseModel):
    doctor_id: int
    service_id: int
    date: date
    start_time: time


class AppointmentCreateAdmin(BaseModel):
    """For creating appointments from admin panel."""
    client_id: Optional[int] = None
    new_client: Optional[ClientCreateAdmin] = None
    service_id: int
    member_id: Optional[int] = None
    date: date
    start_time: time
    end_time: Optional[time] = None
    status: AppointmentStatus = AppointmentStatus.CONFIRMED

    @model_validator(mode='after')
    def validate_client(self):
        if not self.client_id and not self.new_client:
            raise ValueError('Either client_id or new_client must be provided')
        if self.client_id and self.new_client:
            raise ValueError('Provide either client_id or new_client, not both')
        return self


class AppointmentUpdate(BaseModel):
    status: AppointmentStatus


class ClientInfo(BaseModel):
    id: int
    first_name: str
    last_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
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
    specialist_profile_id: Optional[int] = Field(None, validation_alias='member_id')
    date: date
    start_time: time
    end_time: time
    status: AppointmentStatus
    created_at: datetime
    client: Optional[ClientInfo] = None
    service: Optional[ServiceInfo] = None

    class Config:
        from_attributes = True
        populate_by_name = True


class AvailableSlot(BaseModel):
    date: date
    start_time: time
    end_time: time
