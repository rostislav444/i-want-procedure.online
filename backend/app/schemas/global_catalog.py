from datetime import datetime
from typing import Optional
from pydantic import BaseModel


# === Global Category schemas ===

class GlobalCategoryResponse(BaseModel):
    id: int
    parent_id: Optional[int] = None
    name: str
    name_en: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    order: int
    is_active: bool
    is_ai_created: bool = False

    class Config:
        from_attributes = True


class GlobalCategoryTreeResponse(BaseModel):
    id: int
    parent_id: Optional[int] = None
    name: str
    name_en: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    order: int
    is_active: bool
    is_ai_created: bool = False
    children: list["GlobalCategoryTreeResponse"] = []
    templates: list["GlobalTemplateResponse"] = []

    class Config:
        from_attributes = True


class GlobalCategoryCreate(BaseModel):
    parent_id: Optional[int] = None
    name: str
    name_en: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    order: int = 0


class GlobalCategoryUpdate(BaseModel):
    parent_id: Optional[int] = None
    name: Optional[str] = None
    name_en: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None


# === Global Template schemas ===

class GlobalTemplateResponse(BaseModel):
    id: int
    category_id: int
    name: str
    name_en: Optional[str] = None
    description: Optional[str] = None
    default_duration_minutes: int
    is_active: bool
    order: int

    class Config:
        from_attributes = True


class GlobalTemplateWithCategoryResponse(BaseModel):
    id: int
    category_id: int
    name: str
    name_en: Optional[str] = None
    description: Optional[str] = None
    default_duration_minutes: int
    is_active: bool
    order: int
    category: GlobalCategoryResponse

    class Config:
        from_attributes = True


class GlobalTemplateCreate(BaseModel):
    category_id: int
    name: str
    name_en: Optional[str] = None
    description: Optional[str] = None
    default_duration_minutes: int = 60
    order: int = 0


class GlobalTemplateUpdate(BaseModel):
    category_id: Optional[int] = None
    name: Optional[str] = None
    name_en: Optional[str] = None
    description: Optional[str] = None
    default_duration_minutes: Optional[int] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None


# === Bulk adopt from catalog ===

class AdoptFromCatalogRequest(BaseModel):
    """Майстер обирає шаблони з глобального каталогу для додавання до себе."""
    template_ids: list[int]
    category_id: Optional[int] = None  # Target company category (auto-create if None)


class CustomServiceRequest(BaseModel):
    """Майстер створює кастомну послугу, якої немає в каталозі."""
    name: str
    description: Optional[str] = None
    duration_minutes: int = 60
    price: float
    category_name: str  # Will create custom category if doesn't exist


# Resolve forward references
GlobalCategoryTreeResponse.model_rebuild()
