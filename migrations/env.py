import asyncio  # Import asyncio
import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy import (
    pool,
)

from app.utils.database import Base  # Import Base from your project

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Import your models' Base metadata object
# Make sure this path is correct for your project structure
# Ensure the project root is in PYTHONPATH when running alembic
# Base is imported above

# target_metadata is the SQLAlchemy metadata object containing table definitions
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    # Ensure offline mode also uses the environment variable URL if needed
    url = os.getenv("DATABASE_URL")
    if not url:
        raise ValueError(
            "DATABASE_URL environment variable not set or empty for offline mode."
        )
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:  # Make the function async
    """Run migrations in 'online' mode.

    In this scenario we need to create an AsyncEngine
    and associate a connection with the context.

    """
    # Get the database URL directly from the environment variable
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise ValueError("DATABASE_URL environment variable not set or empty.")

    # Use the environment variable URL for offline mode as well, just in case
    # (Though offline usually reads from ini)
    config.set_main_option("sqlalchemy.url", db_url)

    # Create AsyncEngine directly using the URL from the environment variable
    from sqlalchemy.ext.asyncio import (
        create_async_engine,  # Ensure create_async_engine is imported if not already
    )

    connectable = create_async_engine(db_url, poolclass=pool.NullPool)

    # Define a synchronous function to run the migrations
    def run_migrations_fn(connection):
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()

    # Use async context manager for connection and run the sync function
    async with connectable.connect() as connection:
        await connection.run_sync(run_migrations_fn)

    # Dispose the engine after use
    await connectable.dispose()


# Remove the unused async do_run_migrations helper
# async def do_run_migrations(connection):
#     """Helper function to run migrations within the async context."""
#     context.configure(connection=connection, target_metadata=target_metadata)
#     with context.begin_transaction():
#         context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    # Run the async function using asyncio.run()
    asyncio.run(run_migrations_online())
