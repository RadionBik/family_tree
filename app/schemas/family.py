from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.models.family_member import GenderEnum
from app.models.relation import RelationTypeEnum


class RelationRead(BaseModel):
    id: int
    from_member_id: str
    to_member_id: str
    relation_type: str
    start_date: date | None = None
    end_date: date | None = None

    model_config = ConfigDict(from_attributes=True)


class RelationCreate(BaseModel):
    from_member_id: str
    to_member_id: str
    relation_type: RelationTypeEnum
    start_date: date | None = None
    end_date: date | None = None


class MemberFields(BaseModel):
    """Everything editable about a person; all optional."""

    last_name: str | None = None
    middle_name: str | None = None
    maiden_name: str | None = None
    birth_date: date | None = None
    death_date: date | None = None
    gender: GenderEnum | None = None
    location: str | None = None
    birth_place: str | None = None
    profession: str | None = None
    notes: str | None = None
    photo_url: str | None = None
    phone: str | None = None
    telegram: str | None = None
    vk: str | None = None
    instagram: str | None = None


class MemberCreate(MemberFields):
    first_name: str


class MemberUpdate(MemberFields):
    first_name: str | None = None


class FamilyMemberRead(MemberFields):
    id: str
    name: str
    first_name: str
    created_at: datetime
    updated_at: datetime
    relationships_from: list[RelationRead] = []
    relationships_to: list[RelationRead] = []

    model_config = ConfigDict(from_attributes=True)
