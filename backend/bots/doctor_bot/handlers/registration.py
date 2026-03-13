import re

from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.company import Company
from app.models.company_member import CompanyMember
from app.models.city import City
from app.core.config import settings
from app.services.geocoding import search_cities, reverse_geocode, find_nearest_city
from bots.doctor_bot.keyboards import (
    main_menu_keyboard,
    skip_keyboard,
    contact_keyboard,
    confirm_registration_keyboard,
    company_type_keyboard,
    remove_keyboard,
    location_keyboard,
    city_results_keyboard,
)

router = Router()


def generate_slug(name: str) -> str:
    """Generate URL-friendly slug from name"""
    try:
        import transliterate
        slug = transliterate.translit(name, 'uk', reversed=True)
    except:
        slug = name
    slug = slug.lower()
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    slug = slug.strip('-')
    return slug or 'company'


class RegistrationStates(StatesGroup):
    waiting_for_company_type = State()
    waiting_for_company_name = State()
    waiting_for_first_name = State()
    waiting_for_last_name = State()
    waiting_for_patronymic = State()
    waiting_for_city = State()
    waiting_for_address = State()
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

    # Get existing state data (may contain team_company_id from invite link)
    data = await state.get_data()

    # Pre-fill with Telegram data
    await state.update_data(
        telegram_id=callback.from_user.id,
        telegram_username=callback.from_user.username,
    )

    # If user was invited to a team, skip company type selection
    if data.get('team_company_id'):
        await state.set_state(RegistrationStates.waiting_for_first_name)
        team_name = data.get('team_company_name', 'команду')
        telegram_first_name = callback.from_user.first_name or ""
        text = f"Чудово! Ви приєднаєтесь до \"{team_name}\".\n\nВведіть ваше ім'я:"
        if telegram_first_name:
            await callback.message.answer(text, reply_markup=skip_keyboard(telegram_first_name))
        else:
            await callback.message.answer(text, reply_markup=remove_keyboard())
    else:
        await state.set_state(RegistrationStates.waiting_for_company_type)
        await callback.message.answer(
            "Чудово! Давайте створимо ваш акаунт.\n\n"
            "Оберіть тип вашої діяльності:",
            reply_markup=company_type_keyboard(),
        )
    await callback.answer()


@router.callback_query(F.data == "company_type_solo", RegistrationStates.waiting_for_company_type)
async def select_solo_type(callback: CallbackQuery, state: FSMContext):
    """User selected solo specialist type"""
    await state.update_data(company_type="solo")
    await state.set_state(RegistrationStates.waiting_for_first_name)

    telegram_first_name = callback.from_user.first_name or ""
    text = "Введіть ваше ім'я:"
    if telegram_first_name:
        await callback.message.answer(text, reply_markup=skip_keyboard(telegram_first_name))
    else:
        await callback.message.answer(text, reply_markup=remove_keyboard())
    await callback.answer()


@router.callback_query(F.data == "company_type_clinic", RegistrationStates.waiting_for_company_type)
async def select_clinic_type(callback: CallbackQuery, state: FSMContext):
    """User selected clinic type"""
    await state.update_data(company_type="clinic")
    await state.set_state(RegistrationStates.waiting_for_company_name)

    await callback.message.answer(
        "Введіть назву вашої клініки/салону:",
        reply_markup=remove_keyboard(),
    )
    await callback.answer()


@router.message(RegistrationStates.waiting_for_company_name)
async def process_company_name(message: Message, state: FSMContext):
    """Process company name input"""
    company_name = message.text.strip() if message.text else ""

    if not company_name or len(company_name) < 2:
        await message.answer("Назва повинна містити мінімум 2 символи. Спробуйте ще раз:")
        return

    await state.update_data(company_name=company_name)
    await state.set_state(RegistrationStates.waiting_for_first_name)

    telegram_first_name = message.from_user.first_name or ""
    text = "Тепер введіть ваше ім'я:"
    if telegram_first_name:
        await message.answer(text, reply_markup=skip_keyboard(telegram_first_name))
    else:
        await message.answer(text, reply_markup=remove_keyboard())


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

    # Show popular cities (regional centers) as initial options
    await message.answer(
        "Оберіть ваше місто.\n\n"
        "Введіть назву міста для пошуку або поділіться геопозицією:",
        reply_markup=location_keyboard(),
    )


