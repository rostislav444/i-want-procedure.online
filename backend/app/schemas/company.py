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
    template_type: str | None = None  # solo, clinic
    industry_theme: str | None = None  # cosmetology, medical, massage, sport, beauty, wellness
    primary_color: str | None = None  # Main brand color
    accent_color: str | None = None  # Alias for primary_color
    secondary_color: str | None = None  # Secondary accent color
    background_color: str | None = None  # Page background color
    accent_font: str | None = None  # Accent/heading font
    body_font: str | None = None  # Body text font
    logo_url: str | None = None
    cover_image_url: str | None = None
    website_enabled: bool | None = None
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
    team_invite_code: str
    created_at: datetime
    # Template settings
    template_type: str = "solo"
    industry_theme: str = "cosmetology"
    primary_color: str | None = None
    accent_color: str | None = None
    secondary_color: str | None = None
    background_color: str | None = None
    accent_font: str | None = None
    body_font: str | None = None
    logo_url: str | None = None
    cover_image_url: str | None = None
    website_enabled: bool = True
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


class CompanyMembershipResponse(BaseModel):
    """Company with user's membership info for company selection."""
    id: int
    name: str
    slug: str
    type: CompanyType
    logo_url: str | None = None
    # User's role in this company
    is_owner: bool
    is_manager: bool
    is_specialist: bool

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
    industry_theme: str = "cosmetology"
    primary_color: str | None = None
    accent_color: str | None = None
    secondary_color: str | None = None
    background_color: str | None = None
    accent_font: str | None = None
    body_font: str | None = None
    logo_url: str | None = None
    cover_image_url: str | None = None
    # Additional info
    specialization: str | None = None
    working_hours: str | None = None
    social_links: str | None = None

    class Config:
        from_attributes = True
