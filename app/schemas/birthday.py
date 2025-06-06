from datetime import date

from pydantic import BaseModel, ConfigDict


class UpcomingBirthdayRead(BaseModel):
    """Schema for representing an upcoming birthday."""

    member_id: str
    name: str
    birth_date: date
    next_birthday_date: date  # The actual date of the upcoming birthday
    days_until_birthday: int  # Days remaining until the next birthday
    upcoming_age: int  # The age the person will turn on their next birthday

    model_config = ConfigDict(
        from_attributes=True
    )  # Enable ORM mode if needed later, though this is usually constructed


class BirthdayNotificationInfo(BaseModel):
    """Schema for data needed for a birthday notification."""

    name: str
    age: int
    subscriber_emails: list[str]

    model_config = ConfigDict(from_attributes=True)
