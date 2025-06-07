import logging
import os

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from config import config

logger = logging.getLogger(__name__)

config_name = os.getenv("APP_ENV", "development")
app_config = config[config_name]

DATABASE_URL = app_config.SQLALCHEMY_DATABASE_URI

if DATABASE_URL.startswith("sqlite:///"):
    DATABASE_URL = DATABASE_URL.replace("sqlite:///", "sqlite+aiosqlite:///", 1)
    logger.info(f"Using async SQLite database: {DATABASE_URL}")
elif "DATABASE_URL" in os.environ:
    logger.info(
        f"Using database from DATABASE_URL environment variable: {DATABASE_URL}"
    )
else:
    logger.warning(
        "Database URL format might not be suitable for async. Ensure it has the correct async prefix (e.g., sqlite+aiosqlite, postgresql+asyncpg)."
    )

try:
    connect_args = (
        {"check_same_thread": False}
        if DATABASE_URL.startswith("sqlite+aiosqlite")
        else {}
    )

    async_engine = create_async_engine(
        DATABASE_URL,
        echo=app_config.DEBUG,
        future=True,
        connect_args=connect_args,
    )

    AsyncSessionFactory = async_sessionmaker(
        bind=async_engine,
        expire_on_commit=False,
        class_=AsyncSession,
    )

    logger.info("SQLAlchemy async engine and session maker configured.")

except Exception as e:
    logger.exception(f"Failed to configure SQLAlchemy async engine: {e}")
    async_engine = None
    AsyncSessionFactory = None

Base = declarative_base()


async def init_models():
    """Create database tables based on models inheriting from Base."""
    if not async_engine:
        logger.error("Async engine not initialized. Cannot create tables.")
        return
    async with async_engine.begin():
        try:
            logger.info(
                "Database tables are expected to be managed by Alembic migrations."
            )
        except Exception as e:
            logger.exception(f"Error during table creation: {e}")


async def get_db_session() -> AsyncSession:
    """
    FastAPI dependency that provides a database session.
    Ensures the session is closed after the request.
    """
    if not AsyncSessionFactory:
        logger.error("Async session factory not initialized.")
        raise RuntimeError("Database session factory is not available.")

    async with AsyncSessionFactory() as session:
        try:
            yield session
        except Exception:
            logger.exception("Exception during database session, rolling back.")
            await session.rollback()
            raise
        finally:
            pass
