import logging

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import SubscribedEmail
from app.schemas.subscription import SubscriptionCreate

logger = logging.getLogger(__name__)


class SubscriptionError(Exception):
    """Custom exception for subscription errors."""

    pass


class EmailAlreadyExistsError(SubscriptionError):
    """Exception raised when an email is already subscribed."""

    pass


async def add_subscription(
    db: AsyncSession, subscription_data: SubscriptionCreate
) -> SubscribedEmail:
    """
    Adds a new email subscription to the database.

    Args:
        db: The asynchronous database session.
        subscription_data: Pydantic schema containing the email to subscribe.

    Returns:
        The newly created SubscribedEmail ORM instance.

    Raises:
        EmailAlreadyExistsError: If the email is already subscribed (and active).
        SubscriptionError: For other database errors during creation.
    """
    email_lower = subscription_data.email.lower()
    logger.info(f"Attempting to add subscription for email: {email_lower}")

    stmt_check = select(SubscribedEmail).where(
        (SubscribedEmail.email == email_lower) & SubscribedEmail.is_active
    )
    result_check = await db.execute(stmt_check)
    existing_subscription = result_check.scalar_one_or_none()

    if existing_subscription:
        logger.warning(f"Email {email_lower} is already actively subscribed.")
        raise EmailAlreadyExistsError(f"Email {email_lower} is already subscribed.")

    stmt_inactive_check = select(SubscribedEmail).where(
        (SubscribedEmail.email == email_lower) & (not SubscribedEmail.is_active)
    )
    result_inactive_check = await db.execute(stmt_inactive_check)
    inactive_subscription = result_inactive_check.scalar_one_or_none()

    if inactive_subscription:
        logger.info(f"Reactivating existing inactive subscription for {email_lower}.")
        inactive_subscription.is_active = True
        inactive_subscription.last_updated = func.utcnow()
        try:
            await db.commit()
            await db.refresh(inactive_subscription)
            logger.info(f"Successfully reactivated subscription for {email_lower}.")
            return inactive_subscription
        except Exception as e:
            await db.rollback()
            logger.exception(
                f"Database error reactivating subscription for {email_lower}.",
                exc_info=True,
            )
            raise SubscriptionError(
                f"Failed to reactivate subscription for {email_lower}."
            ) from e

    logger.info(f"Creating new subscription entry for {email_lower}.")
    new_subscription = SubscribedEmail(
        email=email_lower,
        is_active=True,
    )
    db.add(new_subscription)

    try:
        await db.commit()
        await db.refresh(new_subscription)
        logger.info(
            f"Successfully added new subscription for {email_lower} with ID {new_subscription.id}."
        )
        return new_subscription
    except IntegrityError as e:
        await db.rollback()
        logger.warning(
            f"Integrity error (likely duplicate email race condition) for {email_lower}: {e}"
        )
        result_check_again = await db.execute(stmt_check)
        existing_now = result_check_again.scalar_one_or_none()
        if existing_now:
            raise EmailAlreadyExistsError(
                f"Email {email_lower} was already subscribed (race condition)."
            )
        else:
            raise SubscriptionError(
                f"Integrity error creating subscription for {email_lower}."
            ) from e
    except Exception as e:
        await db.rollback()
        logger.exception(
            f"Database error creating subscription for {email_lower}.", exc_info=True
        )
        raise SubscriptionError(
            f"Failed to create subscription for {email_lower}."
        ) from e
