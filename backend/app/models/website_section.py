"""Website section model for flexible page builder"""
from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, Integer, Boolean, DateTime, func, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.company import Company


class SectionType(str, Enum):
    HERO = "hero"
    ABOUT = "about"
    SERVICES = "services"
    TEAM = "team"
    BENEFITS = "benefits"
    GALLERY = "gallery"
    TESTIMONIALS = "testimonials"
    CONTACT = "contact"
    MAP = "map"
    FAQ = "faq"
    CTA = "cta"
    PRICING = "pricing"
    SCHEDULE = "schedule"
    CUSTOM_TEXT = "custom_text"


# Section types available in Basic plan
BASIC_SECTIONS = {"hero", "about", "services", "contact", "map"}

# Section types only in Premium plan
PREMIUM_SECTIONS = {"team", "gallery", "testimonials", "faq", "cta", "pricing", "schedule", "custom_text"}

# Max sections for Basic plan
MAX_BASIC_SECTIONS = 5


class WebsiteSection(Base):
    """Flexible website section for page builder"""
    __tablename__ = "website_sections"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"),
        index=True
    )

    section_type: Mapped[str] = mapped_column(String(50))  # SectionType enum value
    order: Mapped[int] = mapped_column(Integer, default=0)
    is_visible: Mapped[bool] = mapped_column(Boolean, default=True)

    # Flexible content storage as JSONB
    # Example content for different types:
    # hero: { title, subtitle, background_image, cta_text, cta_link, style }
    # about: { title, text, image, layout: "left" | "right" | "center" }
    # team: { title, members: [{ name, position, photo, bio }] }
    # map: { title, address, coordinates: { lat, lng }, zoom }
    # services: { title, subtitle, display_mode: "grid" | "list" | "cards" }
    # contact: { title, show_phone, show_telegram, show_email, show_address }
    # benefits: { title, items: [{ icon, title, description }] }
    # gallery: { title, images: [{ url, caption }], layout: "grid" | "masonry" }
    # testimonials: { title, reviews: [{ text, author, rating, photo }] }
    # faq: { title, items: [{ question, answer }] }
    # cta: { title, subtitle, button_text, button_link, style }
    # pricing: { title, plans: [{ name, price, features, highlighted }] }
    # schedule: { title, days: [{ day, hours }] }
    # custom_text: { title, content (markdown) }
    content: Mapped[dict] = mapped_column(JSONB, default=dict)

    # Optional style overrides
    # Example: { background_color, text_color, padding, custom_css }
    style: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    company: Mapped["Company"] = relationship(back_populates="website_sections")

    def __repr__(self) -> str:
        return f"<WebsiteSection {self.section_type} order={self.order}>"


# Default sections to create for new companies based on industry theme
DEFAULT_SECTIONS_BY_THEME = {
    "cosmetology": [
        {"type": "hero", "content": {"style": "gradient"}},
        {"type": "about", "content": {"layout": "left"}},
        {"type": "services", "content": {"display_mode": "grid"}},
        {"type": "contact", "content": {"show_phone": True, "show_telegram": True}},
        {"type": "map", "content": {}},
    ],
    "medical": [
        {"type": "hero", "content": {"style": "minimal"}},
        {"type": "team", "content": {}},
        {"type": "services", "content": {"display_mode": "list"}},
        {"type": "benefits", "content": {}},
        {"type": "contact", "content": {"show_phone": True, "show_address": True}},
        {"type": "map", "content": {}},
    ],
    "massage": [
        {"type": "hero", "content": {"style": "image-bg"}},
        {"type": "about", "content": {"layout": "center"}},
        {"type": "services", "content": {"display_mode": "cards"}},
        {"type": "benefits", "content": {}},
        {"type": "schedule", "content": {}},
        {"type": "contact", "content": {"show_phone": True, "show_telegram": True}},
        {"type": "map", "content": {}},
    ],
    "sport": [
        {"type": "hero", "content": {"style": "split"}},
        {"type": "team", "content": {}},
        {"type": "services", "content": {"display_mode": "grid"}},
        {"type": "pricing", "content": {}},
        {"type": "contact", "content": {"show_phone": True}},
    ],
    "beauty": [
        {"type": "hero", "content": {"style": "gradient"}},
        {"type": "about", "content": {"layout": "right"}},
        {"type": "gallery", "content": {"layout": "masonry"}},
        {"type": "services", "content": {"display_mode": "cards"}},
        {"type": "contact", "content": {"show_telegram": True}},
    ],
    "wellness": [
        {"type": "hero", "content": {"style": "minimal"}},
        {"type": "about", "content": {"layout": "center"}},
        {"type": "benefits", "content": {}},
        {"type": "services", "content": {"display_mode": "list"}},
        {"type": "schedule", "content": {}},
        {"type": "contact", "content": {"show_phone": True, "show_telegram": True}},
        {"type": "map", "content": {}},
    ],
}
