from aiogram import Router, F
from aiogram.types import Message
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.client import Client, Language
from bots.i18n import t
from bots.client_bot.keyboards import contact_keyboard, main_menu_keyboard

router = Router()


class RegistrationStates(StatesGroup):
    waiting_for_name = State()
    waiting_for_surname = State()
    waiting_for_phone = State()


@router.message(RegistrationStates.waiting_for_name)
async def process_name(message: Message, state: FSMContext):
    data = await state.get_data()
    lang = data.get("language", "uk")

    await state.update_data(first_name=message.text)
    await state.set_state(RegistrationStates.waiting_for_surname)
    await message.answer(t("registration.ask_surname", lang))


@router.message(RegistrationStates.waiting_for_surname)
async def process_surname(message: Message, state: FSMContext):
    data = await state.get_data()
    lang = data.get("language", "uk")

    await state.update_data(last_name=message.text)
    await state.set_state(RegistrationStates.waiting_for_phone)
    await message.answer(
        t("registration.ask_phone", lang),
        reply_markup=contact_keyboard(lang),
    )


@router.message(RegistrationStates.waiting_for_phone, F.contact)
async def process_contact(message: Message, state: FSMContext, session: AsyncSession):
    data = await state.get_data()
    lang = data.get("language", "uk")

    # Create client with company_id from deep link
    client = Client(
        telegram_id=message.from_user.id,
        telegram_username=message.from_user.username,
        first_name=data["first_name"],
        last_name=data["last_name"],
        phone=message.contact.phone_number,
        language=Language(lang),
        company_id=data["company_id"],
    )
    session.add(client)
    await session.commit()

    await state.clear()
    await message.answer(
        t("registration.registration_complete", lang),
        reply_markup=main_menu_keyboard(lang),
    )


@router.message(RegistrationStates.waiting_for_phone, F.text)
async def process_phone_text(message: Message, state: FSMContext, session: AsyncSession):
    data = await state.get_data()
    lang = data.get("language", "uk")

    # Handle "Skip" button
    if message.text == t("skip", lang):
        phone = None
    else:
        phone = message.text

    # Create client with company_id from deep link
    client = Client(
        telegram_id=message.from_user.id,
        telegram_username=message.from_user.username,
        first_name=data["first_name"],
        last_name=data["last_name"],
        phone=phone,
        language=Language(lang),
        company_id=data["company_id"],
    )
    session.add(client)
    await session.commit()

    await state.clear()
    await message.answer(
        t("registration.registration_complete", lang),
        reply_markup=main_menu_keyboard(lang),
    )
