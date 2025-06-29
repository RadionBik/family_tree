from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class SubscriptionCreate(BaseModel):
    """Schema for creating a new email subscription."""

    email: EmailStr


class SubscriptionRead(BaseModel):
    """Schema for reading subscription data (e.g., after creation)."""

    id: int
    email: EmailStr
    is_active: bool
    subscription_date: datetime

    model_config = ConfigDict(from_attributes=True)


class SubscriptionResponse(BaseModel):
    """Generic response schema for subscription actions."""

    message: str
    subscription: SubscriptionRead | None = None
