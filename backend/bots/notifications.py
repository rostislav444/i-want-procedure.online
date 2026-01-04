"""
Notification utilities for sending messages via Telegram bots
"""
from aiogram import Bot
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode

from app.core.config import settings


async def notify_doctor_new_appointment(
    doctor_telegram_id: int,
    client_name: str,
    service_name: str,
    appointment_date: str,
    appointment_time: str,
):
    """Send notification to doctor about new appointment"""
    if not settings.DOCTOR_BOT_TOKEN or not doctor_telegram_id:
        return

    bot = Bot(
        token=settings.DOCTOR_BOT_TOKEN,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )

    try:
        message = (
            f"🆕 <b>Новий запис!</b>\n\n"
            f"👤 Клієнт: {client_name}\n"
            f"💆 Послуга: {service_name}\n"
            f"📅 Дата: {appointment_date}\n"
            f"🕐 Час: {appointment_time}\n\n"
            f"Перейдіть в адмін-панель для підтвердження."
        )
        await bot.send_message(doctor_telegram_id, message)
    except Exception as e:
        print(f"Failed to send notification to doctor: {e}")
    finally:
        await bot.session.close()


async def notify_client_appointment_confirmed(
    client_telegram_id: int,
    doctor_name: str,
    service_name: str,
    appointment_date: str,
    appointment_time: str,
    lang: str = "uk",
):
    """Send notification to client that appointment is confirmed"""
    if not settings.CLIENT_BOT_TOKEN or not client_telegram_id:
        return

    bot = Bot(
        token=settings.CLIENT_BOT_TOKEN,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )

    messages = {
        "uk": (
            f"✅ <b>Ваш запис підтверджено!</b>\n\n"
            f"👨‍⚕️ Спеціаліст: {doctor_name}\n"
            f"💆 Послуга: {service_name}\n"
            f"📅 Дата: {appointment_date}\n"
            f"🕐 Час: {appointment_time}\n\n"
            f"Чекаємо на вас!"
        ),
        "ru": (
            f"✅ <b>Ваша запись подтверждена!</b>\n\n"
            f"👨‍⚕️ Специалист: {doctor_name}\n"
            f"💆 Услуга: {service_name}\n"
            f"📅 Дата: {appointment_date}\n"
            f"🕐 Время: {appointment_time}\n\n"
            f"Ждём вас!"
        ),
        "en": (
            f"✅ <b>Your appointment is confirmed!</b>\n\n"
            f"👨‍⚕️ Specialist: {doctor_name}\n"
            f"💆 Service: {service_name}\n"
            f"📅 Date: {appointment_date}\n"
            f"🕐 Time: {appointment_time}\n\n"
            f"See you there!"
        ),
    }

    try:
        message = messages.get(lang, messages["uk"])
        await bot.send_message(client_telegram_id, message)
    except Exception as e:
        print(f"Failed to send notification to client: {e}")
    finally:
        await bot.session.close()


async def notify_client_appointment_cancelled(
    client_telegram_id: int,
    service_name: str,
    appointment_date: str,
    appointment_time: str,
    lang: str = "uk",
):
    """Send notification to client that appointment is cancelled"""
    if not settings.CLIENT_BOT_TOKEN or not client_telegram_id:
        return

    bot = Bot(
        token=settings.CLIENT_BOT_TOKEN,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )

    messages = {
        "uk": (
            f"❌ <b>Ваш запис скасовано</b>\n\n"
            f"💆 Послуга: {service_name}\n"
            f"📅 Дата: {appointment_date}\n"
            f"🕐 Час: {appointment_time}\n\n"
            f"Зв'яжіться зі спеціалістом для уточнення деталей."
        ),
        "ru": (
            f"❌ <b>Ваша запись отменена</b>\n\n"
            f"💆 Услуга: {service_name}\n"
            f"📅 Дата: {appointment_date}\n"
            f"🕐 Время: {appointment_time}\n\n"
            f"Свяжитесь со специалистом для уточнения деталей."
        ),
        "en": (
            f"❌ <b>Your appointment is cancelled</b>\n\n"
            f"💆 Service: {service_name}\n"
            f"📅 Date: {appointment_date}\n"
            f"🕐 Time: {appointment_time}\n\n"
            f"Please contact the specialist for more details."
        ),
    }

    try:
        message = messages.get(lang, messages["uk"])
        await bot.send_message(client_telegram_id, message)
    except Exception as e:
        print(f"Failed to send notification to client: {e}")
    finally:
        await bot.session.close()
