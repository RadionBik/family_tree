import os
import logging
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from config import config # Import the config dictionary

logger = logging.getLogger(__name__)

# Determine config environment
config_name = os.getenv('APP_ENV', 'default')
app_config = config[config_name]

# --- Database URL Configuration ---
DATABASE_URL = app_config.SQLALCHEMY_DATABASE_URI

# Adjust URL prefix for async driver if using SQLite
if DATABASE_URL.startswith('sqlite:///'):
    # Example: sqlite:///./app.db -> sqlite+aiosqlite:///./app.db
    DATABASE_URL = DATABASE_URL.replace('sqlite:///', 'sqlite+aiosqlite:///', 1)
    logger.info(f"Using async SQLite database: {DATABASE_URL}")
elif 'DATABASE_URL' in os.environ: # If overridden by environment variable
    # Assume the user provides the correct async prefix (e.g., postgresql+asyncpg://...)
    logger.info(f"Using database from DATABASE_URL environment variable: {DATABASE_URL}")
else:
    logger.warning("Database URL format might not be suitable for async. Ensure it has the correct async prefix (e.g., sqlite+aiosqlite, postgresql+asyncpg).")

# --- SQLAlchemy Async Engine and Session ---
try:
    # connect_args are specific to SQLite to improve concurrency
    connect_args = {"check_same_thread": False} if DATABASE_URL.startswith('sqlite+aiosqlite') else {}

    async_engine = create_async_engine(
        DATABASE_URL,
        echo=app_config.DEBUG, # Log SQL queries in debug mode
        future=True, # Use modern SQLAlchemy 2.0 features
        connect_args=connect_args
    )

    # Async session factory
    AsyncSessionFactory = async_sessionmaker(
        bind=async_engine,
        expire_on_commit=False, # Good practice for async sessions
        class_=AsyncSession
    )

    logger.info("SQLAlchemy async engine and session maker configured.")

except Exception as e:
    logger.exception(f"Failed to configure SQLAlchemy async engine: {e}")
    # Depending on the desired behavior, you might want to exit or raise the exception
    async_engine = None
    AsyncSessionFactory = None

# --- Base Model Class ---
# All ORM models will inherit from this Base
Base = declarative_base()

# --- Database Initialization Function ---
async def init_models():
    """Create database tables based on models inheriting from Base."""
    if not async_engine:
        logger.error("Async engine not initialized. Cannot create tables.")
        return
    async with async_engine.begin() as conn:
        try:
            # Drop and recreate tables (useful for development, use migrations in prod)
            # await conn.run_sync(Base.metadata.drop_all)
            # logger.info("Existing tables dropped (if any).")
            await conn.run_sync(Base.metadata.create_all)
            logger.info("Database tables checked/created based on models.")
        except Exception as e:
            logger.exception(f"Error during table creation: {e}")

# --- Dependency for FastAPI Endpoints ---
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
            # Optional: commit here if you want auto-commit behavior,
            # but usually better to commit explicitly in service layer.
            # await session.commit()
        except Exception:
            logger.exception("Exception during database session, rolling back.")
            await session.rollback()
            raise
        finally:
            # The session is automatically closed by the context manager 'async with'
            pass

# --- Lifespan Events for FastAPI (Example) ---
# These would typically go in main.py or a dedicated lifespan module

# async def lifespan(app: FastAPI):
#     # Startup
#     logger.info("Application startup: Initializing database models...")
#     await init_models()
#     yield
#     # Shutdown
#     logger.info("Application shutdown: Disposing database engine...")
#     if async_engine:
#         await async_engine.dispose()
#     logger.info("Database engine disposed.")