from datetime import datetime
from typing import Optional
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import Integer, String, DateTime, Boolean, func
from sqlalchemy.orm import Mapped, mapped_column
from app.utils.database import Base

class AdminUser(Base):
    __tablename__ = 'admin_users'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(80), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(120), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(256), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default='admin', nullable=False) # e.g., 'admin', 'editor'
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.utcnow())
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    @property
    def password(self):
        raise AttributeError('password is not a readable attribute')

    @password.setter
    def password(self, password):
        """Hashes the password and stores the hash."""
        # Consider using a dedicated password hashing library like passlib for more options
        self.password_hash = generate_password_hash(password)

    def verify_password(self, password):
        """Verifies the provided password against the stored hash."""
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<AdminUser {self.username} ({self.role})>'

    # Email validation is typically handled at the API layer using Pydantic models in FastAPI