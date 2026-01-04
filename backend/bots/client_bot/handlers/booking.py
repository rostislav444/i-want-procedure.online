from datetime import date, datetime, timedelta

from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import Message, CallbackQuery
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.client import Client
from app.models.service import Service
from app.models.schedule import Schedule
from app.models.appointment import Appointment, AppointmentStatus
from app.models.user import User
from bots.i18n import t
from bots.notifications import notify_doctor_new_appointment
from bots.client_bot.keyboards import (
    services_keyboard,
    dates_keyboard,
    times_keyboard,
    confirm_keyboard,
    main_menu_keyboard,
)

router = Router()


class BookingStates(StatesGroup):
    selecting_service = State()
    selecting_date = State()
    selecting_time = State()
    confirming = State()


async def get_client_lang(session: AsyncSession, telegram_id: int) -> str:
    result = await session.execute(
        select(Client).where(Client.telegram_id == telegram_id)
    )
    client = result.scalar_one_or_none()
    return client.language if client else "uk"


@router.message(Command("book"))
@router.message(F.text.in_([
    t("book_appointment", "uk"),
    t("book_appointment", "ru"),
    t("book_appointment", "en"),
]))
async def start_booking(message: Message, state: FSMContext, session: AsyncSession):
    lang = await get_client_lang(session, message.from_user.id)

    # Get active services (for now, get all - TODO: filter by company)
    result = await session.execute(
        select(Service).where(Service.is_active == True)
    )
    services = result.scalars().all()

    if not services:
        await message.answer(t("booking.no_services", lang))
        return

    services_data = [
        {"id": s.id, "name": s.name, "price": float(s.price), "duration_minutes": s.duration_minutes}
        for s in services
    ]

    await state.update_data(services=services_data, lang=lang)
    await state.set_state(BookingStates.selecting_service)

    await message.answer(
        t("booking.select_service", lang),
        reply_markup=services_keyboard(services_data, lang),
    )


@router.callback_query(F.data.startswith("service_"), BookingStates.selecting_service)
async def select_service(callback: CallbackQuery, state: FSMContext, session: AsyncSession):
    data = await state.get_data()
    lang = data.get("lang", "uk")
    service_id = int(callback.data.split("_")[1])

    # Get service
    result = await session.execute(select(Service).where(Service.id == service_id))
    service = result.scalar_one_or_none()

    if not service:
        await callback.answer("Service not found")
        return

    await state.update_data(
        service_id=service_id,
        service_name=service.name,
        service_price=float(service.price),
        service_duration=service.duration_minutes,
        doctor_id=service.doctor_id,
    )

    # Generate available dates (next 14 days)
    today = date.today()
    dates = [(today + timedelta(days=i)).strftime("%d.%m") for i in range(1, 15)]

    await state.set_state(BookingStates.selecting_date)
    await callback.message.edit_text(
        t("booking.select_date", lang),
        reply_markup=dates_keyboard(dates, lang),
    )
    await callback.answer()


@router.callback_query(F.data.startswith("date_"), BookingStates.selecting_date)
async def select_date(callback: CallbackQuery, state: FSMContext, session: AsyncSession):
    data = await state.get_data()
    lang = data.get("lang", "uk")
    date_str = callback.data.split("_")[1]

    # Parse date
    day, month = map(int, date_str.split("."))
    year = date.today().year
    if month < date.today().month:
        year += 1
    selected_date = date(year, month, day)

    await state.update_data(selected_date=selected_date.isoformat())

    # Get available slots
    doctor_id = data.get("doctor_id")
    duration = data.get("service_duration", 60)

    # Get doctor's schedule for this day
    day_of_week = selected_date.weekday()
    result = await session.execute(
        select(Schedule).where(
            and_(
                Schedule.doctor_id == doctor_id,
                Schedule.day_of_week == day_of_week,
                Schedule.is_working_day == True,
            )
        )
    )
    schedule = result.scalar_one_or_none()

    if not schedule:
        await callback.answer(t("booking.no_available_slots", lang))
        return

    # Get existing appointments for this day
    result = await session.execute(
        select(Appointment).where(
            and_(
                Appointment.doctor_id == doctor_id,
                Appointment.date == selected_date,
                Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
            )
        )
    )
    existing_appointments = result.scalars().all()

    # Generate available slots
    slots = []
    current_time = datetime.combine(selected_date, schedule.start_time)
    end_time = datetime.combine(selected_date, schedule.end_time)
    slot_duration = timedelta(minutes=duration)

    while current_time + slot_duration <= end_time:
        slot_start = current_time.time()
        slot_end = (current_time + slot_duration).time()

        # Check if slot is available
        is_available = True
        for appt in existing_appointments:
            if not (slot_end <= appt.start_time or slot_start >= appt.end_time):
                is_available = False
                break

        # Don't show past slots for today
        if selected_date == date.today() and slot_start <= datetime.now().time():
            is_available = False

        if is_available:
            slots.append({"start_time": slot_start.strftime("%H:%M"), "end_time": slot_end.strftime("%H:%M")})

        current_time += timedelta(minutes=30)

    if not slots:
        await callback.message.edit_text(t("booking.no_available_slots", lang))
        return

    await state.update_data(slots=slots)
    await state.set_state(BookingStates.selecting_time)

    await callback.message.edit_text(
        t("booking.select_time", lang),
        reply_markup=times_keyboard(slots, lang),
    )
    await callback.answer()


