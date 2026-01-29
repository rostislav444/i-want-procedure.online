from datetime import date, datetime, time, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import DbSession, CurrentUser
from app.models.appointment import Appointment, AppointmentStatus
from app.models.schedule import Schedule, ScheduleException, ScheduleExceptionType
from app.models.service import Service
from app.models.client import Client
from app.models.user import User
from app.models.inventory import ServiceInventoryItem, StockMovement, MovementType
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentUpdate,
    AppointmentResponse,
    AvailableSlot,
)
from bots.notifications import notify_client_appointment_confirmed, notify_client_appointment_cancelled
from app.services.google_calendar import update_appointment_in_calendar

router = APIRouter(prefix="/appointments")


async def auto_deduct_inventory(
    db: AsyncSession,
    appointment: Appointment,
    performed_by_id: int,
) -> None:
    """
    Автоматическое списание товаров со склада при завершении записи.
    Списывает товары, привязанные к услуге через ServiceInventoryItem.
    """
    if not appointment.service_id:
        return

    # Получаем товары, привязанные к услуге
    result = await db.execute(
        select(ServiceInventoryItem)
        .where(ServiceInventoryItem.service_id == appointment.service_id)
    )
    service_items = result.scalars().all()

    if not service_items:
        return

    # Создаём движения для каждого товара
    for service_item in service_items:
        movement = StockMovement(
            company_id=appointment.company_id,
            item_id=service_item.item_id,
            movement_type=MovementType.OUTGOING,
            quantity=-service_item.quantity,  # Отрицательное для расхода
            appointment_id=appointment.id,
            performed_by=performed_by_id,
            notes=f"Автосписание: {appointment.service.name if appointment.service else 'Послуга'}",
        )
        db.add(movement)


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
        query = query.where(Appointment.specialist_profile_id == specialist_id)

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
