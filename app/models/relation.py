from __future__ import annotations

import enum  # Import the enum module
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import (  # Import Enum from SQLAlchemy
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


# Define Relation Type Enum
class RelationTypeEnum(enum.Enum):
    PARENT = "PARENT"
    CHILD = "CHILD"
    SPOUSE = "SPOUSE"
    SIBLING = "SIBLING"
    # Add other types as needed


class Relation(Base):
    __tablename__ = "relations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    # Foreign key linking to the 'source' member of the relationship
    from_member_id: Mapped[str] = mapped_column(
        String(100), ForeignKey("family_members.id"), nullable=False, index=True
    )
    # Foreign key linking to the 'target' member of the relationship
    to_member_id: Mapped[str] = mapped_column(
        String(100), ForeignKey("family_members.id"), nullable=False, index=True
    )
    # Use SQLAlchemyEnum, referencing the Python Enum. Store values as strings in DB.
    relation_type: Mapped[RelationTypeEnum] = mapped_column(
        SQLAlchemyEnum(RelationTypeEnum, name="relation_type_enum"),
        nullable=False,
        index=True,
    )
    start_date: Mapped[date | None] = mapped_column(
        Date, nullable=True
    )  # e.g., marriage date
    end_date: Mapped[date | None] = mapped_column(
        Date, nullable=True
    )  # e.g., divorce date
    # Use Python's datetime.utcnow for default/onupdate with SQLite
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Define relationships to the FamilyMember model using back_populates
    # Ensure FamilyMember model also defines the corresponding relationship with back_populates
    from_member: Mapped[FamilyMember] = relationship(
        "FamilyMember",
        foreign_keys=[from_member_id],
        back_populates="relationships_from",  # Matches the name in FamilyMember
    )
    to_member: Mapped[FamilyMember] = relationship(
        "FamilyMember",
        foreign_keys=[to_member_id],
        back_populates="relationships_to",  # Matches the name in FamilyMember
    )

    # Ensure a unique combination of from, to, and type to avoid duplicate relationships
    __table_args__ = (
        UniqueConstraint(
            "from_member_id", "to_member_id", "relation_type", name="_from_to_type_uc"
        ),
    )

    def __repr__(self):
        # Use relationship properties if loaded, otherwise IDs
        from_name = self.from_member.name if self.from_member else self.from_member_id
        to_name = self.to_member.name if self.to_member else self.to_member_id
        return f"<Relation {from_name} -> {to_name} ({self.relation_type})>"

    # Add validation if needed (Pydantic models preferred in FastAPI)
    # def validate_relation_type(self):
    #     allowed_types = ['parent', 'child', 'spouse', 'sibling'] # Example types
    #     if self.relation_type not in allowed_types:
    #         raise ValueError(f"Invalid relation type: {self.relation_type}")
