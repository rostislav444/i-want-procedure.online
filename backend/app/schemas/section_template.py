"""Section template schemas."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class SectionTemplateBase(BaseModel):
    name: str
    description: Optional[str] = None
    section_type: str = "hero"
    html_template: str
    variables_schema: dict = {}
    tags: list[str] = []


class SectionTemplateCreate(SectionTemplateBase):
    pass


class SectionTemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    html_template: Optional[str] = None
    variables_schema: Optional[dict] = None
    tags: Optional[list[str]] = None


class SectionTemplateResponse(SectionTemplateBase):
    id: int
    preview_image_url: Optional[str] = None
    source_image_url: Optional[str] = None
    is_system: bool
    created_by_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class GenerateFromImageRequest(BaseModel):
    """Request to generate section template from image."""
    image_base64: str  # Base64 encoded image
    prompt: Optional[str] = None  # Additional instructions
    name: Optional[str] = None  # Template name


class GenerateFromImageResponse(BaseModel):
    """Response with generated template."""
    html_template: str
    variables_schema: dict
    suggested_name: str
    suggested_tags: list[str]


class RenderTemplateRequest(BaseModel):
    """Request to render a template with variables."""
    template_id: int
    variables: dict  # {"title": "My Title", "subtitle": "My subtitle", ...}


class RenderTemplateResponse(BaseModel):
    """Rendered HTML."""
    html: str
