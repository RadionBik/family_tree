from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class InviteRead(BaseModel):
    token: str
    role: str
    expires_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InviteAccept(BaseModel):
    username: str = Field(min_length=2, max_length=80, pattern=r"^[\w.\-]+$")
    password: str = Field(min_length=8, max_length=200)
