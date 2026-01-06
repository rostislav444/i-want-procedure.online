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
    # Template settings
    template_type: str | None = None  # solo, clinic, premium
    primary_color: str | None = None  # HEX color
    logo_url: str | None = None
    cover_image_url: str | None = None
    # Additional info
    specialization: str | None = None
    working_hours: str | None = None
    social_links: str | None = None  # JSON string
    # Payment requisites
    payment_iban: str | None = None
    payment_bank_name: str | None = None
    payment_recipient_name: str | None = None
    payment_card_number: str | None = None
    payment_monobank_jar: str | None = None


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
    # Template settings
    template_type: str = "solo"
    primary_color: str | None = None
    logo_url: str | None = None
    cover_image_url: str | None = None
    # Additional info
    specialization: str | None = None
    working_hours: str | None = None
    social_links: str | None = None
    # Payment requisites
    payment_iban: str | None = None
    payment_bank_name: str | None = None
    payment_recipient_name: str | None = None
    payment_card_number: str | None = None
    payment_monobank_jar: str | None = None

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
    # Template settings for public display
    template_type: str = "solo"
    primary_color: str | None = None
    logo_url: str | None = None
    cover_image_url: str | None = None
    # Additional info
    specialization: str | None = None
    working_hours: str | None = None
    social_links: str | None = None

    class Config:
        from_attributes = True
