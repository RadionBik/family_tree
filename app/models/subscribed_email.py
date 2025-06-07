from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.utils.database import Base


class SubscribedEmail(Base):
    __tablename__ = "subscribed_emails"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(
        String(120), unique=True, nullable=False, index=True
    )
    subscription_date: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_updated: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    def __repr__(self):
        status = "Active" if self.is_active else "Inactive"
        return f"<SubscribedEmail {self.email} ({status})>"
