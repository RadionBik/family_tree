import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.family import FamilyMemberRead # Response schema
from app.services import family_service # Service function
from app.utils.database import get_db_session # DB session dependency
from app.utils.localization import get_text # Localization

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get(
    "/family/tree", # Corrected path to match frontend service call
    response_model=List[FamilyMemberRead], # Specify the response schema (a list of members)
    summary="Get Complete Family Tree",
    description="Retrieves all family members and their relationships.",
    tags=["Family"] # Tag for API documentation grouping
)
async def get_family_tree(
    db: AsyncSession = Depends(get_db_session) # Inject async DB session
):
    """
    API endpoint to retrieve the entire family tree data.
    """
    logger.info("Received request for /family/tree endpoint.") # Corrected log message path
    try:
        logger.info("Attempting to call family_service.get_all_family_members...")
        family_members_orm = await family_service.get_all_family_members(db)
        logger.info(f"Successfully retrieved {len(family_members_orm)} members from service.")
        # FastAPI automatically converts the list of ORM objects to a list of FamilyMemberRead Pydantic models
        logger.info("Returning family members data.")
        return family_members_orm
    except Exception as e:
        # Log the specific error details
        logger.error(f"Error type: {type(e).__name__}, Error details: {e}", exc_info=True)
        logger.exception("An unexpected error occurred while fetching the family tree.") # Keep original exception log too
        # Raise a standard HTTPException which will be caught by our handler in main.py
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=get_text("error_occurred") # Use localized error message
        )

# Add other family-related endpoints here later (e.g., get member by ID, add member, etc.)