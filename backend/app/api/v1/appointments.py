from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import DbSession, CurrentUser
from app.models.appointment import Appointment, AppointmentStatus
from app.models.schedule import Schedule, ScheduleException, ScheduleExceptionType
from app.models.service import Service
from app.models.client import Client, ClientCompany
from app.models.user import User
from app.models.inventory import ServiceInventoryItem, StockMovement, StockBatch, MovementType, InventoryItem
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentCreateAdmin,
    AppointmentUpdate,
    AppointmentResponse,
    AvailableSlot,
)
from bots.notifications import notify_client_appointment_confirmed, notify_client_appointment_cancelled
from app.services.google_calendar import update_appointment_in_calendar


# === Schemas for financials ===

class ConsumptionItemResponse(BaseModel):
    movement_id: int
    item_id: int
    item_name: str
    quantity: int
    unit_price: Optional[Decimal] = None
    total_cost: Optional[Decimal] = None
    unit: str
    batch_id: Optional[int] = None
    batch_number: Optional[str] = None

    class Config:
        from_attributes = True


class AppointmentFinancialsResponse(BaseModel):
    appointment_id: int
    revenue: Optional[Decimal] = None
    material_cost: Decimal
    profit: Optional[Decimal] = None
    margin_pct: Optional[float] = None
    consumption: list[ConsumptionItemResponse]


class AddConsumptionRequest(BaseModel):
    item_id: int
    quantity: int
    unit_price: Optional[Decimal] = None
    batch_id: Optional[int] = None


class UpdateConsumptionRequest(BaseModel):
    quantity: Optional[int] = None
    unit_price: Optional[Decimal] = None

router = APIRouter(prefix="/appointments")


async def deduct_from_batches_fifo(
    db: AsyncSession,
    company_id: int,
    item_id: int,
    quantity: int,
    appointment_id: int,
    performed_by_id: int,
    notes: str,
    specific_batch_id: Optional[int] = None,
) -> list[StockMovement]:
    """
    FIFO-списання з партій. Повертає створені movements.
    Якщо specific_batch_id — списує з конкретної партії.
    """
    movements = []
    remaining = quantity

    if specific_batch_id:
        # Specific batch
        batch_result = await db.execute(
            select(StockBatch).where(
                StockBatch.id == specific_batch_id,
                StockBatch.item_id == item_id,
                StockBatch.company_id == company_id,
            )
        )
        batch = batch_result.scalar_one_or_none()
        if batch and batch.quantity_remaining > 0:
            take = min(remaining, batch.quantity_remaining)
            batch.quantity_remaining -= take
            movement = StockMovement(
                company_id=company_id,
                item_id=item_id,
                movement_type=MovementType.OUTGOING,
                quantity=-take,
                unit_price=batch.purchase_price,
                appointment_id=appointment_id,
                performed_by=performed_by_id,
                notes=notes,
                batch_id=batch.id,
                batch_number=batch.batch_number,
            )
            db.add(movement)
            movements.append(movement)
            remaining -= take
    else:
        # FIFO — oldest batches first
        batches_result = await db.execute(
            select(StockBatch).where(
                StockBatch.item_id == item_id,
                StockBatch.company_id == company_id,
                StockBatch.quantity_remaining > 0,
            ).order_by(StockBatch.received_at.asc())
        )
        batches = batches_result.scalars().all()

        for batch in batches:
            if remaining <= 0:
                break
            take = min(remaining, batch.quantity_remaining)
            batch.quantity_remaining -= take
            movement = StockMovement(
                company_id=company_id,
                item_id=item_id,
                movement_type=MovementType.OUTGOING,
                quantity=-take,
                unit_price=batch.purchase_price,
                appointment_id=appointment_id,
                performed_by=performed_by_id,
                notes=notes,
                batch_id=batch.id,
                batch_number=batch.batch_number,
            )
            db.add(movement)
            movements.append(movement)
            remaining -= take

    # If no batch found (or not enough), create movement without batch
    if remaining > 0:
        # Fallback: get price from InventoryItem
        item_result = await db.execute(
            select(InventoryItem).where(InventoryItem.id == item_id)
        )
        item = item_result.scalar_one_or_none()
        movement = StockMovement(
            company_id=company_id,
            item_id=item_id,
            movement_type=MovementType.OUTGOING,
            quantity=-remaining,
            unit_price=item.purchase_price if item else None,
            appointment_id=appointment_id,
            performed_by=performed_by_id,
            notes=notes,
        )
        db.add(movement)
        movements.append(movement)

    return movements


