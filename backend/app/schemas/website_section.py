"""Schemas for website sections"""
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class WebsiteSectionBase(BaseModel):
    """Base schema for website section"""
    section_type: str
    order: int = 0
    is_visible: bool = True
    content: dict[str, Any] = Field(default_factory=dict)
    style: dict[str, Any] | None = None


class WebsiteSectionCreate(BaseModel):
    """Schema for creating a website section"""
    section_type: str
    content: dict[str, Any] = Field(default_factory=dict)
    style: dict[str, Any] | None = None
    # order will be auto-assigned to the end


class WebsiteSectionUpdate(BaseModel):
    """Schema for updating a website section"""
    content: dict[str, Any] | None = None
    style: dict[str, Any] | None = None
    is_visible: bool | None = None


class WebsiteSectionResponse(WebsiteSectionBase):
    """Schema for website section response"""
    id: int
    company_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SectionOrderItem(BaseModel):
    """Schema for section reordering"""
    id: int
    order: int


class SectionTypeInfo(BaseModel):
    """Information about a section type"""
    type: str
    name: str
    description: str
    icon: str
    is_premium: bool
    default_content: dict[str, Any]


# List of all section types with their metadata
SECTION_TYPES_INFO: list[SectionTypeInfo] = [
    SectionTypeInfo(
        type="hero",
        name="Hero",
        description="Головний банер з назвою та кнопкою",
        icon="home",
        is_premium=False,
        default_content={"style": "gradient", "title": "", "subtitle": "", "cta_text": "Записатися", "cta_link": ""}
    ),
    SectionTypeInfo(
        type="about",
        name="Про нас",
        description="Інформація про спеціаліста або клініку",
        icon="user",
        is_premium=False,
        default_content={"layout": "left", "title": "Про нас", "text": "", "image": ""}
    ),
    SectionTypeInfo(
        type="services",
        name="Послуги",
        description="Прайс-лист послуг",
        icon="briefcase",
        is_premium=False,
        default_content={"display_mode": "grid", "title": "Наші послуги", "subtitle": ""}
    ),
    SectionTypeInfo(
        type="team",
        name="Команда",
        description="Список спеціалістів клініки",
        icon="users",
        is_premium=True,
        default_content={"title": "Наша команда", "members": []}
    ),
    SectionTypeInfo(
        type="benefits",
        name="Переваги",
        description="Чому обирають нас",
        icon="star",
        is_premium=False,
        default_content={"title": "Наші переваги", "items": []}
    ),
    SectionTypeInfo(
        type="gallery",
        name="Галерея",
        description="Фотогалерея робіт",
        icon="image",
        is_premium=True,
        default_content={"title": "Галерея", "layout": "grid", "images": []}
    ),
    SectionTypeInfo(
        type="testimonials",
        name="Відгуки",
        description="Відгуки клієнтів",
        icon="message-circle",
        is_premium=True,
        default_content={"title": "Відгуки", "reviews": []}
    ),
    SectionTypeInfo(
        type="contact",
        name="Контакти",
        description="Контактна інформація",
        icon="phone",
        is_premium=False,
        default_content={"title": "Контакти", "show_phone": True, "show_telegram": True, "show_email": False, "show_address": True}
    ),
    SectionTypeInfo(
        type="map",
        name="Карта",
        description="Карта з адресою (OpenStreetMap)",
        icon="map-pin",
        is_premium=False,
        default_content={"title": "Як нас знайти", "address": "", "coordinates": None, "zoom": 15}
    ),
    SectionTypeInfo(
        type="faq",
        name="FAQ",
        description="Часті запитання",
        icon="help-circle",
        is_premium=True,
        default_content={"title": "Часті запитання", "items": []}
    ),
    SectionTypeInfo(
        type="cta",
        name="Заклик до дії",
        description="Блок із закликом записатися",
        icon="zap",
        is_premium=True,
        default_content={"title": "Готові записатися?", "subtitle": "", "button_text": "Записатися", "button_link": "", "style": "gradient"}
    ),
    SectionTypeInfo(
        type="pricing",
        name="Ціни",
        description="Таблиця тарифів / пакетів",
        icon="credit-card",
        is_premium=True,
        default_content={"title": "Тарифи", "plans": []}
    ),
    SectionTypeInfo(
        type="schedule",
        name="Графік роботи",
        description="Години роботи по днях",
        icon="clock",
        is_premium=True,
        default_content={"title": "Графік роботи", "days": []}
    ),
    SectionTypeInfo(
        type="custom_text",
        name="Текст",
        description="Довільний текстовий блок (Markdown)",
        icon="file-text",
        is_premium=True,
        default_content={"title": "", "content": ""}
    ),
]

# Create a dict for quick lookup
SECTION_TYPES_MAP = {s.type: s for s in SECTION_TYPES_INFO}


# Industry themes info
class IndustryThemeInfo(BaseModel):
    """Information about an industry theme"""
    id: str
    name: str
    description: str
    primary_color: str
    gradient_from: str
    gradient_to: str


INDUSTRY_THEMES_INFO: list[IndustryThemeInfo] = [
    IndustryThemeInfo(
        id="cosmetology",
        name="Косметологія",
        description="Рожевий, елегантний стиль з градієнтами",
        primary_color="#e91e63",
        gradient_from="#ec4899",
        gradient_to="#f472b6"
    ),
    IndustryThemeInfo(
        id="medical",
        name="Медицина",
        description="Синій, професійний, чистий дизайн",
        primary_color="#0891b2",
        gradient_from="#0ea5e9",
        gradient_to="#22d3ee"
    ),
    IndustryThemeInfo(
        id="massage",
        name="Масаж",
        description="Зелений, спокійний, природний",
        primary_color="#059669",
        gradient_from="#10b981",
        gradient_to="#34d399"
    ),
    IndustryThemeInfo(
        id="sport",
        name="Спорт",
        description="Оранжевий, динамічний, енергійний",
        primary_color="#f97316",
        gradient_from="#f97316",
        gradient_to="#fb923c"
    ),
    IndustryThemeInfo(
        id="beauty",
        name="Краса",
        description="Фіолетовий, люксовий з золотими акцентами",
        primary_color="#a855f7",
        gradient_from="#a855f7",
        gradient_to="#c084fc"
    ),
    IndustryThemeInfo(
        id="wellness",
        name="Wellness",
        description="Бірюзовий, zen, мінімалістичний",
        primary_color="#14b8a6",
        gradient_from="#2dd4bf",
        gradient_to="#5eead4"
    ),
]
