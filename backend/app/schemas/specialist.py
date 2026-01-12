from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel


# ===== Specialist Service Schemas =====

class SpecialistServiceBase(BaseModel):
    service_id: int
    custom_price: Optional[Decimal] = None
    custom_duration_minutes: Optional[int] = None
    is_active: bool = True


class SpecialistServiceCreate(SpecialistServiceBase):
    pass


class SpecialistServiceUpdate(BaseModel):
    custom_price: Optional[Decimal] = None
    custom_duration_minutes: Optional[int] = None
    is_active: Optional[bool] = None


class SpecialistServiceResponse(BaseModel):
    id: int
    specialist_profile_id: int
    service_id: int
    service_name: str
    service_price: Decimal
    service_duration_minutes: int
    custom_price: Optional[Decimal] = None
    custom_duration_minutes: Optional[int] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AssignServicesRequest(BaseModel):
    """Assign multiple services to a specialist at once."""
    service_ids: list[int]


# ===== Specialist Profile Schemas =====

class SpecialistProfileBase(BaseModel):
    position: Optional[str] = None
    bio: Optional[str] = None


class SpecialistProfileCreate(SpecialistProfileBase):
    user_id: int


class SpecialistProfileUpdate(SpecialistProfileBase):
    is_active: Optional[bool] = None


class SpecialistProfileResponse(BaseModel):
    id: int
    user_id: int
    company_id: int
    position: Optional[str] = None
    bio: Optional[str] = None
    is_active: bool
    created_at: datetime

    # User info (joined)
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None

    # Stats
    services_count: int = 0
    clients_count: int = 0
    appointments_today: int = 0

    # Google integration status
    google_connected: bool = False

    class Config:
        from_attributes = True


class SpecialistListItem(BaseModel):
    """Simplified specialist info for lists."""
    id: int
    user_id: int
    first_name: str
    last_name: str
    position: Optional[str] = None
    is_active: bool
    services_count: int = 0
    google_connected: bool = False

    class Config:
        from_attributes = True
