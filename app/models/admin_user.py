import logging
from datetime import datetime

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.utils.database import Base

ph = PasswordHasher()
logger = logging.getLogger(__name__)


class AdminUser(Base):
    __tablename__ = "admin_users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(
        String(80), unique=True, nullable=False, index=True
    )
    email: Mapped[str] = mapped_column(
        String(120), unique=True, nullable=False, index=True
    )
    hashed_password: Mapped[str] = mapped_column(String(256), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="admin", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    last_login: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    @property
    def password(self):
        raise AttributeError("password is not a readable attribute")

    @password.setter
    def password(self, password):
        try:
            self.hashed_password = ph.hash(password)
        except Exception as e:
            logger.error(
                f"Error hashing password for user {self.username}: {e}", exc_info=True
            )
            raise ValueError("Password hashing failed") from e

    def verify_password(self, password):
        try:
            ph.verify(self.hashed_password, password)
            if ph.check_needs_rehash(self.hashed_password):
                logger.info(
                    f"Rehashing password for user {self.username} due to parameter change."
                )
                pass
            return True
        except VerifyMismatchError:
            return False
        except Exception as e:
            logger.error(
                f"Error verifying password for user {self.username}: {e}", exc_info=True
            )
            return False

    def __repr__(self):
        return f"<AdminUser {self.username} ({self.role})>"
