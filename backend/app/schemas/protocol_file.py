"""Protocol file schemas."""
from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class FileType(str, Enum):
    """Type of protocol photo."""
    BEFORE = "before"
    AFTER = "after"


class ProtocolFileBase(BaseModel):
    """Base schema for protocol files."""
    file_type: FileType


class ProtocolFileCreate(ProtocolFileBase):
    """Schema for creating a protocol file (internal use)."""
    protocol_id: Optional[int] = None
    company_id: int
    filename: str
    original_filename: str
    file_path: str
    file_size: int
    mime_type: str
    uploaded_by: Optional[int] = None


class ProtocolFileResponse(BaseModel):
    """Schema for protocol file response."""
    id: int
    protocol_id: Optional[int] = None
    file_type: FileType
    filename: str
    original_filename: str
    file_path: str
    file_size: int
    mime_type: str
    show_in_portfolio: bool = False
    uploaded_by: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ProtocolFileUploadResponse(BaseModel):
    """Response after uploading a file."""
    id: int
    file_type: FileType
    file_path: str
    original_filename: str
    file_size: int
    show_in_portfolio: bool = False

    class Config:
        from_attributes = True


class ProtocolFileUpdate(BaseModel):
    """Schema for updating a protocol file."""
    show_in_portfolio: Optional[bool] = None


class ProtocolFileAttach(BaseModel):
    """Schema for attaching files to a protocol."""
    file_ids: list[int] = Field(..., description="List of file IDs to attach")
