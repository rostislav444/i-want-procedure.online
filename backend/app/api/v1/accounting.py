from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession, CurrentUser
from app.models.expense import Expense, ExpenseFrequency
from app.models.appointment import Appointment, AppointmentStatus
from app.models.inventory import StockMovement, MovementType
from app.models.service import Service

router = APIRouter(prefix="/accounting")


# === Expense Schemas ===

class ExpenseCreate(BaseModel):
    name: str
    amount: Decimal
    frequency: str = ExpenseFrequency.MONTHLY.value
    category: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool = True
    effective_from: Optional[date] = None
    effective_to: Optional[date] = None


class ExpenseUpdate(BaseModel):
    name: Optional[str] = None
    amount: Optional[Decimal] = None
    frequency: Optional[str] = None
    category: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None
    effective_from: Optional[date] = None
    effective_to: Optional[date] = None


class ExpenseResponse(BaseModel):
    id: int
    company_id: int
    name: str
    amount: Decimal
    frequency: str
    category: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool
    effective_from: Optional[date] = None
    effective_to: Optional[date] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# === Analytics Schemas ===

class AnalyticsPeriod(BaseModel):
    period: str
    revenue: Decimal
    material_cost: Decimal
    fixed_cost_allocation: Decimal
    gross_profit: Decimal
    net_profit: Decimal
    appointment_count: int
    avg_revenue_per_appointment: Optional[Decimal] = None


class AnalyticsSummary(BaseModel):
    periods: list[AnalyticsPeriod]
    totals: AnalyticsPeriod
    top_services: list[dict]


# === Expense CRUD ===

@router.get("/expenses", response_model=list[ExpenseResponse])
async def get_expenses(
    current_user: CurrentUser,
    db: DbSession,
):
    result = await db.execute(
        select(Expense)
        .where(Expense.company_id == current_user.company_id)
        .order_by(Expense.created_at.desc())
    )
    return result.scalars().all()


@router.post("/expenses", response_model=ExpenseResponse, status_code=201)
async def create_expense(
    data: ExpenseCreate,
    current_user: CurrentUser,
    db: DbSession,
):
    expense = Expense(
        company_id=current_user.company_id,
        name=data.name,
        amount=data.amount,
        frequency=data.frequency,
        category=data.category,
        notes=data.notes,
        is_active=data.is_active,
        effective_from=data.effective_from,
        effective_to=data.effective_to,
    )
    db.add(expense)
    await db.commit()
    await db.refresh(expense)
    return expense


