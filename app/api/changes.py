from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_active_user
from app.models import Change
from app.models.admin_user import AdminUser
from app.schemas.change import ChangeRead
from app.utils.database import get_db_session

router = APIRouter()


@router.get(
    "/changes",
    response_model=list[ChangeRead],
    summary="Recent data changes",
    description="What the sheet ingest changed, newest first.",
)
async def list_changes(
    limit: int = Query(300, ge=1, le=2000),
    db: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(get_current_active_user),
):
    stmt = (
        select(Change).order_by(Change.changed_at.desc(), Change.id.desc()).limit(limit)
    )
    return (await db.execute(stmt)).scalars().all()
