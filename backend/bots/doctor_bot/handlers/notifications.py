from aiogram import Bot
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.service import Service
from app.models.client import Client
from app.models.appointment import Appointment
from bots.doctor_bot.keyboards import appointment_action_keyboard


async def notify_doctor_new_appointment(
    bot: Bot,
    session: AsyncSession,
    appointment: Appointment,
):
    """Send notification to doctor about new appointment"""

    # Get doctor
    result = await session.execute(
        select(User).where(User.id == appointment.doctor_id)
    )
    doctor = result.scalar_one()

    if not doctor.telegram_id:
        return  # Doctor hasn't linked telegram

    # Get service
    result = await session.execute(
        select(Service).where(Service.id == appointment.service_id)
    )
    service = result.scalar_one()

    # Get client
    result = await session.execute(
        select(Client).where(Client.id == appointment.client_id)
    )
    client = result.scalar_one()

    phone_info = f"\n📞 {client.phone}" if client.phone else ""
    username_info = f"\n👤 @{client.telegram_username}" if client.telegram_username else ""

    text = (
        "🆕 <b>Новий запис!</b>\n\n"
        f"📋 {service.name}\n"
        f"📅 {appointment.date.strftime('%d.%m.%Y')}\n"
        f"⏰ {appointment.start_time.strftime('%H:%M')} - {appointment.end_time.strftime('%H:%M')}\n"
        f"👤 {client.first_name} {client.last_name or ''}"
        f"{phone_info}{username_info}\n"
        f"💰 {service.price} грн"
    )

    try:
        await bot.send_message(
            chat_id=doctor.telegram_id,
            text=text,
            reply_markup=appointment_action_keyboard(appointment.id),
        )
    except Exception as e:
        print(f"Failed to send notification to doctor: {e}")
