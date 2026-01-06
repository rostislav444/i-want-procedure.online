"""
Doctor Bot - Payment requisites handler.
Allows doctors to send payment requisites to clients.
"""
from aiogram import Router, F, Bot
from aiogram.types import Message, CallbackQuery
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.company import Company
from app.models.client import Client, ClientCompany
from app.models.appointment import Appointment
from app.core.config import settings
from bots.doctor_bot.keyboards import main_menu_keyboard, clients_list_keyboard

router = Router()


def format_payment_message(company: Company) -> str:
    """Format payment requisites message for client."""
    parts = [f"💳 <b>Реквізити для оплати</b>\n\n<b>{company.name}</b>\n"]

    if company.payment_recipient_name:
        parts.append(f"👤 <b>Отримувач:</b> {company.payment_recipient_name}")

    if company.payment_iban:
        parts.append(f"🏦 <b>IBAN:</b> <code>{company.payment_iban}</code>")

    if company.payment_bank_name:
        parts.append(f"🏛 <b>Банк:</b> {company.payment_bank_name}")

    if company.payment_card_number:
        parts.append(f"💳 <b>Картка:</b> <code>{company.payment_card_number}</code>")

    if company.payment_monobank_jar:
        parts.append(f"\n🫙 <b>Monobank банка:</b> {company.payment_monobank_jar}")

    if len(parts) == 1:
        return "❌ Реквізити для оплати не налаштовані.\n\nНалаштуйте їх у профілі на сайті."

    parts.append("\n\n<i>Натисніть на номер, щоб скопіювати</i>")
    return "\n".join(parts)


@router.message(F.text == "💳 Надіслати реквізити")
async def send_payment_menu(message: Message, session: AsyncSession):
    """Show recent clients to send payment requisites."""
    # Get current user
    result = await session.execute(
        select(User)
        .where(User.telegram_id == message.from_user.id)
        .options(selectinload(User.company))
    )
    user = result.scalar_one_or_none()

    if not user or not user.company:
        await message.answer("❌ Ваш акаунт не прив'язано до компанії.")
        return

    company = user.company

    # Check if payment requisites are configured
    has_requisites = any([
        company.payment_iban,
        company.payment_card_number,
        company.payment_monobank_jar,
    ])

    if not has_requisites:
        await message.answer(
            "❌ Реквізити для оплати не налаштовані.\n\n"
            "Перейдіть до розділу <b>Профіль → Реквізити для оплати</b> "
            "на сайті, щоб додати їх."
        )
        return

    # Get recent clients (from appointments)
    appointments_result = await session.execute(
        select(Appointment)
        .where(Appointment.company_id == company.id)
        .options(selectinload(Appointment.client))
        .order_by(Appointment.created_at.desc())
        .limit(50)
    )
    appointments = appointments_result.scalars().all()

    # Get unique clients
    seen_ids = set()
    clients = []
    for apt in appointments:
        if apt.client and apt.client.id not in seen_ids and apt.client.telegram_id:
            seen_ids.add(apt.client.id)
            clients.append(apt.client)
            if len(clients) >= 5:
                break

    if not clients:
        await message.answer(
            "❌ У вас ще немає клієнтів з Telegram.\n\n"
            "Клієнти з'являться після першого запису через бота."
        )
        return

    await message.answer(
        "Оберіть клієнта, якому надіслати реквізити:",
        reply_markup=clients_list_keyboard(clients),
    )


@router.callback_query(F.data.startswith("send_payment_"))
async def send_payment_to_client(callback: CallbackQuery, session: AsyncSession, bot: Bot):
    """Send payment requisites to selected client."""
    client_id = int(callback.data.split("_")[2])

    # Get client
    client = await session.get(Client, client_id)
    if not client or not client.telegram_id:
        await callback.answer("❌ Клієнт не знайдений", show_alert=True)
        return

    # Get doctor's company
    result = await session.execute(
        select(User)
        .where(User.telegram_id == callback.from_user.id)
        .options(selectinload(User.company))
    )
    user = result.scalar_one_or_none()

    if not user or not user.company:
        await callback.answer("❌ Помилка", show_alert=True)
        return

    company = user.company

    # Format and send message
    payment_message = format_payment_message(company)

    try:
        # Use client bot to send message
        client_bot = Bot(token=settings.CLIENT_BOT_TOKEN)
        await client_bot.send_message(
            chat_id=client.telegram_id,
            text=payment_message,
        )
        await client_bot.session.close()

        await callback.message.edit_text(
            f"✅ Реквізити надіслано клієнту {client.first_name}!"
        )
    except Exception as e:
        await callback.message.edit_text(
            f"❌ Не вдалося надіслати повідомлення клієнту.\n\n"
            f"Можливо, клієнт заблокував бота."
        )

    await callback.answer()


@router.callback_query(F.data == "cancel_payment")
async def cancel_payment(callback: CallbackQuery):
    """Cancel payment requisites sending."""
    await callback.message.edit_text("Надсилання реквізитів скасовано.")
    await callback.answer()
