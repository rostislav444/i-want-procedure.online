from datetime import datetime
from pydantic import BaseModel

from app.models.company import CompanyType


class CompanyCreate(BaseModel):
    name: str
    type: CompanyType = CompanyType.SOLO


class CompanyUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    phone: str | None = None
    address: str | None = None
    telegram: str | None = None


class CompanyResponse(BaseModel):
    id: int
    name: str
    slug: str
    type: CompanyType
    description: str | None = None
    phone: str | None = None
    address: str | None = None
    telegram: str | None = None
    invite_code: str
    created_at: datetime

    class Config:
        from_attributes = True


class CompanyPublicResponse(BaseModel):
    """Public response without sensitive data like invite_code"""
    id: int
    name: str
    slug: str
    description: str | None = None
    phone: str | None = None
    address: str | None = None
    telegram: str | None = None

    class Config:
        from_attributes = True
