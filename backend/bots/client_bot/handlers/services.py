from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton, ReplyKeyboardMarkup, KeyboardButton
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.client import Client
from app.models.appointment import Appointment, AppointmentStatus, CancelledBy
from app.models.service import Service
from app.models.user import User
from bots.i18n import t
from bots.notifications import notify_doctor_client_cancelled
from bots.client_bot.keyboards import main_menu_keyboard

router = Router()


class CancelAppointmentStates(StatesGroup):
    waiting_for_reason = State()


async def get_client_lang(session: AsyncSession, telegram_id: int) -> str:
    result = await session.execute(
        select(Client).where(Client.telegram_id == telegram_id)
    )
    client = result.scalar_one_or_none()
    return client.language if client else "uk"


def cancel_appointment_keyboard(appointment_id: int, lang: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=f"❌ {t('appointments.cancel_button', lang)}",
                    callback_data=f"client_cancel_{appointment_id}"
                )
            ]
        ]
    )


def skip_reason_keyboard(lang: str) -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text=t("skip", lang))]],
        resize_keyboard=True,
        one_time_keyboard=True,
    )


@router.message(Command("appointments"))
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

    # Get active appointments (pending/confirmed only)
    result = await session.execute(
        select(Appointment)
        .where(
            Appointment.client_id == client.id,
            Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED])
        )
        .order_by(Appointment.date.asc(), Appointment.start_time.asc())
        .limit(10)
    )
    appointments = result.scalars().all()

    if not appointments:
        await message.answer(t("appointments.no_appointments", lang))
        return

    # Send each appointment as separate message
    for appt in appointments:
        # Get service name
        result = await session.execute(
            select(Service).where(Service.id == appt.service_id)
        )
        service = result.scalar_one()

        status_key = f"appointments.status_{appt.status}"
        status_text = t(status_key, lang)

        text = t(
            "appointments.appointment_info",
            lang,
            service=service.name,
            date=appt.date.strftime("%d.%m.%Y"),
            time=appt.start_time.strftime("%H:%M"),
            status=status_text,
        )

        # Add cancel button for pending/confirmed appointments
        if appt.status in [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]:
            await message.answer(
                text,
                reply_markup=cancel_appointment_keyboard(appt.id, lang)
            )
        else:
            await message.answer(text)


@router.callback_query(F.data.startswith("client_cancel_"))
async def start_cancel_appointment(callback: CallbackQuery, state: FSMContext, session: AsyncSession):
    lang = await get_client_lang(session, callback.from_user.id)
    appointment_id = int(callback.data.split("_")[2])

    # Check if appointment exists and can be cancelled
    result = await session.execute(
        select(Appointment).where(Appointment.id == appointment_id)
    )
    appt = result.scalar_one_or_none()

    if not appt or appt.status not in [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]:
        await callback.answer(t("appointments.cannot_cancel", lang))
        return

    # Save appointment_id to state and ask for reason
    await state.update_data(cancel_appointment_id=appointment_id, lang=lang)
    await state.set_state(CancelAppointmentStates.waiting_for_reason)

    await callback.message.answer(
        t("appointments.ask_cancel_reason", lang),
        reply_markup=skip_reason_keyboard(lang),
    )
    await callback.answer()


@router.message(CancelAppointmentStates.waiting_for_reason)
async def process_cancel_reason(message: Message, state: FSMContext, session: AsyncSession):
    data = await state.get_data()
    lang = data.get("lang", "uk")
    appointment_id = data.get("cancel_appointment_id")

    # Check if user pressed skip
    if message.text in [t("skip", "uk"), t("skip", "ru"), t("skip", "en")]:
        reason = None
    else:
        reason = message.text

    # Get appointment
    result = await session.execute(
        select(Appointment).where(Appointment.id == appointment_id)
    )
    appt = result.scalar_one_or_none()

    if not appt or appt.status not in [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]:
        await state.clear()
        await message.answer(
            t("appointments.cannot_cancel", lang),
            reply_markup=main_menu_keyboard(lang),
        )
        return

    # Get client
    result = await session.execute(
        select(Client).where(Client.telegram_id == message.from_user.id)
    )
    client = result.scalar_one()

    # Get service
    result = await session.execute(
        select(Service).where(Service.id == appt.service_id)
    )
    service = result.scalar_one()

    # Get doctor
    result = await session.execute(
        select(User).where(User.id == appt.doctor_id)
    )
    doctor = result.scalar_one_or_none()

    # Cancel the appointment
    appt.status = AppointmentStatus.CANCELLED
    appt.cancelled_by = CancelledBy.CLIENT
    appt.cancellation_reason = reason
    await session.commit()

    await state.clear()

    await message.answer(
        t("appointments.cancelled_success", lang),
        reply_markup=main_menu_keyboard(lang),
    )

    # Notify doctor
    if doctor and doctor.telegram_id:
        client_name = f"{client.first_name} {client.last_name or ''}".strip()
        await notify_doctor_client_cancelled(
            doctor_telegram_id=doctor.telegram_id,
            client_name=client_name,
            service_name=service.name,
            appointment_date=appt.date.strftime("%d.%m.%Y"),
            appointment_time=appt.start_time.strftime("%H:%M"),
            cancellation_reason=reason,
        )


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
