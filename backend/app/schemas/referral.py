from datetime import datetime
from pydantic import BaseModel


class ReferralDashboardResponse(BaseModel):
    total_referred: int = 0
    active_referred: int = 0
    total_earned: int = 0  # kopecks
    available_balance: int = 0  # kopecks (earned - paid out)
    total_paid_out: int = 0  # kopecks
    referral_code: str | None = None
    referral_link: str = ""
    commission_pct: int = 20


class ReferredUserResponse(BaseModel):
    id: int
    referred_user_name: str
    referred_company_name: str | None = None
    is_active: bool = True
    total_earned: int = 0  # kopecks
    created_at: datetime

    class Config:
        from_attributes = True


class ReferralEarningResponse(BaseModel):
    id: int
    amount: int  # kopecks
    commission_pct: int
    payment_amount: int = 0  # original payment kopecks
    referred_company_name: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class PayoutRequestCreate(BaseModel):
    amount: int  # kopecks
    payout_method: str  # card, iban
    payout_details: str  # JSON with card/iban details


class PayoutResponse(BaseModel):
    id: int
    amount: int
    status: str
    payout_method: str | None = None
    notes: str | None = None
    created_at: datetime
    completed_at: datetime | None = None

    class Config:
        from_attributes = True