async def auto_deduct_inventory(
    db: AsyncSession,
    appointment: Appointment,
    performed_by_id: int,
) -> None:
    """
    Автоматическое списание товаров со склада при завершении записи.
    Списывает товары, привязанные к услуге через ServiceInventoryItem.
    Використовує FIFO для визначення ціни з конкретної партії.
    """
    if not appointment.service_id:
        return

    result = await db.execute(
        select(ServiceInventoryItem)
        .options(selectinload(ServiceInventoryItem.item))
        .where(ServiceInventoryItem.service_id == appointment.service_id)
    )
    service_items = result.scalars().all()

    if not service_items:
        return

    for service_item in service_items:
        await deduct_from_batches_fifo(
            db=db,
            company_id=appointment.company_id,
            item_id=service_item.item_id,
            quantity=service_item.quantity,
            appointment_id=appointment.id,
            performed_by_id=performed_by_id,
            notes=f"Автосписання: {appointment.service.name if appointment.service else 'Послуга'}",
        )


@router.get("", response_model=list[AppointmentResponse])
async def get_appointments(
    current_user: CurrentUser,
    db: DbSession,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    status_filter: Optional[AppointmentStatus] = None,
    specialist_id: Optional[int] = None,
):
    """
    Get appointments for the company.
    For clinics, can filter by specialist_id (specialist_profile_id).
    """
    query = (
        select(Appointment)
        .options(selectinload(Appointment.client), selectinload(Appointment.service))
        .where(Appointment.company_id == current_user.company_id)
    )

    if date_from:
        query = query.where(Appointment.date >= date_from)
    if date_to:
        query = query.where(Appointment.date <= date_to)
    if status_filter:
        query = query.where(Appointment.status == status_filter)
    if specialist_id:
        query = query.where(Appointment.member_id == specialist_id)

    query = query.order_by(Appointment.date, Appointment.start_time)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/available-slots", response_model=list[AvailableSlot])
async def get_available_slots(
    db: DbSession,
    doctor_id: int,
    service_id: int,
    date_from: date = Query(...),
    date_to: date = Query(...),
):
    """Get available time slots for booking"""
    # Get service duration
    result = await db.execute(select(Service).where(Service.id == service_id))
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found",
        )

    # Get doctor's schedule
    result = await db.execute(
        select(Schedule).where(Schedule.doctor_id == doctor_id)
    )
    schedules = {s.day_of_week: s for s in result.scalars().all()}

    # Get schedule exceptions in date range
    result = await db.execute(
        select(ScheduleException).where(
            and_(
                ScheduleException.doctor_id == doctor_id,
                ScheduleException.date >= date_from,
                ScheduleException.date <= date_to,
            )
        )
    )
    all_exceptions = result.scalars().all()

    # Separate day-level exceptions from breaks
    day_exceptions = {}  # One per day (day_off, modified, working)
    breaks_by_date = {}  # Multiple per day (breaks)
    for e in all_exceptions:
        if e.type == ScheduleExceptionType.BREAK:
            if e.date not in breaks_by_date:
                breaks_by_date[e.date] = []
            breaks_by_date[e.date].append(e)
        else:
            day_exceptions[e.date] = e

    # Get existing appointments in date range
    result = await db.execute(
        select(Appointment).where(
            and_(
                Appointment.doctor_id == doctor_id,
                Appointment.date >= date_from,
                Appointment.date <= date_to,
                Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
            )
        )
    )
    existing_appointments = result.scalars().all()

    # Build appointments dict by date
    appointments_by_date = {}
    for appt in existing_appointments:
        if appt.date not in appointments_by_date:
            appointments_by_date[appt.date] = []
        appointments_by_date[appt.date].append(appt)

    # Generate available slots
    slots = []
    current_date = date_from
    slot_duration = timedelta(minutes=service.duration_minutes)

    while current_date <= date_to:
        day_of_week = current_date.weekday()
        schedule = schedules.get(day_of_week)
        day_exception = day_exceptions.get(current_date)
        day_breaks = breaks_by_date.get(current_date, [])

        # Determine working hours for this day
        day_start_time = None
        day_end_time = None

        if day_exception:
            if day_exception.type == ScheduleExceptionType.DAY_OFF:
                # Full day off - no slots
                current_date += timedelta(days=1)
                continue
            elif day_exception.type == ScheduleExceptionType.MODIFIED:
                # Modified hours
                if day_exception.start_time and day_exception.end_time:
                    day_start_time = day_exception.start_time
                    day_end_time = day_exception.end_time
            elif day_exception.type == ScheduleExceptionType.WORKING:
                # Working on normally non-working day
                if day_exception.start_time and day_exception.end_time:
                    day_start_time = day_exception.start_time
                    day_end_time = day_exception.end_time
        elif schedule and schedule.is_working_day:
            day_start_time = schedule.start_time
            day_end_time = schedule.end_time

        if day_start_time and day_end_time:
            # Generate time slots for this day
            current_time = datetime.combine(current_date, day_start_time)
            end_time = datetime.combine(current_date, day_end_time)

            day_appointments = appointments_by_date.get(current_date, [])

            while current_time + slot_duration <= end_time:
                slot_start = current_time.time()
                slot_end = (current_time + slot_duration).time()

                # Check if slot conflicts with existing appointments
                is_available = True
                for appt in day_appointments:
                    if not (slot_end <= appt.start_time or slot_start >= appt.end_time):
                        is_available = False
                        break

                # Check if slot conflicts with breaks
                if is_available:
                    for brk in day_breaks:
                        if brk.start_time and brk.end_time:
                            if not (slot_end <= brk.start_time or slot_start >= brk.end_time):
                                is_available = False
                                break

                # Don't show past slots
                if current_date == date.today() and slot_start <= datetime.now().time():
                    is_available = False

                if is_available:
                    slots.append(AvailableSlot(
                        date=current_date,
                        start_time=slot_start,
                        end_time=slot_end,
                    ))

                current_time += timedelta(minutes=30)  # 30 min intervals

        current_date += timedelta(days=1)

    return slots


