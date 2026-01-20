from typing import Optional
from aiogram.types import (
    ReplyKeyboardMarkup,
    KeyboardButton,
    InlineKeyboardMarkup,
    InlineKeyboardButton,
    ReplyKeyboardRemove,
)


def main_menu_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="📅 Записи на сьогодні")],
            [KeyboardButton(text="📋 Всі записи")],
            [KeyboardButton(text="💳 Надіслати реквізити")],
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
            [InlineKeyboardButton(
                text="📝 Зареєструватися",
                callback_data="register_new"
            )],
        ]
    )


def skip_keyboard(prefill_value: Optional[str] = None) -> ReplyKeyboardMarkup:
    """Keyboard with skip button, optionally with prefilled value"""
    buttons = []
    if prefill_value:
        buttons.append([KeyboardButton(text=f"Далі ({prefill_value})")])
    buttons.append([KeyboardButton(text="Пропустити")])
    return ReplyKeyboardMarkup(
        keyboard=buttons,
        resize_keyboard=True,
        one_time_keyboard=True,
    )


def contact_keyboard() -> ReplyKeyboardMarkup:
    """Keyboard for phone number sharing"""
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="📱 Поділитися номером", request_contact=True)],
            [KeyboardButton(text="Пропустити")],
        ],
        resize_keyboard=True,
        one_time_keyboard=True,
    )


def confirm_registration_keyboard() -> InlineKeyboardMarkup:
    """Confirmation keyboard for registration"""
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="✅ Підтвердити", callback_data="confirm_registration"),
                InlineKeyboardButton(text="❌ Скасувати", callback_data="cancel_registration"),
            ],
        ]
    )


def company_type_keyboard() -> InlineKeyboardMarkup:
    """Keyboard for selecting company type"""
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(
                text="👤 Індивідуальний спеціаліст (ФОП)",
                callback_data="company_type_solo"
            )],
            [InlineKeyboardButton(
                text="🏥 Клініка / Салон",
                callback_data="company_type_clinic"
            )],
        ]
    )


def remove_keyboard() -> ReplyKeyboardRemove:
    """Remove reply keyboard"""
    return ReplyKeyboardRemove()


def clients_list_keyboard(clients: list) -> InlineKeyboardMarkup:
    """Keyboard with list of recent clients to send payment requisites"""
    buttons = []
    for client in clients:
        name = f"{client.first_name} {client.last_name or ''}".strip()
        buttons.append([InlineKeyboardButton(
            text=f"👤 {name}",
            callback_data=f"send_payment_{client.id}"
        )])
    buttons.append([InlineKeyboardButton(text="❌ Скасувати", callback_data="cancel_payment")])
    return InlineKeyboardMarkup(inline_keyboard=buttons)
