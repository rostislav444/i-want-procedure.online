from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.company_member import CompanyMember
from app.core.config import settings
from bots.doctor_bot.keyboards import (
    main_menu_keyboard,
    skip_keyboard,
    contact_keyboard,
    confirm_registration_keyboard,
    remove_keyboard,
)

router = Router()


class RegistrationStates(StatesGroup):
    waiting_for_first_name = State()
    waiting_for_last_name = State()
    waiting_for_patronymic = State()
    waiting_for_city = State()
    waiting_for_phone = State()
    waiting_for_email = State()
    confirm_registration = State()


@router.callback_query(F.data == "register_new")
async def start_registration(callback: CallbackQuery, state: FSMContext, session: AsyncSession):
    """Start registration process"""
    # Check if user is already registered
    result = await session.execute(
        select(User).where(User.telegram_id == callback.from_user.id)
    )
    if result.scalar_one_or_none():
        await callback.message.answer(
            "Ви вже зареєстровані в системі. Використовуйте меню для навігації.",
            reply_markup=main_menu_keyboard(),
        )
        await callback.answer()
        return

    # Pre-fill with Telegram data
    telegram_first_name = callback.from_user.first_name or ""

    await state.update_data(
        telegram_id=callback.from_user.id,
        telegram_username=callback.from_user.username,
    )
    await state.set_state(RegistrationStates.waiting_for_first_name)

    text = "Чудово! Давайте створимо ваш акаунт.\n\nВведіть ваше ім'я:"
    if telegram_first_name:
        await callback.message.answer(
            text,
            reply_markup=skip_keyboard(telegram_first_name),
        )
    else:
        await callback.message.answer(text, reply_markup=remove_keyboard())
    await callback.answer()


@router.message(RegistrationStates.waiting_for_first_name)
async def process_first_name(message: Message, state: FSMContext):
    """Process first name input"""
    # Handle prefilled value button
    if message.text and message.text.startswith("Далі ("):
        first_name = message.from_user.first_name
    else:
        first_name = message.text.strip() if message.text else ""

    if not first_name or len(first_name) < 2:
        await message.answer("Ім'я повинно містити мінімум 2 символи. Спробуйте ще раз:")
        return

    await state.update_data(first_name=first_name)
    await state.set_state(RegistrationStates.waiting_for_last_name)

    telegram_last_name = message.from_user.last_name or ""
    text = "Введіть ваше прізвище:"
    if telegram_last_name:
        await message.answer(text, reply_markup=skip_keyboard(telegram_last_name))
    else:
        await message.answer(text, reply_markup=remove_keyboard())


@router.message(RegistrationStates.waiting_for_last_name)
async def process_last_name(message: Message, state: FSMContext):
    """Process last name input"""
    # Handle prefilled value button
    if message.text and message.text.startswith("Далі ("):
        last_name = message.from_user.last_name
    else:
        last_name = message.text.strip() if message.text else ""

    if not last_name or len(last_name) < 2:
        await message.answer("Прізвище повинно містити мінімум 2 символи. Спробуйте ще раз:")
        return

    await state.update_data(last_name=last_name)
    await state.set_state(RegistrationStates.waiting_for_patronymic)
    await message.answer(
        "Введіть ваше по-батькові (або натисніть 'Пропустити'):",
        reply_markup=skip_keyboard(),
    )


@router.message(RegistrationStates.waiting_for_patronymic)
async def process_patronymic(message: Message, state: FSMContext):
    """Process patronymic input"""
    if message.text == "Пропустити":
        patronymic = None
    else:
        patronymic = message.text.strip() if message.text else None

    await state.update_data(patronymic=patronymic)
    await state.set_state(RegistrationStates.waiting_for_city)
    await message.answer(
        "Введіть ваше місто:",
        reply_markup=remove_keyboard(),
    )


@router.message(RegistrationStates.waiting_for_city)
async def process_city(message: Message, state: FSMContext):
    """Process city input"""
    city = message.text.strip() if message.text else ""

    if not city or len(city) < 2:
        await message.answer("Назва міста повинна містити мінімум 2 символи. Спробуйте ще раз:")
        return

    await state.update_data(city=city)
    await state.set_state(RegistrationStates.waiting_for_phone)
    await message.answer(
        "Поділіться вашим номером телефону:",
        reply_markup=contact_keyboard(),
    )


@router.message(RegistrationStates.waiting_for_phone, F.contact)
async def process_phone_contact(message: Message, state: FSMContext):
    """Process phone from contact share"""
    phone = message.contact.phone_number
    await state.update_data(phone=phone)
    await state.set_state(RegistrationStates.waiting_for_email)
    await message.answer(
        "Введіть ваш email (або натисніть 'Пропустити'):\n\n"
        "Email потрібен для відновлення доступу.",
        reply_markup=skip_keyboard(),
    )


