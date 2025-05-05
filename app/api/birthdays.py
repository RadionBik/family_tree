import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.birthday import UpcomingBirthdayRead  # Response schema
from app.services import birthday_service  # Service function
from app.utils.database import get_db_session  # DB session dependency
from app.utils.localization import get_text  # Localization

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get(
    "/upcoming-birthdays",
    response_model=list[UpcomingBirthdayRead],
    summary="Get Upcoming Birthdays",
    description="Retrieves family members with birthdays in the specified upcoming period.",
    tags=["Birthdays"],  # Tag for API documentation grouping
)
async def get_upcoming_birthdays_endpoint(
    days: int = Query(
        30,
        ge=1,
        le=365,
        description="Number of days ahead to check for birthdays (1-365).",
    ),
    db: AsyncSession = Depends(get_db_session),  # Inject async DB session
):
    """
    API endpoint to retrieve upcoming birthdays.
    """
    logger.info(f"Received request for /upcoming-birthdays endpoint with days={days}.")
    try:
        upcoming_birthdays = await birthday_service.get_upcoming_birthdays(db, days)
        logger.info(
            f"Successfully retrieved {len(upcoming_birthdays)} upcoming birthdays from service."
        )
        if not upcoming_birthdays:
            # Optionally return a specific message or just an empty list
            # return JSONResponse(status_code=status.HTTP_200_OK, content={"message": get_text("no_upcoming_birthdays")})
            pass  # Return empty list by default
        return upcoming_birthdays
    except Exception:
        logger.exception(
            "An unexpected error occurred while fetching upcoming birthdays.",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=get_text("error_occurred"),
        )


# Add other birthday-related endpoints here later if needed
