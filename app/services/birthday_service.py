import logging
from datetime import date, timedelta

from sqlalchemy import extract, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import FamilyMember, SubscribedEmail
from app.schemas.birthday import BirthdayNotificationInfo, UpcomingBirthdayRead

logger = logging.getLogger(__name__)


def calculate_next_birthday(birth_date: date, today: date) -> date:
    """Calculates the date of the next birthday."""
    try:
        # Try this year's birthday
        next_bday = birth_date.replace(year=today.year)
    except ValueError:  # Handles leap year birthdays (Feb 29th) on non-leap years
        next_bday = birth_date.replace(year=today.year, day=28)

    if next_bday < today:
        # If birthday has already passed this year, calculate for next year
        try:
            next_bday = birth_date.replace(year=today.year + 1)
        except (
            ValueError
        ):  # Handle leap year birthday for next year if it's a leap year
            next_bday = birth_date.replace(year=today.year + 1, day=28)
    return next_bday


def calculate_age(birth_date: date, on_date: date) -> int:
    """Calculates age on a specific date."""
    age = (
        on_date.year
        - birth_date.year
        - ((on_date.month, on_date.day) < (birth_date.month, birth_date.day))
    )
    return age


async def get_upcoming_birthdays(
    db: AsyncSession, days: int = 90
) -> list[UpcomingBirthdayRead]:
    """
    Fetches family members with birthdays in the upcoming specified number of days.

    Args:
        db: The asynchronous database session.
        days: The number of days ahead to check for birthdays (default: 30).

    Returns:
        A list of UpcomingBirthdayRead objects, sorted by the next birthday date.
    """
    logger.info(f"Fetching upcoming birthdays within the next {days} days.")
    today = date.today()
    end_date = today + timedelta(days=days)

    try:
        # Query living members with birth dates
        stmt = select(FamilyMember).where(
            FamilyMember.birth_date.isnot(None),
            FamilyMember.death_date.is_(None),  # Only include members who are alive
        )
        result = await db.execute(stmt)
        members = result.scalars().all()

        upcoming = []
        for member in members:
            if member.birth_date:  # Ensure birth_date is not None
                next_birthday = calculate_next_birthday(member.birth_date, today)

                if today <= next_birthday <= end_date:
                    days_until = (next_birthday - today).days
                    upcoming_age = calculate_age(member.birth_date, next_birthday)

                    upcoming.append(
                        UpcomingBirthdayRead(
                            member_id=member.id,
                            name=member.name,
                            birth_date=member.birth_date,
                            next_birthday_date=next_birthday,
                            days_until_birthday=days_until,
                            upcoming_age=upcoming_age,
                        )
                    )

        # Sort by the upcoming birthday date
        upcoming.sort(key=lambda x: x.next_birthday_date)

        logger.info(f"Found {len(upcoming)} upcoming birthdays.")
        return upcoming

    except Exception as e:
        logger.exception("Error fetching upcoming birthdays.", exc_info=True)
        raise e


async def get_todays_birthdays_for_notification(
    db: AsyncSession,
) -> list[BirthdayNotificationInfo]:
    """
    Fetches living family members whose birthday is today and the list of active subscribers.

    Args:
        db: The asynchronous database session.

    Returns:
        A list of BirthdayNotificationInfo objects for members celebrating a birthday today.
        Returns an empty list if no birthdays are found or no subscribers exist.
    """
    logger.info("Fetching today's birthdays for notification.")
    today = date.today()

    try:
        # 1. Get active subscriber emails
        sub_stmt = select(SubscribedEmail.email).where(SubscribedEmail.is_active)
        sub_result = await db.execute(sub_stmt)
        subscriber_emails = sub_result.scalars().all()

        if not subscriber_emails:
            logger.info("No active subscribers found. No notifications will be sent.")
            return []

        # 2. Get living members whose birthday is today
        bday_stmt = select(FamilyMember).where(
            FamilyMember.birth_date.isnot(None),
            FamilyMember.death_date.is_(None),  # Only living members
            extract("month", FamilyMember.birth_date) == today.month,
            extract("day", FamilyMember.birth_date) == today.day,
        )
        bday_result = await db.execute(bday_stmt)
        members_with_birthday_today = bday_result.scalars().all()

        if not members_with_birthday_today:
            logger.info("No birthdays found for today.")
            return []

        notifications = []
        for member in members_with_birthday_today:
            # Calculate age they are turning today
            age = calculate_age(member.birth_date, today)
            notifications.append(
                BirthdayNotificationInfo(
                    name=member.name,
                    age=age,
                    subscriber_emails=list(
                        subscriber_emails
                    ),  # Convert Sequence to list
                )
            )

        logger.info(
            f"Found {len(notifications)} birthday(s) today. Subscribers: {len(subscriber_emails)}."
        )
        return notifications

    except Exception as e:
        logger.exception(
            "Error fetching today's birthdays for notification.", exc_info=True
        )
        raise e
