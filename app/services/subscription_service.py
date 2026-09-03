import logging

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import SubscribedEmail
from app.schemas.subscription import SubscriptionCreate

logger = logging.getLogger(__name__)


class SubscriptionError(Exception):
    pass


class EmailAlreadyExistsError(SubscriptionError):
    pass


async def add_subscription(
    db: AsyncSession, subscription_data: SubscriptionCreate
) -> SubscribedEmail:
    """Subscribe an email. Reactivates an inactive row, raises on an active one."""
    email = subscription_data.email.lower()

    existing = (
        await db.execute(select(SubscribedEmail).where(SubscribedEmail.email == email))
    ).scalar_one_or_none()

    if existing and existing.is_active:
        raise EmailAlreadyExistsError(email)

    if existing:
        existing.is_active = True
        subscription = existing
    else:
        subscription = SubscribedEmail(email=email, is_active=True)
        db.add(subscription)

    try:
        await db.commit()
    except IntegrityError as e:
        # Two requests raced on the unique index; the other one won.
        await db.rollback()
        raise EmailAlreadyExistsError(email) from e

    await db.refresh(subscription)
    logger.info(f"Subscribed {email}")
    return subscription