@router.message(RegistrationStates.waiting_for_city, F.location)
async def process_city_location(message: Message, state: FSMContext, session: AsyncSession):
    """Process city from shared geolocation"""
    lat = message.location.latitude
    lon = message.location.longitude

    # Find nearest city in DB
    city = await find_nearest_city(session, lat, lon)
    if city:
        await state.update_data(city=city.name, city_id=city.id, city_oblast=city.oblast)
        await message.answer(
            f"📍 Визначено місто: {city.name}, {city.oblast}",
            reply_markup=remove_keyboard(),
        )
        # Try to get address from Nominatim
        try:
            geo_data = await reverse_geocode(lat, lon)
            if geo_data.get("address"):
                await state.update_data(address=geo_data["address"])
                await message.answer(
                    f"🏠 Визначена адреса: {geo_data['address']}\n\n"
                    "Якщо адреса вірна, натисніть 'Далі'. "
                    "Або введіть адресу вручну (вулиця, будинок):",
                    reply_markup=skip_keyboard(f"Далі ({geo_data['address']})") if len(geo_data['address']) < 30 else skip_keyboard("Далі"),
                )
                await state.set_state(RegistrationStates.waiting_for_address)
                return
        except Exception:
            pass

        # No address detected, ask for it
        await state.set_state(RegistrationStates.waiting_for_address)
        await message.answer(
            "Введіть вашу адресу (вулиця, будинок) або натисніть 'Пропустити':",
            reply_markup=skip_keyboard(),
        )
    else:
        await message.answer(
            "Не вдалося визначити місто за геопозицією.\n"
            "Введіть назву міста для пошуку:",
            reply_markup=remove_keyboard(),
        )


@router.message(RegistrationStates.waiting_for_city, F.text)
async def process_city_text(message: Message, state: FSMContext, session: AsyncSession):
    """Process city text search"""
    text = message.text.strip() if message.text else ""

    if text == "Пропустити":
        await state.update_data(city=None, city_id=None)
        await state.set_state(RegistrationStates.waiting_for_phone)
        await message.answer(
            "Поділіться вашим номером телефону:",
            reply_markup=contact_keyboard(),
        )
        return

    if not text or len(text) < 2:
        await message.answer("Введіть мінімум 2 символи для пошуку міста:")
        return

    # Search cities in DB
    cities = await search_cities(session, text, limit=5)

    if not cities:
        await message.answer(
            "Місто не знайдено. Спробуйте ввести інший варіант назви "
            "або поділіться геопозицією:",
            reply_markup=location_keyboard(),
        )
        return

    if len(cities) == 1:
        # Auto-select if only one match
        city = cities[0]
        await state.update_data(city=city.name, city_id=city.id, city_oblast=city.oblast)
        await message.answer(
            f"📍 Обрано: {city.name}, {city.oblast}",
            reply_markup=remove_keyboard(),
        )
        await state.set_state(RegistrationStates.waiting_for_address)
        await message.answer(
            "Введіть вашу адресу (вулиця, будинок) або натисніть 'Пропустити':",
            reply_markup=skip_keyboard(),
        )
        return

    # Show results as inline buttons
    await message.answer(
        "Оберіть місто зі списку:",
        reply_markup=city_results_keyboard(cities),
    )


@router.callback_query(F.data.startswith("city_"), RegistrationStates.waiting_for_city)
async def process_city_selection(callback: CallbackQuery, state: FSMContext, session: AsyncSession):
    """Process city selection from inline buttons"""
    city_id = int(callback.data.split("_")[1])
    result = await session.execute(select(City).where(City.id == city_id))
    city = result.scalar_one_or_none()

    if not city:
        await callback.answer("Місто не знайдено")
        return

    await state.update_data(city=city.name, city_id=city.id, city_oblast=city.oblast)
    await callback.message.answer(
        f"📍 Обрано: {city.name}, {city.oblast}",
        reply_markup=remove_keyboard(),
    )
    await state.set_state(RegistrationStates.waiting_for_address)
    await callback.message.answer(
        "Введіть вашу адресу (вулиця, будинок) або натисніть 'Пропустити':",
        reply_markup=skip_keyboard(),
    )
    await callback.answer()