@router.post("", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
async def create_appointment_admin(
    appointment_data: AppointmentCreateAdmin,
    current_user: CurrentUser,
    db: DbSession,
):
    """Create appointment from admin panel."""
    # Handle client
    client_id = appointment_data.client_id

    if appointment_data.new_client:
        new_client_data = appointment_data.new_client
        client = Client(
            company_id=current_user.company_id,
            first_name=new_client_data.first_name,
            last_name=new_client_data.last_name,
            phone=new_client_data.phone,
            email=new_client_data.email,
            language=new_client_data.language,
            telegram_id=None,
        )
        db.add(client)
        await db.flush()

        db.add(ClientCompany(
            client_id=client.id,
            company_id=current_user.company_id,
        ))
        client_id = client.id
    else:
        result = await db.execute(
            select(Client).where(Client.id == appointment_data.client_id)
        )
        if not result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Client not found",
            )

    # Get service for duration calculation
    result = await db.execute(
        select(Service).where(
            Service.id == appointment_data.service_id,
            Service.company_id == current_user.company_id,
        )
    )
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found",
        )

    # Calculate end_time if not provided
    end_time = appointment_data.end_time
    if not end_time:
        start_dt = datetime.combine(appointment_data.date, appointment_data.start_time)
        end_dt = start_dt + timedelta(minutes=service.duration_minutes)
        end_time = end_dt.time()

    # Check for overlapping appointments
    overlap_result = await db.execute(
        select(Appointment).where(
            Appointment.doctor_id == current_user.id,
            Appointment.date == appointment_data.date,
            Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
            Appointment.end_time > appointment_data.start_time,
            Appointment.start_time < end_time,
        )
    )
    if overlap_result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Time slot conflicts with an existing appointment",
        )

    # Create appointment
    appointment = Appointment(
        company_id=current_user.company_id,
        doctor_id=current_user.id,
        client_id=client_id,
        service_id=appointment_data.service_id,
        member_id=appointment_data.member_id,
        date=appointment_data.date,
        start_time=appointment_data.start_time,
        end_time=end_time,
        status=appointment_data.status,
    )
    db.add(appointment)
    await db.commit()

    # Reload with relationships
    result = await db.execute(
        select(Appointment)
        .options(selectinload(Appointment.client), selectinload(Appointment.service))
        .where(Appointment.id == appointment.id)
    )
    return result.scalar_one()


@router.get("/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment(
    appointment_id: int,
    current_user: CurrentUser,
    db: DbSession,
):
    result = await db.execute(
        select(Appointment)
        .options(selectinload(Appointment.client), selectinload(Appointment.service))
        .where(
            Appointment.id == appointment_id,
            Appointment.company_id == current_user.company_id,
        )
    )
    appointment = result.scalar_one_or_none()
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )
    return appointment


