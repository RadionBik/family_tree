from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ChangeRead(BaseModel):
    id: int
    changed_at: datetime
    entity: str
    kind: str
    entity_id: str
    subject: str
    other_id: str | None = None
    other: str | None = None
    relation_type: str | None = None
    field: str | None = None
    old: str | None = None
    new: str | None = None
    author: str | None = None

    model_config = ConfigDict(from_attributes=True)
