from aiogram import Router, F
from aiogram.filters import CommandStart, Command, CommandObject
from aiogram.types import Message, CallbackQuery
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRole
from app.models.company import Company
from app.models.profiles import SpecialistProfile
from bots.doctor_bot.keyboards import main_menu_keyboard, link_account_keyboard

router = Router()


class LinkStates(StatesGroup):
    waiting_for_email = State()


class TeamJoinStates(StatesGroup):
    confirming = State()


@router.message(CommandStart(deep_link=True))
async def cmd_start_with_link(message: Message, command: CommandObject, session: AsyncSession, state: FSMContext):
    """Handle /start with deep link parameters"""
    args = command.args

    # Handle team invite: /start team_{team_invite_code}
    if args and args.startswith("team_"):
        team_code = args[5:]  # Remove "team_" prefix
        await handle_team_invite(message, team_code, session, state)
        return

    # Default: redirect to regular start
    await cmd_start(message, session)


async def handle_team_invite(message: Message, team_code: str, session: AsyncSession, state: FSMContext):
    """Handle invitation to join a clinic team"""
    # Find company by team_invite_code
    result = await session.execute(
        select(Company).where(Company.team_invite_code == team_code)
    )
    company = result.scalar_one_or_none()

    if not company:
        await message.answer(
            "Невірне посилання для приєднання до команди.\n\n"
            "Зверніться до менеджера клініки за новим посиланням."
        )
        return

    # Check if user already has a linked account
    result = await session.execute(
        select(User).where(User.telegram_id == message.from_user.id)
    )
    user = result.scalar_one_or_none()

    if user:
        # Check if already in this company
        if user.company_id == company.id:
            await message.answer(
                f"Ви вже є в команді \"{company.name}\"! ✅\n\n"
                "Оберіть дію:",
                reply_markup=main_menu_keyboard(),
            )
            return

        # Check if already has a specialist profile in this company
        result = await session.execute(
            select(SpecialistProfile).where(
                SpecialistProfile.user_id == user.id,
                SpecialistProfile.company_id == company.id,
            )
        )
        existing_profile = result.scalar_one_or_none()

        if existing_profile:
            await message.answer(
                f"Ви вже є спеціалістом в \"{company.name}\"! ✅\n\n"
                "Оберіть дію:",
                reply_markup=main_menu_keyboard(),
            )
            return

        # Add user to company as specialist
        # Create specialist profile
        specialist_profile = SpecialistProfile(
            user_id=user.id,
            company_id=company.id,
            is_active=True,
        )
        session.add(specialist_profile)

        # If user doesn't have a company, set this as their primary
        if user.company_id is None:
            user.company_id = company.id

        await session.commit()

        await message.answer(
            f"Вітаємо! Ви приєдналися до команди \"{company.name}\" як спеціаліст! ✅\n\n"
            "Тепер ви можете:\n"
            "• Отримувати записи від клієнтів\n"
            "• Керувати своїм розкладом\n"
            "• Синхронізувати з Google Calendar\n\n"
            "Перейдіть в адмін-панель для налаштувань.",
            reply_markup=main_menu_keyboard(),
        )
    else:
        # New user - save company info and start registration
        await state.update_data(
            team_company_id=company.id,
            team_company_name=company.name,
        )
        await message.answer(
            f"Вітаємо! Вас запрошено приєднатися до команди \"{company.name}\".\n\n"
            "Для продовження потрібно зареєструватися.\n"
            "Оберіть дію:",
            reply_markup=link_account_keyboard(),
        )


@router.message(CommandStart())
async def cmd_start(message: Message, session: AsyncSession):
    """Handle /start without parameters"""
    # Check if user is linked
    result = await session.execute(
        select(User).where(User.telegram_id == message.from_user.id)
    )
    user = result.scalar_one_or_none()

    if user:
        await message.answer(
            f"Вітаємо, {user.first_name}! 👋\n\n"
            "Оберіть дію:",
            reply_markup=main_menu_keyboard(),
        )
    else:
        await message.answer(
            "Вітаємо! Цей бот призначений для лікарів та косметологів.\n\n"
            "Оберіть дію:\n"
            "• Прив'яжіть існуючий акаунт (якщо реєструвались на сайті)\n"
            "• Або зареєструйтесь через бота",
            reply_markup=link_account_keyboard(),
        )


@router.callback_query(F.data == "link_account")
async def link_account(callback: CallbackQuery, state: FSMContext):
    await state.set_state(LinkStates.waiting_for_email)
    await callback.message.answer(
        "Введіть email, який ви використовували при реєстрації в системі:"
    )
    await callback.answer()


@router.message(LinkStates.waiting_for_email)
async def process_email(message: Message, state: FSMContext, session: AsyncSession):
    email = message.text.strip().lower()

    # Find user by email
    result = await session.execute(
        select(User).where(User.email == email)
    )
    user = result.scalar_one_or_none()

    if not user:
        await message.answer(
            "Користувача з таким email не знайдено. Переконайтеся, що ви "
            "зареєстровані в системі та введіть правильний email.\n\n"
            "Або натисніть /start щоб зареєструватися через бота."
        )
        return

    # Link telegram account
    user.telegram_id = message.from_user.id
    user.telegram_username = message.from_user.username
    await session.commit()

    await state.clear()
    await message.answer(
        f"Акаунт успішно прив'язано! ✅\n\n"
        f"Вітаємо, {user.first_name}! Тепер ви будете отримувати сповіщення "
        "про нові записи та зможете керувати ними через цей бот.",
        reply_markup=main_menu_keyboard(),
    )
