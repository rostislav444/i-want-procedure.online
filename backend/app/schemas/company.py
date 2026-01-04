from datetime import datetime
from pydantic import BaseModel

from app.models.company import CompanyType


class CompanyCreate(BaseModel):
    name: str
    type: CompanyType = CompanyType.SOLO


class CompanyResponse(BaseModel):
    id: int
    name: str
    type: CompanyType
    invite_code: str
    created_at: datetime

    class Config:
        from_attributes = True
