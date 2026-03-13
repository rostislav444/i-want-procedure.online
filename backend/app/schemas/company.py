from datetime import datetime
from pydantic import BaseModel

from app.models.company import CompanyType
from app.schemas.city import CityShort


class CompanyCreate(BaseModel):
    name: str
    type: CompanyType = CompanyType.SOLO


class CompanyUpdate(BaseModel):
    name: str | None = None
    type: CompanyType | None = None
    description: str | None = None
    phone: str | None = None
    address: str | None = None
    city_id: int | None = None
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
    # Payment settings
    payment_type: str | None = None  # 'fop_acquiring', 'monobank_jar', 'requisites'
    payment_iban: str | None = None
    payment_bank_name: str | None = None
    payment_recipient_name: str | None = None
    payment_card_number: str | None = None
    payment_monobank_jar: str | None = None
    monobank_token: str | None = None  # Monobank Acquiring token for client payments
    # Educator-specific
    educator_tagline: str | None = None
    educator_credentials: str | None = None
    educator_video_url: str | None = None
    bio: str | None = None
    instagram_url: str | None = None
    youtube_url: str | None = None
    website_url: str | None = None
    students_count: int | None = None
    referral_code: str | None = None
    referral_commission_pct: int | None = None


class CompanyResponse(BaseModel):
    id: int
    name: str
    slug: str
    type: CompanyType
    description: str | None = None
    phone: str | None = None
    address: str | None = None
    city_id: int | None = None
    city_info: CityShort | None = None
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
    # Payment settings
    payment_type: str | None = None
    payment_iban: str | None = None
    payment_bank_name: str | None = None
    payment_recipient_name: str | None = None
    payment_card_number: str | None = None
    payment_monobank_jar: str | None = None
    has_monobank_token: bool = False
    # Educator-specific
    educator_tagline: str | None = None
    educator_credentials: str | None = None
    educator_video_url: str | None = None
    bio: str | None = None
    instagram_url: str | None = None
    youtube_url: str | None = None
    website_url: str | None = None
    students_count: int = 0
    referral_code: str | None = None
    referral_commission_pct: int = 20

    class Config:
        from_attributes = True

    @classmethod
    def from_company(cls, company) -> "CompanyResponse":
        response = cls.model_validate(company)
        if company.city_ref:
            response.city_info = CityShort.model_validate(company.city_ref)
        response.has_monobank_token = bool(company.monobank_token)
        return response


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


class MarketplaceCompanyResponse(BaseModel):
    """Company card for marketplace listing."""
    id: int
    name: str
    slug: str
    type: str
    description: str | None = None
    logo_url: str | None = None
    cover_image_url: str | None = None
    specialization: str | None = None
    industry_theme: str = "cosmetology"
    city_info: CityShort | None = None
    social_links: str | None = None
    services_count: int = 0
    min_price: float | None = None
    max_price: float | None = None
    categories: list[str] = []

    class Config:
        from_attributes = True


class MarketplaceResponse(BaseModel):
    items: list[MarketplaceCompanyResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class CompanyPublicResponse(BaseModel):
    """Public response without sensitive data like invite_code"""
    id: int
    name: str
    slug: str
    description: str | None = None
    phone: str | None = None
    address: str | None = None
    city_id: int | None = None
    city_info: CityShort | None = None
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
    # AI-generated landing
    landing_html: str | None = None

    class Config:
        from_attributes = True

    @classmethod
    def from_company(cls, company) -> "CompanyPublicResponse":
        response = cls.model_validate(company)
        if company.city_ref:
            response.city_info = CityShort.model_validate(company.city_ref)
        return response
