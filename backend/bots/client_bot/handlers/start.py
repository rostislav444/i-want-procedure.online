import re
from aiogram import Router, F
from aiogram.filters import CommandStart, Command, CommandObject
from aiogram.types import Message, CallbackQuery, ReplyKeyboardMarkup, KeyboardButton
from aiogram.fsm.context import FSMContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.client import Client, ClientCompany, Language
from app.models.company import Company
from app.models.service import Service
from app.models.profiles import SpecialistProfile, SpecialistService
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


def parse_deep_link(args: str) -> dict:
    """
    Parse deep link arguments.

    Formats:
    - {invite_code} - standard client invite
    - book_{invite_code}_s{service_id} - book specific service
    - book_{invite_code}_s{service_id}_sp{specialist_id} - book service with specific specialist
    """
    result = {
        "type": "invite",
        "invite_code": None,
        "service_id": None,
        "specialist_id": None,
    }

    if not args:
        return result

    # Check for booking link: book_{invite_code}_s{service_id}[_sp{specialist_id}]
    book_match = re.match(r'^book_([^_]+)_s(\d+)(?:_sp(\d+))?$', args)
    if book_match:
        result["type"] = "book"
        result["invite_code"] = book_match.group(1)
        result["service_id"] = int(book_match.group(2))
        if book_match.group(3):
            result["specialist_id"] = int(book_match.group(3))
        return result

    # Default: just invite code
    result["invite_code"] = args
    return result


@router.message(CommandStart(deep_link=True))
async def cmd_start_with_link(
    message: Message,
    command: CommandObject,
    session: AsyncSession,
    state: FSMContext
):
    """Handle /start with deep link parameters"""
    parsed = parse_deep_link(command.args)

    if not parsed["invite_code"]:
        await message.answer(
            "Невірне посилання. Зверніться до вашого спеціаліста за новим посиланням."
        )
        return

    # Find company by invite code
    result = await session.execute(
        select(Company).where(Company.invite_code == parsed["invite_code"])
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

    # Handle booking link
    if parsed["type"] == "book":
        await handle_booking_link(
            message, session, state, client, company,
            parsed["service_id"], parsed["specialist_id"]
        )
        return

    # Standard invite flow
    if client:
        # Check if client is already associated with this company
        existing_link = await session.execute(
            select(ClientCompany).where(
                ClientCompany.client_id == client.id,
                ClientCompany.company_id == company.id,
            )
        )
        if not existing_link.scalar_one_or_none():
            # Add new company association (don't replace existing ones)
            client_company = ClientCompany(client_id=client.id, company_id=company.id)
            session.add(client_company)
            # Update primary company_id if not set
            if client.company_id is None:
                client.company_id = company.id
            await session.commit()
            await message.answer(
                f"Чудово! Ви додали нового спеціаліста: {company.name}\n\n" + t("main_menu", client.language),
                reply_markup=main_menu_keyboard(client.language),
            )
        else:
            await message.answer(
                f"Ви вже записані до: {company.name}\n\n" + t("main_menu", client.language),
                reply_markup=main_menu_keyboard(client.language),
            )
    else:
        # Save company_id to state for registration
        await state.update_data(company_id=company.id, company_name=company.name)
        await message.answer(
            f"Вітаємо! Ви записуєтесь до: {company.name}\n\n" + t("welcome", "uk"),
            reply_markup=language_keyboard(),
        )


async def handle_booking_link(
    message: Message,
    session: AsyncSession,
    state: FSMContext,
    client: Client | None,
    company: Company,
    service_id: int,
    specialist_id: int | None,
):
    """Handle booking deep link - redirect to booking with pre-selected service/specialist"""

    # Validate service exists and belongs to company
    result = await session.execute(
        select(Service).where(
            Service.id == service_id,
            Service.company_id == company.id,
            Service.is_active == True,
        )
    )
    service = result.scalar_one_or_none()

    if not service:
        await message.answer(
            "Послуга не знайдена або більше не доступна.\n"
            "Зверніться до вашого спеціаліста."
        )
        return

    # Validate specialist if provided
    specialist_profile = None
    if specialist_id:
        result = await session.execute(
            select(SpecialistProfile).where(
                SpecialistProfile.id == specialist_id,
                SpecialistProfile.company_id == company.id,
                SpecialistProfile.is_active == True,
            )
        )
        specialist_profile = result.scalar_one_or_none()

        if not specialist_profile:
            await message.answer(
                "Спеціаліст не знайдений.\n"
                "Зверніться до клініки."
            )
            return

        # Check if specialist can perform this service
        result = await session.execute(
            select(SpecialistService).where(
                SpecialistService.specialist_profile_id == specialist_id,
                SpecialistService.service_id == service_id,
                SpecialistService.is_active == True,
            )
        )
        if not result.scalar_one_or_none():
            await message.answer(
                f"Спеціаліст не виконує цю послугу.\n"
                "Оберіть іншого спеціаліста або зверніться до клініки."
            )
            return

    if not client:
        # New user - save booking intent and start registration
        await state.update_data(
            company_id=company.id,
            company_name=company.name,
            booking_service_id=service_id,
            booking_service_name=service.name,
            booking_specialist_id=specialist_id,
        )
        await message.answer(
            f"Вітаємо! Ви бажаєте записатися на:\n"
            f"📋 {service.name}\n"
            f"💰 {service.price} грн\n"
            f"⏱ {service.duration_minutes} хв\n\n"
            f"Для продовження оберіть мову:",
            reply_markup=language_keyboard(),
        )
        return

    # Existing user - ensure company association
    existing_link = await session.execute(
        select(ClientCompany).where(
            ClientCompany.client_id == client.id,
            ClientCompany.company_id == company.id,
        )
    )
    if not existing_link.scalar_one_or_none():
        client_company = ClientCompany(client_id=client.id, company_id=company.id)
        session.add(client_company)
        if client.company_id is None:
            client.company_id = company.id
        await session.commit()

    # Save booking intent and trigger booking flow
    await state.update_data(
        company_id=company.id,
        booking_service_id=service_id,
        booking_specialist_id=specialist_id,
    )

    # Import booking states and start booking
    from bots.client_bot.handlers.booking import BookingStates

    await state.set_state(BookingStates.selecting_date)

    specialist_info = ""
    if specialist_profile:
        # Get user info for specialist
        from app.models.user import User
        result = await session.execute(
            select(User).where(User.id == specialist_profile.user_id)
        )
        user = result.scalar_one_or_none()
        if user:
            specialist_info = f"👨‍⚕️ Спеціаліст: {user.first_name} {user.last_name}\n"

    await message.answer(
        f"📋 Послуга: {service.name}\n"
        f"💰 Ціна: {service.price} грн\n"
        f"⏱ Тривалість: {service.duration_minutes} хв\n"
        f"{specialist_info}\n"
        f"Оберіть дату для запису:",
        # TODO: Add date selection keyboard
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
