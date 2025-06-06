import asyncio
import csv
import io
import logging
import os

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.admin_user import AdminUser
from app.models.family_member import GenderEnum
from app.models.relation import RelationTypeEnum
from app.schemas.family import FamilyMemberCreate
from app.services.family_service import create_family_member, create_relationship
from app.utils.database import AsyncSessionFactory, async_engine

from .google_sheets_utils import get_family_data_from_sheet, parse_sheet_date

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("seed_db")


def safe_strip(value):
    """Safely strip a string, handling None values"""
    return value.strip() if value and isinstance(value, str) else ""


async def seed_database():
    """Seed database from Google Sheets"""
    logger.info("Starting database seeding from Google Sheets")

    try:
        # Get family data from Google Sheets
        csv_data = get_family_data_from_sheet()
        if not csv_data:
            logger.error("No data downloaded, exiting")
            return

        # Parse CSV
        logger.info("Parsing CSV data")
        reader = csv.DictReader(io.StringIO(csv_data))
        members_data = []
        relationships = []

        for row in reader:
            member = {
                "id": safe_strip(row.get("id", "")),
                "first_name": safe_strip(row.get("first_name", "")),
                "last_name": safe_strip(row.get("last_name", "")) or None,
                "birth_date": parse_sheet_date(safe_strip(row.get("birth_date", ""))),
                "death_date": parse_sheet_date(safe_strip(row.get("death_date", ""))),
                "gender": GenderEnum[safe_strip(row.get("gender", "")).upper()]
                if row.get("gender")
                else None,
                "location": safe_strip(row.get("location", "")) or None,
                "notes": safe_strip(row.get("notes", "")) or None,
            }
            members_data.append(member)

            # Collect relationship data
            relationships.append(
                {
                    "member_id": member["id"],
                    "mother_id": safe_strip(row.get("mother_id", "")) or None,
                    "father_id": safe_strip(row.get("father_id", "")) or None,
                    "spouse_id": safe_strip(row.get("spouse_id", "")) or None,
                }
            )

        async with AsyncSessionFactory() as db:
            try:
                # Purge existing family data
                logger.info("Purging existing family data")
                await db.execute(text("DELETE FROM relations"))
                await db.execute(text("DELETE FROM family_members"))
                await db.flush()

                logger.info(
                    f"Processing {len(members_data)} members from Google Sheet..."
                )
                members_cache = {}  # Cache member ID to DB ID mapping

                # Create family members
                for member_data in members_data:
                    member_id = member_data["id"]
                    try:
                        # Create FamilyMemberCreate object with correct field names
                        member_create = FamilyMemberCreate(
                            first_name=member_data["first_name"],
                            last_name=member_data["last_name"],
                            birth_date=member_data["birth_date"],
                            death_date=member_data["death_date"],
                            gender=member_data["gender"],
                            location=member_data["location"],
                            notes=member_data["notes"],
                        )

                        member = await create_family_member(
                            db, member_create, member_id=member_id
                        )
                        await db.flush()
                        members_cache[member_id] = member.id
                        logger.info(
                            f"Created member: {member_data['first_name']} (ID: {member_id})"
                        )
                    except Exception as e:
                        logger.error(
                            f"Failed to create member {member_data['first_name']}: {str(e)}"
                        )
                        continue

                logger.info("Creating relationships...")

                # Process relationships
                for rel_data in relationships:
                    member_id = rel_data["member_id"]
                    if member_id not in members_cache:
                        continue

                    # Create parent-child relationships
                    for parent_type, parent_id in [
                        ("mother", rel_data["mother_id"]),
                        ("father", rel_data["father_id"]),
                    ]:
                        if parent_id and parent_id in members_cache:
                            try:
                                await create_relationship(
                                    db,
                                    from_member_id=members_cache[parent_id],
                                    to_member_id=members_cache[member_id],
                                    relation_type=RelationTypeEnum.PARENT,
                                )
                                logger.info(
                                    f"Created parent relationship: {parent_id} -> {member_id}"
                                )
                            except Exception as e:
                                logger.error(
                                    f"Failed to create {parent_type} relationship: {str(e)}"
                                )

                    # Create spouse relationship
                    if rel_data["spouse_id"] and rel_data["spouse_id"] in members_cache:
                        try:
                            await create_relationship(
                                db,
                                from_member_id=members_cache[member_id],
                                to_member_id=members_cache[rel_data["spouse_id"]],
                                relation_type=RelationTypeEnum.SPOUSE,
                            )
                            logger.info(
                                f"Created spouse relationship: {member_id} -> {rel_data['spouse_id']}"
                            )
                        except Exception as e:
                            logger.error(
                                f"Failed to create spouse relationship: {str(e)}"
                            )

                await db.commit()
                logger.info("Database seeding completed successfully")

            except Exception as e:
                logger.exception(f"Seeding failed: {e}")
                await db.rollback()

    except Exception as e:
        logger.error(f"Error reading Google Sheet data: {e}")


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
