import asyncio
import json
import logging
import os
from datetime import date
from typing import Any

# Ensure the project root is in PYTHONPATH when running this script
# Example: PYTHONPATH=$PYTHONPATH:/path/to/family_tree python scripts/seed_db.py
# Import async components and models
from sqlalchemy import select, text  # Import text and select
from sqlalchemy.ext.asyncio import AsyncSession  # Import AsyncSession

from app.models.admin_user import AdminUser  # Import AdminUser model
from app.models.family_member import FamilyMember, GenderEnum
from app.models.relation import Relation, RelationTypeEnum
from app.utils.database import AsyncSessionFactory, async_engine  # Use factory now

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Configuration ---
JSON_INPUT_PATH = os.path.join(
    os.path.dirname(__file__), "..", "data/family_tree.json"
)  # Path relative to script
# --- End Configuration ---


# Helper to parse ISO date string or return None
def parse_iso_date(date_str: str | None) -> date | None:
    if not date_str:
        return None
    try:
        return date.fromisoformat(date_str)
    except (ValueError, TypeError):
        logger.warning(f"Could not parse date string: {date_str}")
        return None


async def seed_database():
    logger.info(f"Starting database seeding from JSON: {JSON_INPUT_PATH}")

    try:
        with open(JSON_INPUT_PATH, encoding="utf-8") as f:
            members_data = json.load(f)
    except FileNotFoundError:
        logger.error(f"Error: JSON file not found at {JSON_INPUT_PATH}")
        return
    except json.JSONDecodeError:
        logger.error(f"Error: Could not decode JSON from {JSON_INPUT_PATH}")
        return
    except Exception as e:
        logger.error(f"Error reading JSON file: {e}")
        return

    if not members_data:
        logger.warning("JSON data is empty. No seeding performed.")
        return

    # Use the session factory for the seeding operation
    async with AsyncSessionFactory() as db:
        try:
            members_cache: dict[
                int, FamilyMember
            ] = {}  # Cache DB objects by JSON ID {json_id: db_member}
            relations_to_add: list[dict[str, Any]] = []  # Store relations to add later

            logger.info(f"Processing {len(members_data)} members from JSON...")

            # First pass: Create FamilyMember objects
            for member_json in members_data:
                json_id = member_json.get("id")
                name = member_json.get("name")
                if not json_id or not name:
                    logger.warning(
                        f"Skipping member due to missing id or name: {member_json}"
                    )
                    continue

                gender_enum = None
                if member_json.get("gender"):
                    try:
                        gender_enum = GenderEnum[member_json["gender"]]
                    except KeyError:
                        logger.warning(
                            f"Invalid gender value '{member_json['gender']}' for member {name}. Setting to None."
                        )

                member_db = FamilyMember(
                    name=name,
                    birth_date=parse_iso_date(member_json.get("birth_date")),
                    death_date=parse_iso_date(
                        member_json.get("death_date")
                    ),  # Assuming death_date might exist
                    gender=gender_enum,
                    notes=member_json.get("notes"),
                    location=member_json.get("location"),
                    # created_at/updated_at are handled by SQLAlchemy defaults
                )
                db.add(member_db)
                await db.flush()  # Flush to get the actual DB ID assigned
                members_cache[json_id] = member_db  # Store with JSON ID as key
                logger.info(
                    f"  Created DB Member: {member_db.name} (JSON ID: {json_id}, DB ID: {member_db.id})"
                )

                # Store relationships for the second pass
                for rel in member_json.get("relationships", []):
                    relations_to_add.append(
                        {
                            "from_json_id": json_id,
                            "to_json_id": rel.get("target_id"),
                            "type_str": rel.get("type"),
                        }
                    )

            logger.info("Finished creating members. Processing relationships...")

            # Second pass: Create Relation objects
            relation_cache_db = (
                set()
            )  # Avoid duplicate DB relations {(from_db_id, to_db_id, type_enum)}
            for rel_info in relations_to_add:
                from_json_id = rel_info.get("from_json_id")
                to_json_id = rel_info.get("to_json_id")
                type_str = rel_info.get("type_str")

                if not from_json_id or not to_json_id or not type_str:
                    logger.warning(f"Skipping relation due to missing info: {rel_info}")
                    continue

                from_member_db = members_cache.get(from_json_id)
                to_member_db = members_cache.get(to_json_id)

                if not from_member_db or not to_member_db:
                    logger.warning(
                        f"Skipping relation due to missing member object for JSON IDs {from_json_id} -> {to_json_id}"
                    )
                    continue

                try:
                    relation_type_enum = RelationTypeEnum[type_str]
                except KeyError:
                    logger.warning(
                        f"Invalid relation type '{type_str}' for {from_member_db.name} -> {to_member_db.name}. Skipping."
                    )
                    continue

                # Check for duplicates before adding
                # Unused variable rel_key removed.
                # Handle potential self-referencing or specific logic if needed
                # Ensure from/to are distinct if relation type requires it

                # Use actual DB IDs for the cache key
                db_rel_key = (from_member_db.id, to_member_db.id, relation_type_enum)
                if db_rel_key in relation_cache_db:
                    # logger.info(f"Skipping duplicate relation: {from_member_db.name} -> {to_member_db.name} ({relation_type_enum.name})")
                    continue

                relation_db = Relation(
                    from_member_id=from_member_db.id,
                    to_member_id=to_member_db.id,
                    relation_type=relation_type_enum,
                    # Add start_date/end_date if they were included in JSON
                )
                db.add(relation_db)
                relation_cache_db.add(db_rel_key)
                logger.info(
                    f"    Added DB Relation: {from_member_db.name} -> {to_member_db.name} ({relation_type_enum.name})"
                )

            logger.info("Committing all changes...")
            await db.commit()
            logger.info("Database seeding from JSON completed successfully.")

        except Exception as e:
            logger.exception(f"An error occurred during seeding: {e}")
            await db.rollback()
        finally:
            logger.info("DB Session closed.")


