from __future__ import annotations

import enum
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.utils.database import Base

if TYPE_CHECKING:
    from app.models.family_member import FamilyMember


class RelationTypeEnum(enum.Enum):
    PARENT = "PARENT"
    CHILD = "CHILD"
    SPOUSE = "SPOUSE"
    SIBLING = "SIBLING"


class Relation(Base):
    __tablename__ = "relations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    from_member_id: Mapped[str] = mapped_column(
        String(100), ForeignKey("family_members.id"), nullable=False, index=True
    )
    to_member_id: Mapped[str] = mapped_column(
        String(100), ForeignKey("family_members.id"), nullable=False, index=True
    )
    relation_type: Mapped[RelationTypeEnum] = mapped_column(
        SQLAlchemyEnum(RelationTypeEnum, name="relation_type_enum"),
        nullable=False,
        index=True,
    )
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    from_member: Mapped[FamilyMember] = relationship(
        "FamilyMember",
        foreign_keys=[from_member_id],
        back_populates="relationships_from",
    )
    to_member: Mapped[FamilyMember] = relationship(
        "FamilyMember",
        foreign_keys=[to_member_id],
        back_populates="relationships_to",
    )

    __table_args__ = (
        UniqueConstraint(
            "from_member_id", "to_member_id", "relation_type", name="_from_to_type_uc"
        ),
    )

    def __repr__(self):
        from_name = self.from_member.name if self.from_member else self.from_member_id
        to_name = self.to_member.name if self.to_member else self.to_member_id
        return f"<Relation {from_name} -> {to_name} ({self.relation_type})>"