@router.callback_query(F.data.startswith("time_"), BookingStates.selecting_time)
async def select_time(callback: CallbackQuery, state: FSMContext):
    data = await state.get_data()
    lang = data.get("lang", "uk")
    time_str = callback.data.split("_")[1]

    # Find the slot
    slots = data.get("slots", [])
    selected_slot = next((s for s in slots if s["start_time"] == time_str), None)

    if not selected_slot:
        await callback.answer("Slot not found")
        return

    await state.update_data(
        start_time=selected_slot["start_time"],
        end_time=selected_slot["end_time"],
    )

    # Show confirmation
    await state.set_state(BookingStates.confirming)

    confirmation_text = t(
        "booking.confirm_booking",
        lang,
        service=data["service_name"],
        date=data["selected_date"],
        time=selected_slot["start_time"],
        price=data["service_price"],
    )

    await callback.message.edit_text(
        confirmation_text,
        reply_markup=confirm_keyboard(lang),
    )
    await callback.answer()


@router.callback_query(F.data == "confirm_booking", BookingStates.confirming)
async def confirm_booking(callback: CallbackQuery, state: FSMContext, session: AsyncSession):
    data = await state.get_data()
    lang = data.get("lang", "uk")

    # Get client
    result = await session.execute(
        select(Client).where(Client.telegram_id == callback.from_user.id)
    )
    client = result.scalar_one()

    # Get service to find company
    result = await session.execute(
        select(Service).where(Service.id == data["service_id"])
    )
    service = result.scalar_one()

    # Get doctor for notification
    result = await session.execute(
        select(User).where(User.id == data["doctor_id"])
    )
    doctor = result.scalar_one_or_none()

    # Create appointment
    selected_date = date.fromisoformat(data["selected_date"])
    start_time = datetime.strptime(data["start_time"], "%H:%M").time()
    end_time = datetime.strptime(data["end_time"], "%H:%M").time()

    appointment = Appointment(
        company_id=service.company_id,
        doctor_id=data["doctor_id"],
        client_id=client.id,
        service_id=data["service_id"],
        date=selected_date,
        start_time=start_time,
        end_time=end_time,
        status=AppointmentStatus.PENDING,
    )
    session.add(appointment)
    await session.commit()

    await state.clear()

    await callback.message.edit_text(t("booking.booking_confirmed", lang))
    await callback.message.answer(
        t("main_menu", lang),
        reply_markup=main_menu_keyboard(lang),
    )
    await callback.answer()

    # Send notification to doctor
    if doctor and doctor.telegram_id:
        client_name = f"{client.first_name} {client.last_name or ''}".strip()
        await notify_doctor_new_appointment(
            doctor_telegram_id=doctor.telegram_id,
            client_name=client_name,
            service_name=data["service_name"],
            appointment_date=selected_date.strftime("%d.%m.%Y"),
            appointment_time=data["start_time"],
        )


@router.callback_query(F.data == "cancel")
async def cancel_booking(callback: CallbackQuery, state: FSMContext, session: AsyncSession):
    lang = await get_client_lang(session, callback.from_user.id)

    await state.clear()
    await callback.message.edit_text(t("booking.booking_cancelled", lang))
    await callback.message.answer(
        t("main_menu", lang),
        reply_markup=main_menu_keyboard(lang),
    )
    await callback.answer()


@router.callback_query(F.data == "back_to_services")
async def back_to_services(callback: CallbackQuery, state: FSMContext):
    data = await state.get_data()
    lang = data.get("lang", "uk")
    services = data.get("services", [])

    await state.set_state(BookingStates.selecting_service)
    await callback.message.edit_text(
        t("booking.select_service", lang),
        reply_markup=services_keyboard(services, lang),
    )
    await callback.answer()


@router.callback_query(F.data == "back_to_dates")
async def back_to_dates(callback: CallbackQuery, state: FSMContext):
    data = await state.get_data()
    lang = data.get("lang", "uk")

    today = date.today()
    dates = [(today + timedelta(days=i)).strftime("%d.%m") for i in range(1, 15)]

    await state.set_state(BookingStates.selecting_date)
    await callback.message.edit_text(
        t("booking.select_date", lang),
        reply_markup=dates_keyboard(dates, lang),
    )
    await callback.answer()
