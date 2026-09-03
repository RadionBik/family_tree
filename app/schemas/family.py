from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.models.family_member import GenderEnum


class RelationRead(BaseModel):
    id: int
    from_member_id: str
    to_member_id: str
    relation_type: str
    start_date: date | None = None
    end_date: date | None = None

    model_config = ConfigDict(from_attributes=True)


class FamilyMemberRead(BaseModel):
    id: str
    name: str
    first_name: str
    last_name: str | None = None
    birth_date: date | None = None
    death_date: date | None = None
    gender: GenderEnum | None = None
    location: str | None = None
    notes: str | None = None
    created_at: datetime
    updated_at: datetime
    relationships_from: list[RelationRead] = []
    relationships_to: list[RelationRead] = []

    model_config = ConfigDict(from_attributes=True)
