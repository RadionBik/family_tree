import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.subscription import (  # Schemas
    SubscriptionCreate,
    SubscriptionRead,
    SubscriptionResponse,
)
from app.services import subscription_service  # Service function
from app.services.subscription_service import (
    EmailAlreadyExistsError,  # Custom exception
)
from app.utils.database import get_db_session  # DB session dependency
from app.utils.localization import get_text  # Localization

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "/subscribe",
    response_model=SubscriptionResponse,  # Use the generic response schema
    status_code=status.HTTP_201_CREATED,  # Set default success status code
    summary="Subscribe Email for Notifications",
    description="Subscribes an email address to receive birthday notifications.",
    tags=["Subscriptions"],  # Tag for API documentation grouping
)
async def subscribe_email(
    subscription_in: SubscriptionCreate,  # Request body uses SubscriptionCreate schema
    db: AsyncSession = Depends(get_db_session),  # Inject async DB session
):
    """
    API endpoint to subscribe an email address.
    Handles creation and potential conflicts (already subscribed).
    """
    logger.info(
        f"Received request for /subscribe endpoint with email: {subscription_in.email}"
    )
    try:
        new_subscription_orm = await subscription_service.add_subscription(
            db, subscription_in
        )
        # Convert ORM object to Pydantic read model for the response
        subscription_read = SubscriptionRead.model_validate(new_subscription_orm)
        logger.info(f"Successfully processed subscription for {subscription_in.email}")
        return SubscriptionResponse(
            message=get_text("subscription_successful"), subscription=subscription_read
        )
    except EmailAlreadyExistsError:
        logger.warning(
            f"Attempt to subscribe already existing email: {subscription_in.email}"
        )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=get_text("email_already_subscribed"),
        )
    except Exception:
        # Catch other potential errors from the service layer
        logger.exception(
            f"An unexpected error occurred during subscription for {subscription_in.email}.",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=get_text("error_occurred"),
        )


# Add other subscription-related endpoints here later (e.g., unsubscribe, get status)
