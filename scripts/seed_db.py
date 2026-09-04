"""Create the two login accounts from env: `admin` (INITIAL_ADMIN_*) and the shared viewer `privet`."""

import asyncio
import logging
import os

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.admin_user import AdminUser
from app.utils.database import AsyncSessionFactory, async_engine

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s"
)
logger = logging.getLogger("seed_db")


async def seed_user(
    db: AsyncSession, username: str, email: str, password: str | None, role: str
):
    if not password:
        logger.error(f"No password in env for {role} user '{username}', skipping.")
        return
    stmt = select(AdminUser).where(
        (AdminUser.username == username) | (AdminUser.email == email)
    )
    if (await db.execute(stmt)).scalar_one_or_none():
        logger.info(f"{role} user '{username}' already exists.")
        return
    user = AdminUser(
        username=username, email=email, password=password, role=role, is_active=True
    )
    db.add(user)
    await db.commit()
    logger.info(f"Created {role} user '{username}'.")


async def main():
    async with AsyncSessionFactory() as db:
        await seed_user(
            db,
            os.getenv("INITIAL_ADMIN_USERNAME", "admin"),
            os.getenv("INITIAL_ADMIN_EMAIL", "admin@example.com"),
            os.getenv("INITIAL_ADMIN_PASSWORD"),
            "admin",
        )
        await seed_user(
            db,
            "privet",
            "viewer@example.com",
            os.getenv("VIEWER_USER_PASSWORD"),
            "viewer",
        )
    await async_engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
