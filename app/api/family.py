from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_active_user
from app.models.admin_user import AdminUser
from app.schemas.family import FamilyMemberRead
from app.services import family_service
from app.utils.database import get_db_session

router = APIRouter()


@router.get(
    "/family/tree",
    response_model=list[FamilyMemberRead],
    summary="Get Complete Family Tree",
    description="All family members with their relations.",
)
async def get_family_tree(
    db: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(get_current_active_user),
):
    return await family_service.get_all_family_members(db)
