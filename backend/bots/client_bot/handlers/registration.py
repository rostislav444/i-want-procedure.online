from aiogram import Router, F
from aiogram.types import Message, ReplyKeyboardMarkup, KeyboardButton, ReplyKeyboardRemove
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.client import Client, ClientCompany, Language
from bots.i18n import t
from bots.client_bot.keyboards import contact_keyboard, main_menu_keyboard

router = Router()


class RegistrationStates(StatesGroup):
    waiting_for_name = State()
    waiting_for_surname = State()
    waiting_for_phone = State()


def skip_keyboard(prefill_value: str = None) -> ReplyKeyboardMarkup:
    """Keyboard with prefilled value or skip button"""
    if prefill_value:
        return ReplyKeyboardMarkup(
            keyboard=[[KeyboardButton(text=f"✓ {prefill_value}")]],
            resize_keyboard=True,
            one_time_keyboard=True,
        )
    return ReplyKeyboardRemove()


async def create_or_merge_client(
    session: AsyncSession,
    telegram_id: int,
    telegram_username: str | None,
    first_name: str,
    last_name: str,
    phone: str | None,
    language: Language,
    company_id: int,
) -> Client:
    """
    Create a new client or merge with existing phone-matched client.

    If a client with the same phone exists and has no telegram_id (admin-created),
    update that client with the telegram information (merge accounts).
    """
    # Check for existing client by phone (admin-created, no telegram_id)
    if phone:
        result = await session.execute(
            select(Client).where(
                Client.phone == phone,
                Client.telegram_id.is_(None),
            )
        )
        existing = result.scalar_one_or_none()

        if existing:
            # Merge: update existing client with telegram info
            existing.telegram_id = telegram_id
            existing.telegram_username = telegram_username
            existing.language = language
            if not existing.last_name and last_name:
                existing.last_name = last_name

            # Ensure company association exists
            assoc = await session.execute(
                select(ClientCompany).where(
                    ClientCompany.client_id == existing.id,
                    ClientCompany.company_id == company_id,
                )
            )
            if not assoc.scalar_one_or_none():
                session.add(ClientCompany(client_id=existing.id, company_id=company_id))

            await session.commit()
            return existing

    # No merge candidate: create new client
    client = Client(
        telegram_id=telegram_id,
        telegram_username=telegram_username,
        first_name=first_name,
        last_name=last_name,
        phone=phone,
        language=language,
        company_id=company_id,
    )
    session.add(client)
    await session.flush()

    session.add(ClientCompany(client_id=client.id, company_id=company_id))
    await session.commit()
    return client


@router.message(RegistrationStates.waiting_for_name)
async def process_name(message: Message, state: FSMContext):
    data = await state.get_data()
    lang = data.get("language", "uk")

    # Handle prefilled value button
    if message.text and message.text.startswith("✓ "):
        first_name = message.text[2:]  # Remove "✓ " prefix
    else:
        first_name = message.text.strip() if message.text else ""

    if not first_name or len(first_name) < 2:
        await message.answer(t("registration.ask_name", lang))
        return

    await state.update_data(first_name=first_name)
    await state.set_state(RegistrationStates.waiting_for_surname)

    # Prefill surname from Telegram if available
    telegram_last_name = message.from_user.last_name
    await message.answer(
        t("registration.ask_surname", lang),
        reply_markup=skip_keyboard(telegram_last_name),
    )


@router.message(RegistrationStates.waiting_for_surname)
async def process_surname(message: Message, state: FSMContext):
    data = await state.get_data()
    lang = data.get("language", "uk")

    # Handle prefilled value button
    if message.text and message.text.startswith("✓ "):
        last_name = message.text[2:]  # Remove "✓ " prefix
    else:
        last_name = message.text.strip() if message.text else ""

    if not last_name or len(last_name) < 2:
        await message.answer(t("registration.ask_surname", lang))
        return

    await state.update_data(last_name=last_name)
    await state.set_state(RegistrationStates.waiting_for_phone)
    await message.answer(
        t("registration.ask_phone", lang),
        reply_markup=contact_keyboard(lang),
    )


@router.message(RegistrationStates.waiting_for_phone, F.contact)
async def process_contact(message: Message, state: FSMContext, session: AsyncSession):
    data = await state.get_data()
    lang = data.get("language", "uk")
    company_id = data["company_id"]

    await create_or_merge_client(
        session=session,
        telegram_id=message.from_user.id,
        telegram_username=message.from_user.username,
        first_name=data["first_name"],
        last_name=data["last_name"],
        phone=message.contact.phone_number,
        language=Language(lang),
        company_id=company_id,
    )

    await state.clear()
    await message.answer(
        t("registration.registration_complete", lang),
        reply_markup=main_menu_keyboard(lang),
    )


@router.message(RegistrationStates.waiting_for_phone, F.text)
async def process_phone_text(message: Message, state: FSMContext, session: AsyncSession):
    data = await state.get_data()
    lang = data.get("language", "uk")
    company_id = data["company_id"]

    # Handle "Skip" button
    if message.text == t("skip", lang):
        phone = None
    else:
        phone = message.text

    await create_or_merge_client(
        session=session,
        telegram_id=message.from_user.id,
        telegram_username=message.from_user.username,
        first_name=data["first_name"],
        last_name=data["last_name"],
        phone=phone,
        language=Language(lang),
        company_id=company_id,
    )

    await state.clear()
    await message.answer(
        t("registration.registration_complete", lang),
        reply_markup=main_menu_keyboard(lang),
    )