@router.patch("/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment_status(
    appointment_id: int,
    appointment_data: AppointmentUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    result = await db.execute(
        select(Appointment)
        .options(selectinload(Appointment.client), selectinload(Appointment.service))
        .where(
            Appointment.id == appointment_id,
            Appointment.company_id == current_user.company_id,
        )
    )
    appointment = result.scalar_one_or_none()
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )

    old_status = appointment.status
    new_status = appointment_data.status
    appointment.status = new_status

    # Автосписание товаров при завершении записи
    if new_status == AppointmentStatus.COMPLETED and old_status != AppointmentStatus.COMPLETED:
        await auto_deduct_inventory(db, appointment, current_user.id)

    await db.commit()
    await db.refresh(appointment)

    # Send notification to client if status changed
    if old_status != new_status and appointment.client and appointment.client.telegram_id:
        doctor_name = f"{current_user.first_name} {current_user.last_name}"
        service_name = appointment.service.name if appointment.service else "Послуга"
        appointment_date = appointment.date.strftime("%d.%m.%Y")
        appointment_time = appointment.start_time.strftime("%H:%M")
        client_lang = appointment.client.language if hasattr(appointment.client, 'language') else "uk"

        if new_status == AppointmentStatus.CONFIRMED:
            await notify_client_appointment_confirmed(
                client_telegram_id=appointment.client.telegram_id,
                doctor_name=doctor_name,
                service_name=service_name,
                appointment_date=appointment_date,
                appointment_time=appointment_time,
                lang=client_lang,
            )
        elif new_status == AppointmentStatus.CANCELLED:
            await notify_client_appointment_cancelled(
                client_telegram_id=appointment.client.telegram_id,
                service_name=service_name,
                appointment_date=appointment_date,
                appointment_time=appointment_time,
                lang=client_lang,
            )

    # Sync with Google Calendar if event exists
    if old_status != new_status and appointment.google_event_id:
        await update_appointment_in_calendar(
            db=db,
            doctor_id=appointment.doctor_id,
            google_event_id=appointment.google_event_id,
            status=new_status.value,
        )

    return appointment


# === Financials & Consumption Endpoints ===

async def _get_appointment_or_404(db: AsyncSession, appointment_id: int, company_id: int) -> Appointment:
    result = await db.execute(
        select(Appointment)
        .options(selectinload(Appointment.service))
        .where(
            Appointment.id == appointment_id,
            Appointment.company_id == company_id,
        )
    )
    appointment = result.scalar_one_or_none()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment


@router.get("/{appointment_id}/financials", response_model=AppointmentFinancialsResponse)
async def get_appointment_financials(
    appointment_id: int,
    current_user: CurrentUser,
    db: DbSession,
):
    """Фінансовий підсумок процедури: витрати матеріалів, виручка, прибуток."""
    appointment = await _get_appointment_or_404(db, appointment_id, current_user.company_id)

    # Отримуємо всі витратні рухи товарів для цього запису
    result = await db.execute(
        select(StockMovement, InventoryItem)
        .join(InventoryItem, StockMovement.item_id == InventoryItem.id)
        .where(
            StockMovement.appointment_id == appointment_id,
            StockMovement.movement_type.in_([MovementType.OUTGOING, MovementType.WRITE_OFF]),
        )
        .order_by(StockMovement.created_at)
    )
    rows = result.all()

    consumption = []
    material_cost = Decimal("0")
    for movement, item in rows:
        qty = abs(movement.quantity)
        price = movement.unit_price or item.purchase_price
        total = Decimal(str(qty)) * price if price else None
        if total:
            material_cost += total
        consumption.append(ConsumptionItemResponse(
            movement_id=movement.id,
            item_id=item.id,
            item_name=item.name,
            quantity=qty,
            unit_price=price,
            total_cost=total,
            unit=item.unit,
            batch_id=movement.batch_id,
            batch_number=movement.batch_number,
        ))

    revenue = appointment.service_price
    profit = (revenue - material_cost) if revenue is not None else None
    margin_pct = float(profit / revenue * 100) if profit is not None and revenue and revenue > 0 else None

    return AppointmentFinancialsResponse(
        appointment_id=appointment_id,
        revenue=revenue,
        material_cost=material_cost,
        profit=profit,
        margin_pct=round(margin_pct, 1) if margin_pct is not None else None,
        consumption=consumption,
    )


