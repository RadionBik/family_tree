import logging
import os
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from config import config

logger = logging.getLogger(__name__)

app_config = config[os.getenv("APP_ENV", "development")]

DATABASE_URL = app_config.SQLALCHEMY_DATABASE_URI
if DATABASE_URL.startswith("sqlite:///"):
    DATABASE_URL = DATABASE_URL.replace("sqlite:///", "sqlite+aiosqlite:///", 1)

async_engine = create_async_engine(
    DATABASE_URL,
    echo=app_config.DEBUG,
    connect_args=(
        {"check_same_thread": False}
        if DATABASE_URL.startswith("sqlite+aiosqlite")
        else {}
    ),
)

AsyncSessionFactory = async_sessionmaker(
    bind=async_engine, expire_on_commit=False, class_=AsyncSession
)

Base = declarative_base()


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency: one session per request, rolled back on error."""
    async with AsyncSessionFactory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
