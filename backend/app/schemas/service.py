from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel


# Category schemas
class ServiceCategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    parent_id: Optional[int] = None
    order: int = 0


class ServiceCategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[int] = None
    order: Optional[int] = None


class ServiceCategoryResponse(BaseModel):
    id: int
    company_id: int
    parent_id: Optional[int] = None
    name: str
    description: Optional[str] = None
    order: int
    created_at: datetime

    class Config:
        from_attributes = True


class ServiceCategoryTreeResponse(BaseModel):
    id: int
    company_id: int
    parent_id: Optional[int] = None
    name: str
    description: Optional[str] = None
    order: int
    created_at: datetime
    children: list["ServiceCategoryTreeResponse"] = []

    class Config:
        from_attributes = True


# Step schemas
class ServiceStepCreate(BaseModel):
    order: int = 1
    title: str
    description: Optional[str] = None
    duration_minutes: Optional[int] = None


class ServiceStepUpdate(BaseModel):
    order: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = None


class ServiceStepResponse(BaseModel):
    id: int
    service_id: int
    order: int
    title: str
    description: Optional[str] = None
    duration_minutes: Optional[int] = None

    class Config:
        from_attributes = True


# Product schemas
class ServiceProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    manufacturer: Optional[str] = None


class ServiceProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    manufacturer: Optional[str] = None


class ServiceProductResponse(BaseModel):
    id: int
    service_id: int
    name: str
    description: Optional[str] = None
    manufacturer: Optional[str] = None

    class Config:
        from_attributes = True


# Service schemas
class ServiceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    duration_minutes: int = 60
    price: Decimal
    category_id: Optional[int] = None
    specialty_id: Optional[int] = None
    doctor_id: Optional[int] = None
    steps: Optional[list[ServiceStepCreate]] = None
    products: Optional[list[ServiceProductCreate]] = None


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    price: Optional[Decimal] = None
    category_id: Optional[int] = None
    specialty_id: Optional[int] = None
    is_active: Optional[bool] = None


class ServiceCategoryBrief(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class SpecialtyBrief(BaseModel):
    id: int
    name: str
    color: Optional[str] = None

    class Config:
        from_attributes = True


class ServiceResponse(BaseModel):
    id: int
    company_id: int
    category_id: Optional[int] = None
    specialty_id: Optional[int] = None
    doctor_id: Optional[int] = None
    name: str
    description: Optional[str] = None
    duration_minutes: int
    price: Decimal
    is_active: bool
    created_at: datetime
    category: Optional[ServiceCategoryBrief] = None
    specialty: Optional[SpecialtyBrief] = None

    class Config:
        from_attributes = True


class ServiceDetailResponse(BaseModel):
    id: int
    company_id: int
    category_id: Optional[int] = None
    specialty_id: Optional[int] = None
    doctor_id: Optional[int] = None
    name: str
    description: Optional[str] = None
    duration_minutes: int
    price: Decimal
    is_active: bool
    created_at: datetime
    steps: list[ServiceStepResponse] = []
    products: list[ServiceProductResponse] = []
    category: Optional[ServiceCategoryResponse] = None
    specialty: Optional[SpecialtyBrief] = None

    class Config:
        from_attributes = True
