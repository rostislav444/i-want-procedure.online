from typing import Optional
from pydantic import BaseModel, EmailStr

from app.models.company import CompanyType
from app.models.user import UserRole


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    company_name: str
    company_type: CompanyType = CompanyType.SOLO
    telegram_id: Optional[int] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str
