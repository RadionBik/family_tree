"""Invite links: an admin creates one, a relative opens it and gets an editor login."""

import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    create_access_token,
    require_admin,
    set_token_cookie,
)
from app.models import Invite
from app.models.admin_user import AdminUser
from app.schemas.auth import Token
from app.schemas.invite import InviteAccept, InviteRead
from app.utils.database import get_db_session
from app.utils.localization import get_text

router = APIRouter()
INVITE_DAYS = 7


@router.post("/invites", response_model=InviteRead, status_code=status.HTTP_201_CREATED)
async def create_invite(
    db: AsyncSession = Depends(get_db_session),
    user: AdminUser = Depends(require_admin),
):
    invite = Invite(
        token=secrets.token_urlsafe(24),
        role="editor",
        created_by=user.username,
        created_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(days=INVITE_DAYS),
    )
    db.add(invite)
    await db.commit()
    return invite


async def _valid_invite(db: AsyncSession, token: str) -> Invite:
    invite = (
        await db.execute(select(Invite).where(Invite.token == token))
    ).scalar_one_or_none()
    if invite is None or invite.used_at or invite.expires_at < datetime.utcnow():
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, detail=get_text("invite_invalid")
        )
    return invite


@router.get("/invites/{token}", response_model=InviteRead)
async def check_invite(token: str, db: AsyncSession = Depends(get_db_session)):
    return await _valid_invite(db, token)


@router.post("/invites/{token}/accept", response_model=Token)
async def accept_invite(
    token: str,
    data: InviteAccept,
    response: Response,
    db: AsyncSession = Depends(get_db_session),
):
    invite = await _valid_invite(db, token)
    taken = await db.execute(
        select(AdminUser).where(AdminUser.username == data.username)
    )
    if taken.scalar_one_or_none():
        raise HTTPException(status.HTTP_409_CONFLICT, detail=get_text("username_taken"))
    user = AdminUser(username=data.username, role=invite.role, is_active=True)
    user.password = data.password
    invite.used_at = datetime.utcnow()
    invite.used_by = data.username
    db.add(user)
    await db.commit()
    access_token = create_access_token(
        {"sub": user.username, "role": user.role},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    set_token_cookie(response, access_token)
    return {"access_token": access_token, "token_type": "bearer"}
