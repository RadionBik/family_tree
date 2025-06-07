import csv
import io
import logging

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.family_member import GenderEnum
from app.models.relation import RelationTypeEnum
from app.schemas.family import FamilyMemberCreate
from app.services.family_service import create_family_member, create_relationship
from scripts.google_sheets_utils import get_family_data_from_sheet, parse_sheet_date

logger = logging.getLogger(__name__)


def safe_strip(value):
    """Safely strip a string, handling None values"""
    return value.strip() if value and isinstance(value, str) else ""


async def process_family_data(db: AsyncSession):
    """
    Fetches family data from Google Sheets, purges existing data,
    and populates the database with new data.
    """
    logger.info("Starting family data processing from Google Sheets")

    csv_data = get_family_data_from_sheet()
    if not csv_data:
        logger.error("No data downloaded, exiting")
        return

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

        relationships.append(
            {
                "member_id": member["id"],
                "mother_id": safe_strip(row.get("mother_id", "")) or None,
                "father_id": safe_strip(row.get("father_id", "")) or None,
                "spouse_id": safe_strip(row.get("spouse_id", "")) or None,
            }
        )

    try:
        logger.info("Purging existing family data")
        await db.execute(text("DELETE FROM relations"))
        await db.execute(text("DELETE FROM family_members"))
        await db.flush()

        logger.info(f"Processing {len(members_data)} members from Google Sheet...")
        members_cache = {}

        for member_data in members_data:
            member_id = member_data["id"]
            try:
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

        for rel_data in relationships:
            member_id = rel_data["member_id"]
            if member_id not in members_cache:
                continue

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
                    logger.error(f"Failed to create spouse relationship: {str(e)}")

        await db.commit()
        logger.info("Database processing completed successfully")

    except Exception as e:
        logger.exception(f"Data processing failed: {e}")
        await db.rollback()
        raise
