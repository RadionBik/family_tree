from __future__ import annotations

import enum  # Import the enum module
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import (  # Import Enum from SQLAlchemy
    Date,
    DateTime,
    String,
    Text,
)
from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.utils.database import Base

if TYPE_CHECKING:
    from app.models.relation import Relation


# Define Gender Enum
class GenderEnum(enum.Enum):
    MALE = "MALE"
    FEMALE = "FEMALE"
    OTHER = "OTHER"


class FamilyMember(Base):
    __tablename__ = "family_members"

    # Columns using SQLAlchemy 2.0 type-annotated style
    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    last_name: Mapped[str | None] = mapped_column(
        String(100), nullable=True, index=True
    )
    birth_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    death_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    # Use SQLAlchemyEnum, referencing the Python Enum. Store values as strings in DB.
    gender: Mapped[GenderEnum | None] = mapped_column(
        SQLAlchemyEnum(GenderEnum, name="gender_enum"), nullable=True
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    location: Mapped[str | None] = mapped_column(
        String(100), nullable=True, index=True
    )  # Added location
    # Use Python's datetime.utcnow for default/onupdate with SQLite
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships (will be defined properly when Relation model is updated)
    # Define relationships to the Relation model using back_populates
    # relationships_from: Represents relations where this member is the 'source' (from_member)
    relationships_from: Mapped[list[Relation]] = relationship(
        "Relation",
        foreign_keys="Relation.from_member_id",
        back_populates="from_member",
        cascade="all, delete-orphan",  # Optional: if deleting a member should delete their relations
    )
    # relationships_to: Represents relations where this member is the 'target' (to_member)
    relationships_to: Mapped[list[Relation]] = relationship(
        "Relation",
        foreign_keys="Relation.to_member_id",
        back_populates="to_member",
        cascade="all, delete-orphan",  # Optional: if deleting a member should delete their relations
    )

    @property
    def name(self) -> str:
        """Returns the full name of the family member."""
        if self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.first_name

    def __repr__(self):
        return f"<FamilyMember {self.first_name} {self.last_name} (ID: {self.id})>"

    # Add data validation methods if needed (using Pydantic models is often preferred in FastAPI)
    # def validate_gender(self):
    #     allowed_genders = ['Male', 'Female', 'Other', None]
    #     if self.gender not in allowed_genders:
    #         raise ValueError(f"Invalid gender: {self.gender}")
