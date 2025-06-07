import asyncio
import logging
import os

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.admin_user import AdminUser
from app.utils.database import AsyncSessionFactory, async_engine
from scripts.data_utils import process_family_data

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("seed_db")


async def seed_database():
    """Seed database from Google Sheets"""
    logger.info("Starting database seeding from Google Sheets")
    try:
        async with AsyncSessionFactory() as db:
            await process_family_data(db)
    except Exception as e:
        logger.error(f"Error during database seeding: {e}", exc_info=True)


async def seed_user(
    db: AsyncSession, username: str, email: str, password: str, role: str
):
    """Seeds a user if one doesn't exist with the same username or email"""
    if not password:
        logger.error(
            f"{role.capitalize()} password environment variable not set. Cannot seed {role} user."
        )
        return

    logger.info(f"Checking for existing {role} user '{username}' or email '{email}'...")

    # Check if user already exists - using only existing columns
    stmt = select(AdminUser).where(
        (AdminUser.username == username) | (AdminUser.email == email)
    )
    result = await db.execute(stmt)
    existing_user = result.scalar_one_or_none()

    if existing_user:
        logger.info(
            f"{role.capitalize()} user '{existing_user.username}' already exists. Skipping seeding."
        )
        return

    logger.info(f"Creating {role} user: {username} ({email})")
    try:
        new_user = AdminUser(
            username=username,
            email=email,
            password=password,  # Password setter handles hashing
            role=role,
            is_active=True,
        )
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        logger.info(f"Successfully created {role} user with ID: {new_user.id}")
    except Exception as e:
        logger.exception(f"Failed to create {role} user: {e}")
        await db.rollback()


async def seed_admin_user(db: AsyncSession):
    """Seeds an initial admin user if one doesn't exist."""
    admin_username = os.getenv("INITIAL_ADMIN_USERNAME", "admin")
    admin_email = os.getenv("INITIAL_ADMIN_EMAIL", "admin@example.com")
    admin_password = os.getenv("INITIAL_ADMIN_PASSWORD")
    await seed_user(db, admin_username, admin_email, admin_password, "admin")


async def seed_viewer_user(db: AsyncSession):
    """Seeds a shared 'viewer' user if one doesn't exist."""
    viewer_username = "privet"
    viewer_password = os.getenv("VIEWER_USER_PASSWORD")
    viewer_email = "viewer@example.com"
    await seed_user(db, viewer_username, viewer_email, viewer_password, "viewer")


async def main():
    # Run the main seeding process for family data
    await seed_database()

    # Seed the initial admin user
    async with AsyncSessionFactory() as db_admin:
        await seed_admin_user(db_admin)

    # Seed the shared viewer user
    async with AsyncSessionFactory() as db_viewer:
        await seed_viewer_user(db_viewer)


if __name__ == "__main__":
    asyncio.run(main())
    # Dispose engine after script finishes
    asyncio.run(async_engine.dispose())
    logger.info("Engine disposed.")