@router.post("/{appointment_id}/consumption", response_model=ConsumptionItemResponse, status_code=201)
async def add_consumption(
    appointment_id: int,
    data: AddConsumptionRequest,
    current_user: CurrentUser,
    db: DbSession,
):
    """Додати матеріал до витрат процедури. Використовує FIFO для партій."""
    appointment = await _get_appointment_or_404(db, appointment_id, current_user.company_id)

    # Перевіряємо товар
    result = await db.execute(
        select(InventoryItem).where(
            InventoryItem.id == data.item_id,
            InventoryItem.company_id == current_user.company_id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    if data.unit_price is not None:
        # Explicit price — create movement directly
        movement = StockMovement(
            company_id=current_user.company_id,
            item_id=data.item_id,
            movement_type=MovementType.OUTGOING,
            quantity=-data.quantity,
            unit_price=data.unit_price,
            appointment_id=appointment_id,
            performed_by=current_user.id,
            notes=f"Ручне додавання: {item.name}",
            batch_id=data.batch_id,
        )
        db.add(movement)
        # Decrement batch remaining if specified
        if data.batch_id:
            batch_result = await db.execute(
                select(StockBatch).where(StockBatch.id == data.batch_id)
            )
            batch = batch_result.scalar_one_or_none()
            if batch:
                batch.quantity_remaining = max(0, batch.quantity_remaining - data.quantity)
        await db.commit()
        await db.refresh(movement)
        movements = [movement]
    else:
        # Use FIFO batch deduction
        movements = await deduct_from_batches_fifo(
            db=db,
            company_id=current_user.company_id,
            item_id=data.item_id,
            quantity=data.quantity,
            appointment_id=appointment_id,
            performed_by_id=current_user.id,
            notes=f"Ручне додавання: {item.name}",
            specific_batch_id=data.batch_id,
        )
        await db.commit()

    # Return the first movement as the response
    movement = movements[0]
    await db.refresh(movement)

    qty = abs(movement.quantity)
    unit_price = movement.unit_price
    total = Decimal(str(qty)) * unit_price if unit_price else None

    return ConsumptionItemResponse(
        movement_id=movement.id,
        item_id=item.id,
        item_name=item.name,
        quantity=qty,
        unit_price=unit_price,
        total_cost=total,
        unit=item.unit,
    )


@router.patch("/{appointment_id}/consumption/{movement_id}", response_model=ConsumptionItemResponse)
async def update_consumption(
    appointment_id: int,
    movement_id: int,
    data: UpdateConsumptionRequest,
    current_user: CurrentUser,
    db: DbSession,
):
    """Оновити кількість або ціну витраченого матеріалу."""
    await _get_appointment_or_404(db, appointment_id, current_user.company_id)

    result = await db.execute(
        select(StockMovement)
        .options(selectinload(StockMovement.item))
        .where(
            StockMovement.id == movement_id,
            StockMovement.appointment_id == appointment_id,
            StockMovement.company_id == current_user.company_id,
        )
    )
    movement = result.scalar_one_or_none()
    if not movement:
        raise HTTPException(status_code=404, detail="Movement not found")

    if data.quantity is not None:
        movement.quantity = -abs(data.quantity)
    if data.unit_price is not None:
        movement.unit_price = data.unit_price

    await db.commit()
    await db.refresh(movement)

    item = movement.item
    qty = abs(movement.quantity)
    price = movement.unit_price or (item.purchase_price if item else None)
    total = Decimal(str(qty)) * price if price else None

    return ConsumptionItemResponse(
        movement_id=movement.id,
        item_id=item.id,
        item_name=item.name,
        quantity=qty,
        unit_price=price,
        total_cost=total,
        unit=item.unit,
    )


@router.delete("/{appointment_id}/consumption/{movement_id}", status_code=204)
async def delete_consumption(
    appointment_id: int,
    movement_id: int,
    current_user: CurrentUser,
    db: DbSession,
):
    """Видалити витрату матеріалу з процедури."""
    result = await db.execute(
        select(StockMovement).where(
            StockMovement.id == movement_id,
            StockMovement.appointment_id == appointment_id,
            StockMovement.company_id == current_user.company_id,
        )
    )
    movement = result.scalar_one_or_none()
    if not movement:
        raise HTTPException(status_code=404, detail="Movement not found")

    await db.delete(movement)
    await db.commit()
