import logging
from datetime import datetime

from argon2 import PasswordHasher  # Import Argon2 PasswordHasher
from argon2.exceptions import VerifyMismatchError  # Import specific Argon2 exception
from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.utils.database import Base

# Instantiate Argon2 PasswordHasher with default settings
ph = PasswordHasher()
logger = logging.getLogger(__name__)  # Get logger instance


class AdminUser(Base):
    __tablename__ = "admin_users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(
        String(80), unique=True, nullable=False, index=True
    )
    email: Mapped[str] = mapped_column(
        String(120), unique=True, nullable=False, index=True
    )
    password_hash: Mapped[str] = mapped_column(String(256), nullable=False)
    role: Mapped[str] = mapped_column(
        String(50), default="admin", nullable=False
    )  # e.g., 'admin', 'editor'
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    # Use Python's datetime.utcnow for defaults/onupdate with SQLite
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )  # Added updated_at
    last_login: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    @property
    def password(self):
        raise AttributeError("password is not a readable attribute")

    @password.setter
    def password(self, password):
        """Hashes the password using Argon2 and stores the hash."""
        try:
            self.password_hash = ph.hash(password)
        except Exception as e:
            # Log potential errors during hashing
            logger.error(
                f"Error hashing password for user {self.username}: {e}", exc_info=True
            )
            # Re-raise or handle as appropriate for your application's error strategy
            raise ValueError("Password hashing failed") from e

    def verify_password(self, password):
        """Verifies the provided password against the stored Argon2 hash."""
        try:
            # ph.verify returns True if valid, raises VerifyMismatchError if not
            ph.verify(self.password_hash, password)
            # Check if the hash needs to be updated (e.g., due to changed Argon2 parameters)
            if ph.check_needs_rehash(self.password_hash):
                logger.info(
                    f"Rehashing password for user {self.username} due to parameter change."
                )
                # Update the hash in the database (important for security updates)
                # This requires the instance to be associated with a session
                # and needs careful handling within the request/service layer.
                # For simplicity here, we just log it. A real app might trigger an update.
                # self.password = password # This would re-trigger the setter
                pass  # Placeholder for rehash logic if needed later
            return True
        except VerifyMismatchError:
            # Password does not match
            return False
        except Exception as e:
            # Log other potential errors during verification
            logger.error(
                f"Error verifying password for user {self.username}: {e}", exc_info=True
            )
            return False

    def __repr__(self):
        return f"<AdminUser {self.username} ({self.role})>"

    # Email validation is typically handled at the API layer using Pydantic models in FastAPI
