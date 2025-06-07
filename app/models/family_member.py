from __future__ import annotations

import enum
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
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


class GenderEnum(enum.Enum):
    MALE = "MALE"
    FEMALE = "FEMALE"
    OTHER = "OTHER"


class FamilyMember(Base):
    __tablename__ = "family_members"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    last_name: Mapped[str | None] = mapped_column(
        String(100), nullable=True, index=True
    )
    birth_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    death_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    gender: Mapped[GenderEnum | None] = mapped_column(
        SQLAlchemyEnum(GenderEnum, name="gender_enum"), nullable=True
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    location: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    relationships_from: Mapped[list[Relation]] = relationship(
        "Relation",
        foreign_keys="Relation.from_member_id",
        back_populates="from_member",
        cascade="all, delete-orphan",
    )
    relationships_to: Mapped[list[Relation]] = relationship(
        "Relation",
        foreign_keys="Relation.to_member_id",
        back_populates="to_member",
        cascade="all, delete-orphan",
    )

    @property
    def name(self) -> str:
        """Returns the full name of the family member."""
        if self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.first_name

    def __repr__(self):
        return f"<FamilyMember {self.first_name} {self.last_name} (ID: {self.id})>"
