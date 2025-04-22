from datetime import date, datetime
import enum # Import the enum module
from typing import List, Optional # For relationship type hints
from sqlalchemy import Integer, String, Date, DateTime, Text, func, Enum as SQLAlchemyEnum # Import Enum from SQLAlchemy
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.utils.database import Base

# Define Gender Enum
class GenderEnum(enum.Enum):
    MALE = "MALE"
    FEMALE = "FEMALE"
    OTHER = "OTHER"

class FamilyMember(Base):
    __tablename__ = 'family_members'

    # Columns using SQLAlchemy 2.0 type-annotated style
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    birth_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    death_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    # Use SQLAlchemyEnum, referencing the Python Enum. Store values as strings in DB.
    gender: Mapped[Optional[GenderEnum]] = mapped_column(SQLAlchemyEnum(GenderEnum, name="gender_enum"), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Use Python's datetime.utcnow for default/onupdate with SQLite
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships (will be defined properly when Relation model is updated)
    # Define relationships to the Relation model using back_populates
    # relationships_from: Represents relations where this member is the 'source' (from_member)
    relationships_from: Mapped[List["Relation"]] = relationship(
        "Relation",
        foreign_keys="Relation.from_member_id",
        back_populates="from_member",
        cascade="all, delete-orphan" # Optional: if deleting a member should delete their relations
    )
    # relationships_to: Represents relations where this member is the 'target' (to_member)
    relationships_to: Mapped[List["Relation"]] = relationship(
        "Relation",
        foreign_keys="Relation.to_member_id",
        back_populates="to_member",
        cascade="all, delete-orphan" # Optional: if deleting a member should delete their relations
    )

    def __repr__(self):
        return f'<FamilyMember {self.name} (ID: {self.id})>'

    # Add data validation methods if needed (using Pydantic models is often preferred in FastAPI)
    # def validate_gender(self):
    #     allowed_genders = ['Male', 'Female', 'Other', None]
    #     if self.gender not in allowed_genders:
    #         raise ValueError(f"Invalid gender: {self.gender}")