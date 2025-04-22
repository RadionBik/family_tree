import logging
from typing import List
from datetime import date, timedelta
from sqlalchemy import select, extract, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import FamilyMember
from app.schemas.birthday import UpcomingBirthdayRead

logger = logging.getLogger(__name__)

def calculate_next_birthday(birth_date: date, today: date) -> date:
    """Calculates the date of the next birthday."""
    try:
        # Try this year's birthday
        next_bday = birth_date.replace(year=today.year)
    except ValueError: # Handles leap year birthdays (Feb 29th) on non-leap years
        next_bday = birth_date.replace(year=today.year, day=28)

    if next_bday < today:
        # If birthday has already passed this year, calculate for next year
        try:
            next_bday = birth_date.replace(year=today.year + 1)
        except ValueError: # Handle leap year birthday for next year if it's a leap year
             next_bday = birth_date.replace(year=today.year + 1, day=28)
    return next_bday

def calculate_age(birth_date: date, on_date: date) -> int:
    """Calculates age on a specific date."""
    age = on_date.year - birth_date.year - ((on_date.month, on_date.day) < (birth_date.month, birth_date.day))
    return age

async def get_upcoming_birthdays(db: AsyncSession, days: int = 30) -> List[UpcomingBirthdayRead]:
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
        # Query members with birth dates
        stmt = select(FamilyMember).where(FamilyMember.birth_date.isnot(None))
        result = await db.execute(stmt)
        members = result.scalars().all()

        upcoming = []
        for member in members:
            if member.birth_date: # Ensure birth_date is not None
                next_birthday = calculate_next_birthday(member.birth_date, today)

                if today <= next_birthday <= end_date:
                    days_until = (next_birthday - today).days
                    upcoming_age = calculate_age(member.birth_date, next_birthday)

                    upcoming.append(UpcomingBirthdayRead(
                        member_id=member.id,
                        name=member.name,
                        birth_date=member.birth_date,
                        next_birthday_date=next_birthday,
                        days_until_birthday=days_until,
                        upcoming_age=upcoming_age
                    ))

        # Sort by the upcoming birthday date
        upcoming.sort(key=lambda x: x.next_birthday_date)

        logger.info(f"Found {len(upcoming)} upcoming birthdays.")
        return upcoming

    except Exception as e:
        logger.exception("Error fetching upcoming birthdays.", exc_info=True)
        raise e