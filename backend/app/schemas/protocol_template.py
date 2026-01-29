"""Protocol template schemas."""
from datetime import datetime
from enum import Enum
from typing import Optional, Any
from pydantic import BaseModel, Field


class FieldType(str, Enum):
    """Available field types for protocol templates."""
    TEXT = "text"                    # Single line text input
    TEXTAREA = "textarea"            # Multi-line text input
    CHIPS = "chips"                  # Single select chips/tags
    CHIPS_MULTI = "chips_multi"      # Multi-select chips/tags
    RATING = "rating"                # Star/number rating
    NUMBER = "number"                # Numeric input
    SELECT = "select"                # Dropdown select
    CHECKBOX = "checkbox"            # Boolean checkbox
    DATE = "date"                    # Date picker
    PHOTOS = "photos"                # Photo upload array
    PRODUCTS = "products"            # Products used (special type)


class TemplateField(BaseModel):
    """A single field in a template section."""
    id: str = Field(..., description="Unique field ID within section")
    type: FieldType
    label: str
    placeholder: Optional[str] = None
    required: bool = False

    # For chips/chips_multi/select
    options: Optional[list[str]] = None

    # For rating
    max: Optional[int] = None  # Max rating value (default 5)

    # For number
    min: Optional[float] = None
    step: Optional[float] = None

    # For photos
    max_photos: Optional[int] = None

    class Config:
        use_enum_values = True


class TemplateSection(BaseModel):
    """A section in a protocol template."""
    id: str = Field(..., description="Unique section ID")
    title: str
    icon: Optional[str] = None  # Lucide icon name
    color: Optional[str] = None  # Tailwind color (blue, violet, green, etc.)
    fields: list[TemplateField] = []


class ProtocolTemplateBase(BaseModel):
    """Base schema for protocol templates."""
    name: str
    description: Optional[str] = None
    sections: list[TemplateSection] = []
    is_default: bool = False
    tags: list[str] = []


class ProtocolTemplateCreate(ProtocolTemplateBase):
    """Schema for creating a protocol template."""
    service_id: Optional[int] = None
    category_id: Optional[int] = None


class ProtocolTemplateUpdate(BaseModel):
    """Schema for updating a protocol template."""
    name: Optional[str] = None
    description: Optional[str] = None
    sections: Optional[list[TemplateSection]] = None
    service_id: Optional[int] = None
    category_id: Optional[int] = None
    is_default: Optional[bool] = None
    tags: Optional[list[str]] = None


class ProtocolTemplateResponse(ProtocolTemplateBase):
    """Schema for protocol template response."""
    id: int
    company_id: Optional[int] = None
    service_id: Optional[int] = None
    category_id: Optional[int] = None
    is_system: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class GenerateTemplateRequest(BaseModel):
    """Request to generate protocol template from service name."""
    service_name: str
    service_description: Optional[str] = None
    category_name: Optional[str] = None
    # Optional hints for generation
    hints: Optional[str] = None


class GenerateTemplateResponse(BaseModel):
    """Response with AI-generated template."""
    name: str
    description: str
    sections: list[TemplateSection]
    suggested_tags: list[str]


class CopyTemplateRequest(BaseModel):
    """Request to copy a template."""
    source_template_id: int
    new_name: Optional[str] = None
    target_service_id: Optional[int] = None
    target_category_id: Optional[int] = None
