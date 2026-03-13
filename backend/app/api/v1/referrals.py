"""Referral system endpoints for educator companies."""
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select, func

from app.api.deps import DbSession, CurrentUser
from app.models.company import Company
from app.models.referral import Referral, ReferralEarning, ReferralPayout
from app.models.user import User
from app.core.config import settings
from app.schemas.referral import (
    ReferralDashboardResponse,
    ReferredUserResponse,
    ReferralEarningResponse,
    PayoutRequestCreate,
    PayoutResponse,
)

router = APIRouter(prefix="/referrals")


async def _require_company(current_user, db: DbSession):
    company_id = current_user.company_id
    if not company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Company not found",
        )
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Company not found",
        )
    return company


@router.get("/dashboard", response_model=ReferralDashboardResponse)
async def get_referral_dashboard(current_user: CurrentUser, db: DbSession):
    company = await _require_company(current_user, db)

    # Count referrals
    total_result = await db.execute(
        select(func.count(Referral.id))
        .where(Referral.referrer_company_id == company.id)
    )
    total_referred = total_result.scalar() or 0

    active_result = await db.execute(
        select(func.count(Referral.id))
        .where(Referral.referrer_company_id == company.id, Referral.is_active == True)
    )
    active_referred = active_result.scalar() or 0

    # Total earned
    earned_result = await db.execute(
        select(func.coalesce(func.sum(ReferralEarning.amount), 0))
        .join(Referral, Referral.id == ReferralEarning.referral_id)
        .where(Referral.referrer_company_id == company.id)
    )
    total_earned = earned_result.scalar() or 0

    # Total paid out
    paid_result = await db.execute(
        select(func.coalesce(func.sum(ReferralPayout.amount), 0))
        .where(
            ReferralPayout.company_id == company.id,
            ReferralPayout.status == "completed",
        )
    )
    total_paid_out = paid_result.scalar() or 0

    frontend_url = settings.FRONTEND_URL if hasattr(settings, 'FRONTEND_URL') else "http://localhost:3000"

    return ReferralDashboardResponse(
        total_referred=total_referred,
        active_referred=active_referred,
        total_earned=total_earned,
        available_balance=total_earned - total_paid_out,
        total_paid_out=total_paid_out,
        referral_code=company.referral_code,
        referral_link=f"{frontend_url}/auth/register?ref={company.referral_code}" if company.referral_code else "",
        commission_pct=company.referral_commission_pct,
    )


@router.get("/referred-users", response_model=list[ReferredUserResponse])
async def get_referred_users(current_user: CurrentUser, db: DbSession):
    company = await _require_company(current_user, db)

    result = await db.execute(
        select(Referral)
        .where(Referral.referrer_company_id == company.id)
        .order_by(Referral.created_at.desc())
    )
    referrals = result.scalars().all()

    responses = []
    for ref in referrals:
        # Get user info
        user_result = await db.execute(
            select(User).where(User.id == ref.referred_user_id)
        )
        user = user_result.scalar_one_or_none()

        # Get referred company name
        company_name = None
        if ref.referred_company_id:
            comp_result = await db.execute(
                select(Company.name).where(Company.id == ref.referred_company_id)
            )
            company_name = comp_result.scalar()

        # Total earned from this referral
        earned_result = await db.execute(
            select(func.coalesce(func.sum(ReferralEarning.amount), 0))
            .where(ReferralEarning.referral_id == ref.id)
        )
        total_earned = earned_result.scalar() or 0

        responses.append(ReferredUserResponse(
            id=ref.id,
            referred_user_name=f"{user.first_name} {user.last_name}" if user else "Unknown",
            referred_company_name=company_name,
            is_active=ref.is_active,
            total_earned=total_earned,
            created_at=ref.created_at,
        ))

    return responses


@router.get("/earnings", response_model=list[ReferralEarningResponse])
async def get_earnings(current_user: CurrentUser, db: DbSession):
    company = await _require_company(current_user, db)

    result = await db.execute(
        select(ReferralEarning)
        .join(Referral, Referral.id == ReferralEarning.referral_id)
        .where(Referral.referrer_company_id == company.id)
        .order_by(ReferralEarning.created_at.desc())
        .limit(100)
    )
    earnings = result.scalars().all()

    responses = []
    for e in earnings:
        # Get referred company name
        ref_result = await db.execute(
            select(Referral).where(Referral.id == e.referral_id)
        )
        ref = ref_result.scalar_one_or_none()
        company_name = None
        if ref and ref.referred_company_id:
            comp_result = await db.execute(
                select(Company.name).where(Company.id == ref.referred_company_id)
            )
            company_name = comp_result.scalar()

        responses.append(ReferralEarningResponse(
            id=e.id,
            amount=e.amount,
            commission_pct=e.commission_pct,
            referred_company_name=company_name,
            created_at=e.created_at,
        ))

    return responses


@router.get("/payouts", response_model=list[PayoutResponse])
async def get_payouts(current_user: CurrentUser, db: DbSession):
    company = await _require_company(current_user, db)

    result = await db.execute(
        select(ReferralPayout)
        .where(ReferralPayout.company_id == company.id)
        .order_by(ReferralPayout.created_at.desc())
    )
    return result.scalars().all()


@router.post("/payouts/request", response_model=PayoutResponse, status_code=201)
async def request_payout(
    data: PayoutRequestCreate,
    current_user: CurrentUser,
    db: DbSession,
):
    company = await _require_company(current_user, db)

    # Calculate available balance
    earned_result = await db.execute(
        select(func.coalesce(func.sum(ReferralEarning.amount), 0))
        .join(Referral, Referral.id == ReferralEarning.referral_id)
        .where(Referral.referrer_company_id == company.id)
    )
    total_earned = earned_result.scalar() or 0

    paid_result = await db.execute(
        select(func.coalesce(func.sum(ReferralPayout.amount), 0))
        .where(
            ReferralPayout.company_id == company.id,
            ReferralPayout.status.in_(["pending", "completed"]),
        )
    )
    total_paid = paid_result.scalar() or 0

    available = total_earned - total_paid
    if data.amount > available:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient balance. Available: {available} kopecks",
        )

    payout = ReferralPayout(
        company_id=company.id,
        amount=data.amount,
        payout_method=data.payout_method,
        payout_details=data.payout_details,
        status="pending",
    )
    db.add(payout)
    await db.flush()
    return payout
