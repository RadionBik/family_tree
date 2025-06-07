import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.subscription import (
    SubscriptionCreate,
    SubscriptionRead,
    SubscriptionResponse,
)
from app.services import subscription_service
from app.services.subscription_service import (
    EmailAlreadyExistsError,
)
from app.utils.database import get_db_session
from app.utils.localization import get_text

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "/subscribe",
    response_model=SubscriptionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Subscribe Email for Notifications",
    description="Subscribes an email address to receive birthday notifications.",
    tags=["Subscriptions"],
)
async def subscribe_email(
    subscription_in: SubscriptionCreate,
    db: AsyncSession = Depends(get_db_session),
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
        logger.exception(
            f"An unexpected error occurred during subscription for {subscription_in.email}.",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=get_text("error_occurred"),
        )
