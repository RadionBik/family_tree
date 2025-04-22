import os
import sys
from logging.config import fileConfig

import asyncio # Import asyncio
from sqlalchemy import pool
from sqlalchemy import create_engine # Keep create_engine for potential offline use if needed
from sqlalchemy.ext.asyncio import AsyncEngine # Import AsyncEngine

from alembic import context

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Add project root to sys.path
# This allows Alembic to find your models
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Import your models' Base metadata object
# Make sure this path is correct for your project structure
from app.utils.database import Base # Import Base from your project
from app.models import family_member, relation # Import all models that define tables

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
         raise ValueError("DATABASE_URL environment variable not set or empty for offline mode.")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None: # Make the function async
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

    # Create engine directly using the URL from the environment variable
    # Create AsyncEngine directly using the URL from the environment variable
    connectable = AsyncEngine(create_engine(db_url, poolclass=pool.NullPool))

    # Use async context manager for connection
    async with connectable.connect() as connection:
        # Configure context with the connection
        await connection.run_sync(do_run_migrations)

async def do_run_migrations(connection):
    """Helper function to run migrations within the async context."""
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    # Run the async function using asyncio.run()
    asyncio.run(run_migrations_online())