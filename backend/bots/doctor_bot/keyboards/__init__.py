from aiogram.types import (
    ReplyKeyboardMarkup,
    KeyboardButton,
    InlineKeyboardMarkup,
    InlineKeyboardButton,
)


def main_menu_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="📅 Записи на сьогодні")],
            [KeyboardButton(text="📋 Всі записи")],
            [KeyboardButton(text="⚙️ Налаштування")],
        ],
        resize_keyboard=True,
    )


def appointment_action_keyboard(appointment_id: int) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="✅ Підтвердити",
                    callback_data=f"confirm_{appointment_id}"
                ),
                InlineKeyboardButton(
                    text="❌ Скасувати",
                    callback_data=f"cancel_{appointment_id}"
                ),
            ],
            [
                InlineKeyboardButton(
                    text="✔️ Завершено",
                    callback_data=f"complete_{appointment_id}"
                ),
            ],
        ]
    )


def link_account_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(
                text="🔗 Прив'язати акаунт",
                callback_data="link_account"
            )],
        ]
    )