@router.patch("/expenses/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    expense_id: int,
    data: ExpenseUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    result = await db.execute(
        select(Expense).where(
            Expense.id == expense_id,
            Expense.company_id == current_user.company_id,
        )
    )
    expense = result.scalar_one_or_none()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(expense, field, value)

    await db.commit()
    await db.refresh(expense)
    return expense


@router.delete("/expenses/{expense_id}", status_code=204)
async def delete_expense(
    expense_id: int,
    current_user: CurrentUser,
    db: DbSession,
):
    result = await db.execute(
        select(Expense).where(
            Expense.id == expense_id,
            Expense.company_id == current_user.company_id,
        )
    )
    expense = result.scalar_one_or_none()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    await db.delete(expense)
    await db.commit()


# === Analytics ===

def _prorate_expense(expense: Expense, date_from: date, date_to: date) -> Decimal:
    """Пропорційний розподіл витрати на обраний період."""
    # Перевіряємо чи витрата активна в обраному періоді
    if expense.effective_from and expense.effective_from > date_to:
        return Decimal("0")
    if expense.effective_to and expense.effective_to < date_from:
        return Decimal("0")

    days_in_range = (date_to - date_from).days + 1

    if expense.frequency == ExpenseFrequency.ONE_TIME.value:
        # Одноразова — рахуємо тільки якщо effective_from в діапазоні
        if expense.effective_from and date_from <= expense.effective_from <= date_to:
            return expense.amount
        # Якщо немає effective_from, не враховуємо
        return Decimal("0")
    elif expense.frequency == ExpenseFrequency.MONTHLY.value:
        return expense.amount * Decimal(str(days_in_range)) / Decimal("30")
    elif expense.frequency == ExpenseFrequency.QUARTERLY.value:
        return expense.amount * Decimal(str(days_in_range)) / Decimal("90")
    elif expense.frequency == ExpenseFrequency.YEARLY.value:
        return expense.amount * Decimal(str(days_in_range)) / Decimal("365")

    return Decimal("0")


@router.get("/analytics", response_model=AnalyticsSummary)
async def get_analytics(
    current_user: CurrentUser,
    db: DbSession,
    date_from: date = Query(...),
    date_to: date = Query(...),
    group_by: str = Query("month", regex="^(day|week|month)$"),
):
    """Аналітика доходів та витрат за період."""
    company_id = current_user.company_id

    # Визначаємо SQL функцію групування
    if group_by == "day":
        trunc_func = func.date_trunc("day", Appointment.date)
    elif group_by == "week":
        trunc_func = func.date_trunc("week", Appointment.date)
    else:
        trunc_func = func.date_trunc("month", Appointment.date)

    # Виручка по періодах
    revenue_result = await db.execute(
        select(
            trunc_func.label("period"),
            func.sum(Appointment.service_price).label("revenue"),
            func.count(Appointment.id).label("count"),
        )
        .where(
            Appointment.company_id == company_id,
            Appointment.status == AppointmentStatus.COMPLETED,
            Appointment.date >= date_from,
            Appointment.date <= date_to,
        )
        .group_by("period")
        .order_by("period")
    )
    revenue_rows = revenue_result.all()

    # Витрати матеріалів по періодах
    cost_result = await db.execute(
        select(
            trunc_func.label("period"),
            func.sum(func.abs(StockMovement.quantity) * StockMovement.unit_price).label("material_cost"),
        )
        .join(Appointment, StockMovement.appointment_id == Appointment.id)
        .where(
            StockMovement.company_id == company_id,
            Appointment.status == AppointmentStatus.COMPLETED,
            StockMovement.movement_type == MovementType.OUTGOING,
            StockMovement.unit_price.is_not(None),
            Appointment.date >= date_from,
            Appointment.date <= date_to,
        )
        .group_by("period")
        .order_by("period")
    )
    cost_rows = {str(row.period): row.material_cost or Decimal("0") for row in cost_result.all()}

    # Топ послуг за виручкою
    top_svc_result = await db.execute(
        select(
            Service.name,
            func.sum(Appointment.service_price).label("revenue"),
            func.count(Appointment.id).label("count"),
        )
        .join(Service, Appointment.service_id == Service.id)
        .where(
            Appointment.company_id == company_id,
            Appointment.status == AppointmentStatus.COMPLETED,
            Appointment.date >= date_from,
            Appointment.date <= date_to,
        )
        .group_by(Service.name)
        .order_by(func.sum(Appointment.service_price).desc())
        .limit(10)
    )
    top_services = [
        {"name": row.name, "revenue": float(row.revenue or 0), "count": row.count}
        for row in top_svc_result.all()
    ]

    # Постійні витрати
    expenses_result = await db.execute(
        select(Expense).where(
            Expense.company_id == company_id,
            Expense.is_active == True,
        )
    )
    active_expenses = expenses_result.scalars().all()
    total_fixed_cost = sum(
        (_prorate_expense(e, date_from, date_to) for e in active_expenses),
        Decimal("0"),
    )

    # Збираємо періоди
    periods = []
    total_revenue = Decimal("0")
    total_material = Decimal("0")
    total_count = 0

    for row in revenue_rows:
        period_str = str(row.period)
        if group_by == "day":
            period_str = row.period.strftime("%Y-%m-%d") if hasattr(row.period, 'strftime') else period_str[:10]
        elif group_by == "week":
            period_str = row.period.strftime("%Y-%m-%d") if hasattr(row.period, 'strftime') else period_str[:10]
        else:
            period_str = row.period.strftime("%Y-%m") if hasattr(row.period, 'strftime') else period_str[:7]

        revenue = row.revenue or Decimal("0")
        material = cost_rows.get(str(row.period), Decimal("0"))
        count = row.count or 0

        total_revenue += revenue
        total_material += material
        total_count += count

        gross = revenue - material
        # Пропорція постійних витрат на цей період (грубо)
        period_fixed = Decimal("0")
        net = gross - period_fixed

        periods.append(AnalyticsPeriod(
            period=period_str,
            revenue=revenue,
            material_cost=material,
            fixed_cost_allocation=period_fixed,
            gross_profit=gross,
            net_profit=net,
            appointment_count=count,
            avg_revenue_per_appointment=round(revenue / count, 2) if count > 0 else None,
        ))

    total_gross = total_revenue - total_material
    total_net = total_gross - total_fixed_cost

    totals = AnalyticsPeriod(
        period="total",
        revenue=total_revenue,
        material_cost=total_material,
        fixed_cost_allocation=round(total_fixed_cost, 2),
        gross_profit=total_gross,
        net_profit=round(total_net, 2),
        appointment_count=total_count,
        avg_revenue_per_appointment=round(total_revenue / total_count, 2) if total_count > 0 else None,
    )

    return AnalyticsSummary(
        periods=periods,
        totals=totals,
        top_services=top_services,
    )
