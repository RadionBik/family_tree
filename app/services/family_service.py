import logging
from typing import List
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import FamilyMember # Import the ORM model
from app.schemas.family import FamilyMemberRead # Import the Pydantic schema for response

logger = logging.getLogger(__name__)

async def get_all_family_members(db: AsyncSession) -> List[FamilyMemberRead]:
    """
    Fetches all family members from the database with their relationships preloaded.

    Args:
        db: The asynchronous database session.

    Returns:
        A list of FamilyMember objects (ORM instances) ready for serialization.
        We return ORM instances here, and the API layer handles serialization to Pydantic models.
    """
    logger.info("Fetching all family members from database.")
    try:
        # Create a query to select FamilyMember objects
        # Use selectinload to eagerly load relationships to avoid N+1 query problems
        stmt = (
            select(FamilyMember)
            .options(
                selectinload(FamilyMember.relationships_from).selectinload(FamilyMember.from_member), # Load relation and the 'from' member
                selectinload(FamilyMember.relationships_from).selectinload(FamilyMember.to_member),   # Load relation and the 'to' member
                selectinload(FamilyMember.relationships_to).selectinload(FamilyMember.from_member), # Load relation and the 'from' member
                selectinload(FamilyMember.relationships_to).selectinload(FamilyMember.to_member)    # Load relation and the 'to' member
            )
            .order_by(FamilyMember.id) # Optional: order by ID or name
        )

        # Execute the query asynchronously
        result = await db.execute(stmt)

        # Get unique ORM objects from the result
        family_members = result.unique().scalars().all()

        logger.info(f"Successfully fetched {len(family_members)} family members.")
        # The API layer will convert these ORM objects to Pydantic models (FamilyMemberRead)
        return list(family_members)

    except Exception as e:
        logger.exception("Error fetching family members from database.", exc_info=True)
        # Re-raise the exception to be handled by the global exception handler in main.py
        raise e