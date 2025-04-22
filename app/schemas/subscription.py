from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime
from typing import Optional

class SubscriptionCreate(BaseModel):
    """Schema for creating a new email subscription."""
    email: EmailStr # Use EmailStr for automatic email format validation

class SubscriptionRead(BaseModel):
    """Schema for reading subscription data (e.g., after creation)."""
    id: int
    email: EmailStr
    is_active: bool
    subscription_date: datetime

    model_config = ConfigDict(from_attributes=True) # Enable ORM mode

class SubscriptionResponse(BaseModel):
    """Generic response schema for subscription actions."""
    message: str
    subscription: Optional[SubscriptionRead] = None # Optionally include details