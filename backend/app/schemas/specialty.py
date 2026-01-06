from datetime import datetime
from pydantic import BaseModel


class SpecialtyCreate(BaseModel):
    name: str
    description: str | None = None
    color: str | None = None


class SpecialtyUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    color: str | None = None


class SpecialtyResponse(BaseModel):
    id: int
    company_id: int
    name: str
    description: str | None = None
    color: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class SpecialtyWithUsers(SpecialtyResponse):
    """Specialty with list of users who have this specialty"""
    users: list["UserBasic"] = []


class UserBasic(BaseModel):
    """Basic user info for specialty list"""
    id: int
    first_name: str
    last_name: str

    class Config:
        from_attributes = True


# Update forward reference
SpecialtyWithUsers.model_rebuild()