@router.message(RegistrationStates.waiting_for_address)
async def process_address(message: Message, state: FSMContext):
    """Process address input"""
    if message.text == "Пропустити" or (message.text and message.text.startswith("Далі")):
        # Keep existing address from geolocation or set None
        if message.text == "Пропустити":
            await state.update_data(address=None)
    else:
        address = message.text.strip() if message.text else None
        if address:
            await state.update_data(address=address)

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

    # Determine company name for display
    if data.get('company_type') == 'clinic' and data.get('company_name'):
        company_display = f"🏥 Клініка: {data['company_name']}"
    else:
        company_display = f"👤 ФОП: {data['first_name']} {data['last_name']}"

    # Build city display
    city_display = ""
    if data.get('city'):
        city_display = data['city']
        if data.get('city_oblast'):
            city_display += f", {data['city_oblast']}"
    else:
        city_display = "Не вказано"

    summary = (
        "Перевірте ваші дані:\n\n"
        f"{company_display}\n\n"
        f"Ім'я: {data['first_name']}\n"
        f"Прізвище: {data['last_name']}\n"
    )
    if data.get('patronymic'):
        summary += f"По-батькові: {data['patronymic']}\n"
    summary += f"📍 Місто: {city_display}\n"
    if data.get('address'):
        summary += f"🏠 Адреса: {data['address']}\n"
    summary += f"Телефон: {data['phone']}\n"
    if data.get('telegram_username'):
        summary += f"Telegram: @{data['telegram_username']}\n"
    if email:
        summary += f"Email: {email}\n"

    summary += "\nВсе вірно?"

    await message.answer(summary, reply_markup=confirm_registration_keyboard())


@router.callback_query(F.data == "confirm_registration", RegistrationStates.confirm_registration)
async def confirm_registration(callback: CallbackQuery, state: FSMContext, session: AsyncSession):
    """Complete registration - create user, company, and membership"""
    data = await state.get_data()

    # Create user
    user = User(
        first_name=data['first_name'],
        last_name=data['last_name'],
        patronymic=data.get('patronymic'),
        city=data.get('city'),  # legacy string field
        city_id=data.get('city_id'),
        address=data.get('address'),
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
        company_name = data.get('team_company_name', 'команда')
    else:
        # Create company for the user
        if data.get('company_type') == 'clinic' and data.get('company_name'):
            company_name = data['company_name']
            company_type = 'clinic'
        else:
            company_name = f"{data['first_name']} {data['last_name']}"
            company_type = 'solo'

        # Generate unique slug
        base_slug = generate_slug(company_name)
        slug = base_slug
        counter = 1
        while True:
            result = await session.execute(select(Company).where(Company.slug == slug))
            if not result.scalar_one_or_none():
                break
            slug = f"{base_slug}-{counter}"
            counter += 1

        company = Company(
            name=company_name,
            slug=slug,
            type=company_type,
            city_id=data.get('city_id'),
            address=data.get('address'),
        )
        session.add(company)
        await session.flush()  # Get company.id

        # Create membership (owner + manager + specialist)
        member = CompanyMember(
            user_id=user.id,
            company_id=company.id,
            is_owner=True,
            is_manager=True,
            is_specialist=True,
            is_active=True,
        )
        session.add(member)

    await session.commit()

    await state.clear()

    # Send success message
    admin_url = f"{settings.FRONTEND_URL}/admin"

    if data.get('team_company_id'):
        # Joined a team
        await callback.message.answer(
            f"Реєстрація успішна!\n\n"
            f"Вітаємо, {user.first_name}! Ваш акаунт створено.\n"
            f"Ви приєдналися до команди \"{company_name}\".\n\n"
            f"Перейдіть в адмін-панель для налаштувань:\n"
            f"{admin_url}",
            reply_markup=main_menu_keyboard(),
        )
    else:
        # New user with own company
        await callback.message.answer(
            f"Реєстрація успішна!\n\n"
            f"Вітаємо, {user.first_name}! Ваш акаунт та компанію створено.\n\n"
            f"Перейдіть в адмін-панель:\n"
            f"{admin_url}\n\n"
            f"Там ви зможете:\n"
            f"- Додати послуги та ціни\n"
            f"- Налаштувати розклад роботи\n"
            f"- Отримувати записи від клієнтів",
            reply_markup=main_menu_keyboard(),
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
