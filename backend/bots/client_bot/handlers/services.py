from aiogram import Router, F
from aiogram.types import Message
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.client import Client
from app.models.appointment import Appointment
from app.models.service import Service
from bots.i18n import t

router = Router()


async def get_client_lang(session: AsyncSession, telegram_id: int) -> str:
    result = await session.execute(
        select(Client).where(Client.telegram_id == telegram_id)
    )
    client = result.scalar_one_or_none()
    return client.language if client else "uk"


@router.message(F.text.in_([
    t("my_appointments", "uk"),
    t("my_appointments", "ru"),
    t("my_appointments", "en"),
]))
async def my_appointments(message: Message, session: AsyncSession):
    lang = await get_client_lang(session, message.from_user.id)

    # Get client
    result = await session.execute(
        select(Client).where(Client.telegram_id == message.from_user.id)
    )
    client = result.scalar_one_or_none()

    if not client:
        await message.answer("Client not found")
        return

    # Get appointments
    result = await session.execute(
        select(Appointment)
        .where(Appointment.client_id == client.id)
        .order_by(Appointment.date.desc(), Appointment.start_time.desc())
        .limit(10)
    )
    appointments = result.scalars().all()

    if not appointments:
        await message.answer(t("appointments.no_appointments", lang))
        return

    # Format appointments
    text_parts = []
    for appt in appointments:
        # Get service name
        result = await session.execute(
            select(Service).where(Service.id == appt.service_id)
        )
        service = result.scalar_one()

        status_key = f"appointments.status_{appt.status}"
        status_text = t(status_key, lang)

        text_parts.append(
            t(
                "appointments.appointment_info",
                lang,
                service=service.name,
                date=appt.date.strftime("%d.%m.%Y"),
                time=appt.start_time.strftime("%H:%M"),
                status=status_text,
            )
        )

    await message.answer("\n\n".join(text_parts))


@router.message(F.text.in_([
    t("change_language", "uk"),
    t("change_language", "ru"),
    t("change_language", "en"),
]))
async def change_language(message: Message):
    from bots.client_bot.keyboards import language_keyboard
    await message.answer(
        t("welcome", "uk"),
        reply_markup=language_keyboard(),
    )