async def seed_admin_user(db: AsyncSession):
    """Seeds an initial admin user if one doesn't exist."""
    admin_username = os.getenv("INITIAL_ADMIN_USERNAME", "admin")
    admin_email = os.getenv("INITIAL_ADMIN_EMAIL", "admin@example.com")
    admin_password = os.getenv(
        "INITIAL_ADMIN_PASSWORD", "password"
    )  # Use a strong default or require env var

    if not admin_password:
        logger.error(
            "INITIAL_ADMIN_PASSWORD environment variable not set. Cannot seed admin user."
        )
        return

    logger.info(
        f"Checking for existing admin user '{admin_username}' or email '{admin_email}'..."
    )

    # Check if admin user already exists
    stmt = select(AdminUser).where(
        (AdminUser.username == admin_username) | (AdminUser.email == admin_email)
    )
    result = await db.execute(stmt)
    existing_admin = result.scalar_one_or_none()

    if existing_admin:
        logger.info(
            f"Admin user '{existing_admin.username}' already exists. Skipping admin seeding."
        )
        return

    logger.info(f"Creating initial admin user: {admin_username} ({admin_email})")
    try:
        new_admin = AdminUser(
            username=admin_username,
            email=admin_email,
            # The password setter in the model handles hashing
            password=admin_password,
            role="admin",  # Default role
            is_active=True,
        )
        db.add(new_admin)
        await (
            db.commit()
        )  # Commit admin user separately or within the main seeding transaction
        await db.refresh(new_admin)
        logger.info(f"Successfully created initial admin user with ID: {new_admin.id}")
    except Exception as e:
        logger.exception(f"Failed to create initial admin user: {e}")
        await db.rollback()


async def clear_data(db: AsyncSession):
    """Optional: Clears existing data."""
    logger.warning("Clearing existing FamilyMember, Relation, and AdminUser data...")
    # Order matters due to foreign keys
    await db.execute(text(f"DELETE FROM {Relation.__tablename__}"))
    await db.execute(text(f"DELETE FROM {FamilyMember.__tablename__}"))
    await db.execute(
        text(f"DELETE FROM {AdminUser.__tablename__}")
    )  # Clear admin users too
    # Reset sequence for SQLite primary keys if needed (specific to DB)
    # Removed deletion from sqlite_sequence as it might not exist and isn't strictly necessary for clearing data
    # if db.bind.dialect.name == 'sqlite':
    #      await db.execute(text("DELETE FROM sqlite_sequence WHERE name='family_members' OR name='relations' OR name='admin_users';"))
    await db.commit()
    logger.info("Existing data cleared.")


async def main():
    # Optional: Clear data before seeding
    async with AsyncSessionFactory() as db_clear:
        await clear_data(db_clear)

    # Run the main seeding process for family data
    await seed_database()

    # Seed the initial admin user
    async with AsyncSessionFactory() as db_admin:
        await seed_admin_user(db_admin)


if __name__ == "__main__":
    # Ensure tables exist (Alembic should handle this ideally)
    # You might run alembic upgrade head separately before the seeder
    # Or add a check here if needed

    asyncio.run(main())
    # Dispose engine after script finishes
    asyncio.run(async_engine.dispose())
    logger.info("Engine disposed.")
