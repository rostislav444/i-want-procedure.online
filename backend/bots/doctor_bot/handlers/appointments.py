from datetime import date

from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.appointment import Appointment, AppointmentStatus
from app.models.service import Service
from app.models.client import Client
from bots.doctor_bot.keyboards import appointment_action_keyboard

router = Router()


async def get_doctor(session: AsyncSession, telegram_id: int) -> User | None:
    result = await session.execute(
        select(User).where(User.telegram_id == telegram_id)
    )
    return result.scalar_one_or_none()


async def format_appointment(session: AsyncSession, appt: Appointment) -> str:
    # Get service
    result = await session.execute(
        select(Service).where(Service.id == appt.service_id)
    )
    service = result.scalar_one()

    # Get client
    result = await session.execute(
        select(Client).where(Client.id == appt.client_id)
    )
    client = result.scalar_one()

    status_map = {
        AppointmentStatus.PENDING: "⏳ Очікує",
        AppointmentStatus.CONFIRMED: "✅ Підтверджено",
        AppointmentStatus.CANCELLED: "❌ Скасовано",
        AppointmentStatus.COMPLETED: "✔️ Завершено",
    }

    # Build contact section with good spacing for easy clicking
    contact_lines = [f"👤  {client.first_name} {client.last_name or ''}"]
    if client.phone:
        contact_lines.append(f"📞  {client.phone}")
    if client.telegram_username:
        contact_lines.append(f"✈️  @{client.telegram_username}")

    contact_section = "\n\n".join(contact_lines)

    return (
        f"📋 <b>{service.name}</b>\n\n"
        f"📅  {appt.date.strftime('%d.%m.%Y')}\n"
        f"⏰  {appt.start_time.strftime('%H:%M')} - {appt.end_time.strftime('%H:%M')}\n"
        f"💰  {service.price} грн\n\n"
        f"━━━━━━━━━━━━━━━\n\n"
        f"{contact_section}\n\n"
        f"━━━━━━━━━━━━━━━\n\n"
        f"📊  {status_map.get(appt.status, appt.status)}"
    )


@router.message(F.text == "📅 Записи на сьогодні")
async def today_appointments(message: Message, session: AsyncSession):
    doctor = await get_doctor(session, message.from_user.id)
    if not doctor:
        await message.answer("Спочатку прив'яжіть акаунт")
        return

    # Get today's appointments
    result = await session.execute(
        select(Appointment)
        .where(
            and_(
                Appointment.doctor_id == doctor.id,
                Appointment.date == date.today(),
            )
        )
        .order_by(Appointment.start_time)
    )
    appointments = result.scalars().all()

    if not appointments:
        await message.answer("На сьогодні немає записів 📭")
        return

    for appt in appointments:
        text = await format_appointment(session, appt)
        if appt.status == AppointmentStatus.PENDING:
            await message.answer(
                text,
                reply_markup=appointment_action_keyboard(appt.id),
            )
        else:
            await message.answer(text)


@router.message(F.text == "📋 Всі записи")
async def all_appointments(message: Message, session: AsyncSession):
    doctor = await get_doctor(session, message.from_user.id)
    if not doctor:
        await message.answer("Спочатку прив'яжіть акаунт")
        return

    # Get upcoming appointments
    result = await session.execute(
        select(Appointment)
        .where(
            and_(
                Appointment.doctor_id == doctor.id,
                Appointment.date >= date.today(),
                Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
            )
        )
        .order_by(Appointment.date, Appointment.start_time)
        .limit(10)
    )
    appointments = result.scalars().all()

    if not appointments:
        await message.answer("Немає майбутніх записів 📭")
        return

    await message.answer(f"Найближчі записи ({len(appointments)}):")

    for appt in appointments:
        text = await format_appointment(session, appt)
        if appt.status == AppointmentStatus.PENDING:
            await message.answer(
                text,
                reply_markup=appointment_action_keyboard(appt.id),
            )
        else:
            await message.answer(text)


@router.callback_query(F.data.startswith("confirm_"))
async def confirm_appointment(callback: CallbackQuery, session: AsyncSession):
    from bots.notifications import notify_client_appointment_confirmed

    appointment_id = int(callback.data.split("_")[1])

    result = await session.execute(
        select(Appointment).where(Appointment.id == appointment_id)
    )
    appt = result.scalar_one_or_none()

    if not appt:
        await callback.answer("Запис не знайдено")
        return

    appt.status = AppointmentStatus.CONFIRMED
    await session.commit()

    text = await format_appointment(session, appt)
    await callback.message.edit_text(text)
    await callback.answer("Запис підтверджено ✅")

    # Send notification to client
    result = await session.execute(
        select(Client).where(Client.id == appt.client_id)
    )
    client = result.scalar_one_or_none()

    result = await session.execute(
        select(Service).where(Service.id == appt.service_id)
    )
    service = result.scalar_one()

    doctor = await get_doctor(session, callback.from_user.id)
    doctor_name = f"{doctor.first_name} {doctor.last_name or ''}".strip() if doctor else "Спеціаліст"

    if client and client.telegram_id:
        await notify_client_appointment_confirmed(
            client_telegram_id=client.telegram_id,
            doctor_name=doctor_name,
            service_name=service.name,
            appointment_date=appt.date.strftime("%d.%m.%Y"),
            appointment_time=appt.start_time.strftime("%H:%M"),
            lang=client.language.value if client.language else "uk",
        )


@router.callback_query(F.data.startswith("cancel_"))
async def cancel_appointment(callback: CallbackQuery, session: AsyncSession):
    from bots.notifications import notify_client_appointment_cancelled

    appointment_id = int(callback.data.split("_")[1])

    result = await session.execute(
        select(Appointment).where(Appointment.id == appointment_id)
    )
    appt = result.scalar_one_or_none()

    if not appt:
        await callback.answer("Запис не знайдено")
        return

    appt.status = AppointmentStatus.CANCELLED
    await session.commit()

    text = await format_appointment(session, appt)
    await callback.message.edit_text(text)
    await callback.answer("Запис скасовано ❌")

    # Send notification to client
    result = await session.execute(
        select(Client).where(Client.id == appt.client_id)
    )
    client = result.scalar_one_or_none()

    result = await session.execute(
        select(Service).where(Service.id == appt.service_id)
    )
    service = result.scalar_one()

    if client and client.telegram_id:
        await notify_client_appointment_cancelled(
            client_telegram_id=client.telegram_id,
            service_name=service.name,
            appointment_date=appt.date.strftime("%d.%m.%Y"),
            appointment_time=appt.start_time.strftime("%H:%M"),
            lang=client.language.value if client.language else "uk",
        )


@router.callback_query(F.data.startswith("complete_"))
async def complete_appointment(callback: CallbackQuery, session: AsyncSession):
    appointment_id = int(callback.data.split("_")[1])

    result = await session.execute(
        select(Appointment).where(Appointment.id == appointment_id)
    )
    appt = result.scalar_one_or_none()

    if not appt:
        await callback.answer("Запис не знайдено")
        return

    appt.status = AppointmentStatus.COMPLETED
    await session.commit()

    text = await format_appointment(session, appt)
    await callback.message.edit_text(text)
    await callback.answer("Запис позначено як завершений ✔️")
