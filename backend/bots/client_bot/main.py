import asyncio
import logging

from aiogram import Bot, Dispatcher
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode

from app.core.config import settings
from app.core.database import async_session_maker
from bots.client_bot.handlers import start, registration, booking, services

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DatabaseMiddleware:
    async def __call__(self, handler, event, data):
        async with async_session_maker() as session:
            data["session"] = session
            return await handler(event, data)


async def main():
    if not settings.CLIENT_BOT_TOKEN:
        logger.error("CLIENT_BOT_TOKEN is not set")
        return

    bot = Bot(
        token=settings.CLIENT_BOT_TOKEN,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )

    storage = MemoryStorage()
    dp = Dispatcher(storage=storage)

    # Add database middleware
    dp.message.middleware(DatabaseMiddleware())
    dp.callback_query.middleware(DatabaseMiddleware())

    # Include routers
    dp.include_router(start.router)
    dp.include_router(registration.router)
    dp.include_router(booking.router)
    dp.include_router(services.router)

    logger.info("Starting client bot...")

    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
