from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.utils.database import Base


class Change(Base):
    """One difference between two ingest runs of the sheet."""

    __tablename__ = "changes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    changed_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    entity: Mapped[str] = mapped_column(String(16))  # member | relation
    kind: Mapped[str] = mapped_column(String(16))  # added | removed | changed
    entity_id: Mapped[str] = mapped_column(String(100))  # member id
    subject: Mapped[str] = mapped_column(String(200))  # person name
    other_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    other: Mapped[str | None] = mapped_column(String(200), nullable=True)
    relation_type: Mapped[str | None] = mapped_column(String(16), nullable=True)
    field: Mapped[str | None] = mapped_column(String(40), nullable=True)
    old: Mapped[str | None] = mapped_column(Text, nullable=True)
    new: Mapped[str | None] = mapped_column(Text, nullable=True)
    author: Mapped[str | None] = mapped_column(String(80), nullable=True)
