from aiogram.types import (
    ReplyKeyboardMarkup,
    KeyboardButton,
    InlineKeyboardMarkup,
    InlineKeyboardButton,
)
from bots.i18n import t


def language_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="🇺🇦 Українська", callback_data="lang_uk")],
            [InlineKeyboardButton(text="🇷🇺 Русский", callback_data="lang_ru")],
            [InlineKeyboardButton(text="🇬🇧 English", callback_data="lang_en")],
        ]
    )


def main_menu_keyboard(lang: str = "uk") -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text=t("book_appointment", lang))],
            [KeyboardButton(text=t("my_appointments", lang))],
            [KeyboardButton(text=t("change_language", lang))],
        ],
        resize_keyboard=True,
    )


def contact_keyboard(lang: str = "uk") -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text=t("share_contact", lang), request_contact=True)],
            [KeyboardButton(text=t("skip", lang))],
        ],
        resize_keyboard=True,
        one_time_keyboard=True,
    )


def cancel_keyboard(lang: str = "uk") -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text=t("cancel", lang))],
        ],
        resize_keyboard=True,
    )


def services_keyboard(services: list, lang: str = "uk") -> InlineKeyboardMarkup:
    buttons = [
        [InlineKeyboardButton(
            text=f"{s['name']} - {s['price']} грн ({s['duration_minutes']} хв)",
            callback_data=f"service_{s['id']}"
        )]
        for s in services
    ]
    buttons.append([InlineKeyboardButton(text=t("cancel", lang), callback_data="cancel")])
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def dates_keyboard(dates: list, lang: str = "uk") -> InlineKeyboardMarkup:
    buttons = []
    row = []
    for date in dates:
        row.append(InlineKeyboardButton(text=date, callback_data=f"date_{date}"))
        if len(row) == 3:
            buttons.append(row)
            row = []
    if row:
        buttons.append(row)
    buttons.append([InlineKeyboardButton(text=t("back", lang), callback_data="back_to_services")])
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def times_keyboard(slots: list, lang: str = "uk") -> InlineKeyboardMarkup:
    buttons = []
    row = []
    for slot in slots:
        time_str = slot["start_time"][:5]
        row.append(InlineKeyboardButton(text=time_str, callback_data=f"time_{time_str}"))
        if len(row) == 4:
            buttons.append(row)
            row = []
    if row:
        buttons.append(row)
    buttons.append([InlineKeyboardButton(text=t("back", lang), callback_data="back_to_dates")])
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def confirm_keyboard(lang: str = "uk") -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text=t("confirm", lang), callback_data="confirm_booking"),
                InlineKeyboardButton(text=t("cancel", lang), callback_data="cancel"),
            ]
        ]
    )
