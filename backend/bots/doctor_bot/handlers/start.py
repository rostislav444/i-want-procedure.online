from aiogram import Router, F
from aiogram.filters import CommandStart, Command
from aiogram.types import Message, CallbackQuery
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from bots.doctor_bot.keyboards import main_menu_keyboard, link_account_keyboard

router = Router()


class LinkStates(StatesGroup):
    waiting_for_email = State()


@router.message(CommandStart())
async def cmd_start(message: Message, session: AsyncSession):
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
