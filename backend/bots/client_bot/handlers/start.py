from aiogram import Router, F
from aiogram.filters import CommandStart, Command, CommandObject
from aiogram.types import Message, CallbackQuery, ReplyKeyboardMarkup, KeyboardButton
from aiogram.fsm.context import FSMContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.client import Client, Language
from app.models.company import Company
from bots.i18n import t
from bots.client_bot.keyboards import language_keyboard, main_menu_keyboard


def prefill_keyboard(value: str) -> ReplyKeyboardMarkup:
    """Keyboard with prefilled value"""
    return ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text=f"✓ {value}")]],
        resize_keyboard=True,
        one_time_keyboard=True,
    )

router = Router()


@router.message(CommandStart(deep_link=True))
async def cmd_start_with_link(
    message: Message,
    command: CommandObject,
    session: AsyncSession,
    state: FSMContext
):
    """Handle /start with invite code (deep link)"""
    invite_code = command.args

    # Find company by invite code
    result = await session.execute(
        select(Company).where(Company.invite_code == invite_code)
    )
    company = result.scalar_one_or_none()

    if not company:
        await message.answer(
            "Невірне посилання. Зверніться до вашого спеціаліста за новим посиланням."
        )
        return

    # Check if user already exists
    result = await session.execute(
        select(Client).where(Client.telegram_id == message.from_user.id)
    )
    client = result.scalar_one_or_none()

    if client:
        # Update company if different
        if client.company_id != company.id:
            client.company_id = company.id
            await session.commit()

        await message.answer(
            f"Вітаємо! Ви записуєтесь до: {company.name}\n\n" + t("main_menu", client.language),
            reply_markup=main_menu_keyboard(client.language),
        )
    else:
        # Save company_id to state for registration
        await state.update_data(company_id=company.id, company_name=company.name)
        await message.answer(
            f"Вітаємо! Ви записуєтесь до: {company.name}\n\n" + t("welcome", "uk"),
            reply_markup=language_keyboard(),
        )


@router.message(CommandStart())
async def cmd_start(message: Message, session: AsyncSession, state: FSMContext):
    """Handle /start without invite code"""
    # Check if user exists
    result = await session.execute(
        select(Client).where(Client.telegram_id == message.from_user.id)
    )
    client = result.scalar_one_or_none()

    if client:
        # User exists, show main menu
        await message.answer(
            t("main_menu", client.language),
            reply_markup=main_menu_keyboard(client.language),
        )
    else:
        # New user without invite link
        await message.answer(
            "Для запису на процедури вам потрібне посилання від вашого спеціаліста.\n\n"
            "Зверніться до нього за персональним посиланням."
        )


@router.callback_query(F.data.startswith("lang_"))
async def process_language(callback: CallbackQuery, session: AsyncSession, state: FSMContext):
    lang = callback.data.split("_")[1]

    # Check if user exists
    result = await session.execute(
        select(Client).where(Client.telegram_id == callback.from_user.id)
    )
    client = result.scalar_one_or_none()

    if client:
        # Update language
        client.language = Language(lang)
        await session.commit()
        await callback.message.edit_text(t("language_selected", lang))
        await callback.message.answer(
            t("main_menu", lang),
            reply_markup=main_menu_keyboard(lang),
        )
    else:
        # Check if we have company_id from deep link
        data = await state.get_data()
        if not data.get("company_id"):
            await callback.message.edit_text(
                "Для запису на процедури вам потрібне посилання від вашого спеціаліста."
            )
            await callback.answer()
            return

        # Save language to state and start registration
        await state.update_data(language=lang)
        from bots.client_bot.handlers.registration import RegistrationStates

        await state.set_state(RegistrationStates.waiting_for_name)
        await callback.message.edit_text(t("language_selected", lang))

        # Prefill first name from Telegram if available
        telegram_first_name = callback.from_user.first_name
        if telegram_first_name:
            await callback.message.answer(
                t("registration.ask_name", lang),
                reply_markup=prefill_keyboard(telegram_first_name),
            )
        else:
            await callback.message.answer(t("registration.ask_name", lang))

    await callback.answer()


@router.message(Command("language"))
async def cmd_language(message: Message, session: AsyncSession):
    # Only allow if user exists
    result = await session.execute(
        select(Client).where(Client.telegram_id == message.from_user.id)
    )
    client = result.scalar_one_or_none()

    if client:
        await message.answer(
            t("welcome", client.language),
            reply_markup=language_keyboard(),
        )
    else:
        await message.answer("Спочатку зареєструйтесь через посилання від спеціаліста.")
