"""Position schemas."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class PositionCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = None
    order: int = 0


class PositionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    order: Optional[int] = None


class PositionResponse(BaseModel):
    id: int
    company_id: int
    name: str
    description: Optional[str] = None
    color: Optional[str] = None
    order: int
    created_at: datetime
    services_count: int = 0

    class Config:
        from_attributes = True
