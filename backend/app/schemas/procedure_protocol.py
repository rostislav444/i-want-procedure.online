"""Pydantic schemas for procedure protocols."""
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel

from app.schemas.protocol_template import TemplateSection


class ProtocolProductCreate(BaseModel):
    """Schema for creating a product in protocol."""
    name: str
    manufacturer: Optional[str] = None
    quantity: Optional[str] = None
    batch_number: Optional[str] = None
    notes: Optional[str] = None


class ProtocolProductUpdate(BaseModel):
    """Schema for updating a product in protocol."""
    name: Optional[str] = None
    manufacturer: Optional[str] = None
    quantity: Optional[str] = None
    batch_number: Optional[str] = None
    notes: Optional[str] = None


class ProtocolProductResponse(BaseModel):
    """Schema for product response."""
    id: int
    name: str
    manufacturer: Optional[str] = None
    quantity: Optional[str] = None
    batch_number: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class ProcedureProtocolCreate(BaseModel):
    """Schema for creating a procedure protocol."""
    appointment_id: int
    # Dynamic template support
    template_id: Optional[int] = None
    template_data: Optional[dict[str, Any]] = None  # {"section_id": {"field_id": value, ...}, ...}
    # Legacy fields (for backward compatibility)
    skin_condition: Optional[str] = None
    complaints: Optional[str] = None
    procedure_notes: Optional[str] = None
    technique_used: Optional[str] = None
    results: Optional[str] = None
    recommendations: Optional[str] = None
    next_visit_notes: Optional[str] = None
    photos_before: Optional[list[str]] = None
    photos_after: Optional[list[str]] = None
    products_used: Optional[list[ProtocolProductCreate]] = None


class ProcedureProtocolUpdate(BaseModel):
    """Schema for updating a procedure protocol."""
    # Dynamic template support
    template_id: Optional[int] = None
    template_data: Optional[dict[str, Any]] = None
    # Legacy fields
    skin_condition: Optional[str] = None
    complaints: Optional[str] = None
    procedure_notes: Optional[str] = None
    technique_used: Optional[str] = None
    results: Optional[str] = None
    recommendations: Optional[str] = None
    next_visit_notes: Optional[str] = None
    photos_before: Optional[list[str]] = None
    photos_after: Optional[list[str]] = None


class ProtocolTemplateInfo(BaseModel):
    """Embedded template info for protocol response."""
    id: int
    name: str
    sections: list[TemplateSection] = []

    class Config:
        from_attributes = True


class ProcedureProtocolResponse(BaseModel):
    """Schema for protocol response."""
    id: int
    appointment_id: int
    specialist_id: Optional[int] = None
    # Dynamic template support
    template_id: Optional[int] = None
    template_data: Optional[dict[str, Any]] = None
    template: Optional[ProtocolTemplateInfo] = None  # Embedded template info
    # Legacy fields
    skin_condition: Optional[str] = None
    complaints: Optional[str] = None
    procedure_notes: Optional[str] = None
    technique_used: Optional[str] = None
    results: Optional[str] = None
    recommendations: Optional[str] = None
    next_visit_notes: Optional[str] = None
    photos_before: Optional[list[str]] = None
    photos_after: Optional[list[str]] = None
    products_used: list[ProtocolProductResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