@router.message(RegistrationStates.waiting_for_phone, F.text)
async def process_phone_text(message: Message, state: FSMContext):
    """Process phone as text"""
    # Basic phone validation
    phone = message.text.strip()
    cleaned = phone.replace('+', '').replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
    if not cleaned.isdigit() or len(cleaned) < 10:
        await message.answer(
            "Невірний формат номеру телефону. Натисніть кнопку 'Поділитися номером':",
            reply_markup=contact_keyboard(),
        )
        return

    await state.update_data(phone=phone)
    await state.set_state(RegistrationStates.waiting_for_email)
    await message.answer(
        "Введіть ваш email (або натисніть 'Пропустити'):\n\n"
        "Email потрібен для відновлення доступу.",
        reply_markup=skip_keyboard(),
    )


@router.message(RegistrationStates.waiting_for_email)
async def process_email(message: Message, state: FSMContext, session: AsyncSession):
    """Process email input"""
    if message.text == "Пропустити":
        email = None
    else:
        email = message.text.strip().lower() if message.text else None
        # Basic email validation
        if email and ('@' not in email or '.' not in email):
            await message.answer(
                "Невірний формат email. Спробуйте ще раз або натисніть 'Пропустити':",
                reply_markup=skip_keyboard(),
            )
            return

        # Check if email already exists
        if email:
            result = await session.execute(select(User).where(User.email == email))
            if result.scalar_one_or_none():
                await message.answer(
                    "Цей email вже зареєстрований. Введіть інший email або натисніть 'Пропустити':",
                    reply_markup=skip_keyboard(),
                )
                return

    await state.update_data(email=email)

    # Show confirmation
    data = await state.get_data()
    await state.set_state(RegistrationStates.confirm_registration)

    summary = (
        "Перевірте ваші дані:\n\n"
        f"Ім'я: {data['first_name']}\n"
        f"Прізвище: {data['last_name']}\n"
    )
    if data.get('patronymic'):
        summary += f"По-батькові: {data['patronymic']}\n"
    summary += f"Місто: {data['city']}\n"
    summary += f"Телефон: {data['phone']}\n"
    if data.get('telegram_username'):
        summary += f"Telegram: @{data['telegram_username']}\n"
    if email:
        summary += f"Email: {email}\n"

    summary += "\nВсе вірно?"

    await message.answer(summary, reply_markup=confirm_registration_keyboard())


@router.callback_query(F.data == "confirm_registration", RegistrationStates.confirm_registration)
async def confirm_registration(callback: CallbackQuery, state: FSMContext, session: AsyncSession):
    """Complete registration - create user"""
    data = await state.get_data()

    # Create user
    user = User(
        first_name=data['first_name'],
        last_name=data['last_name'],
        patronymic=data.get('patronymic'),
        city=data.get('city'),
        phone=data.get('phone'),
        email=data.get('email'),
        telegram_id=data['telegram_id'],
        telegram_username=data.get('telegram_username'),
        hashed_password=None,  # No password for Telegram-only users
    )
    session.add(user)
    await session.flush()  # Get user.id

    # If user was invited to a team, add them as a member
    if data.get('team_company_id'):
        member = CompanyMember(
            user_id=user.id,
            company_id=data['team_company_id'],
            is_specialist=True,
            is_active=True,
        )
        session.add(member)

    await session.commit()

    await state.clear()

    # Send success message with link to create company in admin
    admin_url = f"{settings.FRONTEND_URL}"

    if data.get('team_company_name'):
        # Joined a team
        await callback.message.answer(
            f"Реєстрація успішна!\n\n"
            f"Вітаємо, {user.first_name}! Ваш акаунт створено.\n"
            f"Ви приєдналися до команди \"{data['team_company_name']}\".\n\n"
            f"Перейдіть в адмін-панель для налаштувань:\n"
            f"{admin_url}",
            reply_markup=main_menu_keyboard(),
        )
    else:
        # New user without team
        await callback.message.answer(
            f"Реєстрація успішна!\n\n"
            f"Вітаємо, {user.first_name}! Ваш акаунт створено.\n\n"
            f"Тепер перейдіть в адмін-панель для створення вашої компанії:\n"
            f"{admin_url}\n\n"
            f"Там ви зможете:\n"
            f"- Створити свою компанію\n"
            f"- Додати послуги та ціни\n"
            f"- Налаштувати розклад роботи\n"
            f"- Отримувати записи від клієнтів",
            reply_markup=remove_keyboard(),
        )
    await callback.answer()


@router.callback_query(F.data == "cancel_registration")
async def cancel_registration(callback: CallbackQuery, state: FSMContext):
    """Cancel registration"""
    await state.clear()
    await callback.message.answer(
        "Реєстрацію скасовано. Натисніть /start щоб почати знову.",
        reply_markup=remove_keyboard(),
    )
    await callback.answer()
