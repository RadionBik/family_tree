import asyncio
import csv
import io
import logging

from app.models.family_member import GenderEnum
from app.models.relation import RelationTypeEnum
from app.services.family_service import create_family_member, create_relationship
from app.utils.database import AsyncSessionFactory

from .google_sheets_utils import get_family_data_from_sheet, parse_sheet_date

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("ingest_family_data")


async def ingest_family_data():
    """Main function to ingest family data from Google Sheets"""
    logger.info("Starting family data ingestion")

    try:
        # Step 1: Get family data from Google Sheets
        logger.info("Downloading sheet data from Google Sheets")
        csv_data = get_family_data_from_sheet()
        if not csv_data:
            logger.error("No data downloaded, exiting")
            return

        # Step 2: Parse CSV
        logger.info("Parsing CSV data")
        reader = csv.DictReader(io.StringIO(csv_data))
        family_members = []
        relationships = []

        for row in reader:
            # Extract family member data
            member = {
                "id": row.get("id", "").strip(),
                "first_name": row.get("first_name", "").strip(),
                "last_name": row.get("last_name", "").strip() or None,
                "birth_date": parse_sheet_date(row.get("birth_date", "").strip()),
                "death_date": parse_sheet_date(row.get("death_date", "").strip()),
                "gender": GenderEnum[row["gender"].strip().upper()]
                if row.get("gender")
                else None,
                "location": row.get("location", "").strip() or None,
                "notes": row.get("notes", "").strip() or None,
            }
            family_members.append(member)

            # Collect relationship data
            relationships.append(
                {
                    "member_id": member["id"],
                    "mother_id": row.get("mother_id", "").strip() or None,
                    "father_id": row.get("father_id", "").strip() or None,
                    "spouse_id": row.get("spouse_id", "").strip() or None,
                }
            )

        # Step 3: Database operations
        async with AsyncSessionFactory() as session:
            # Purge existing data
            logger.info("Purging existing family data")
            await session.execute("DELETE FROM relations")
            await session.execute("DELETE FROM family_members")
            await session.commit()

            # Create family members
            logger.info(f"Creating {len(family_members)} family members")
            for member_data in family_members:
                await create_family_member(session, member_data)

            # Create relationships
            logger.info("Creating relationships")
            for rel_data in relationships:
                member_id = rel_data["member_id"]

                # Create parent-child relationships
                for parent_type, parent_id in [
                    ("mother", rel_data["mother_id"]),
                    ("father", rel_data["father_id"]),
                ]:
                    if parent_id:
                        try:
                            await create_relationship(
                                session,
                                from_member_id=parent_id,
                                to_member_id=member_id,
                                relation_type=RelationTypeEnum.PARENT,
                            )
                        except Exception as e:
                            logger.warning(
                                f"Failed to create {parent_type} relationship: {str(e)}"
                            )

                # Create spouse relationship
                if rel_data["spouse_id"]:
                    try:
                        await create_relationship(
                            session,
                            from_member_id=member_id,
                            to_member_id=rel_data["spouse_id"],
                            relation_type=RelationTypeEnum.SPOUSE,
                        )
                    except Exception as e:
                        logger.warning(
                            f"Failed to create spouse relationship: {str(e)}"
                        )

            await session.commit()

        logger.info("Family data ingestion completed successfully")

    except Exception as e:
        logger.error(f"Family data ingestion failed: {str(e)}")
        raise


if __name__ == "__main__":
    asyncio.run(ingest_family_data())
