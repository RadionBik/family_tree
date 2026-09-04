from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_active_user, require_admin
from app.models.admin_user import AdminUser
from app.schemas.family import (
    FamilyMemberRead,
    MemberCreate,
    MemberUpdate,
    RelationCreate,
    RelationRead,
)
from app.services import edit_service, family_service
from app.utils.database import get_db_session

router = APIRouter()


@router.get(
    "/family/tree",
    response_model=list[FamilyMemberRead],
    summary="All members with relations",
)
async def get_family_tree(
    db: AsyncSession = Depends(get_db_session),
    _: AdminUser = Depends(get_current_active_user),
):
    return await family_service.get_all_family_members(db)


@router.post(
    "/family/members",
    response_model=FamilyMemberRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_member(
    data: MemberCreate,
    db: AsyncSession = Depends(get_db_session),
    user: AdminUser = Depends(require_admin),
):
    return await edit_service.create_member(db, data, author=user.username)


@router.patch("/family/members/{member_id}", response_model=FamilyMemberRead)
async def update_member(
    member_id: str,
    patch: MemberUpdate,
    db: AsyncSession = Depends(get_db_session),
    user: AdminUser = Depends(require_admin),
):
    return await edit_service.update_member(db, member_id, patch, author=user.username)


@router.delete("/family/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_member(
    member_id: str,
    db: AsyncSession = Depends(get_db_session),
    user: AdminUser = Depends(require_admin),
):
    await edit_service.delete_member(db, member_id, author=user.username)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/family/relations",
    response_model=RelationRead,
    status_code=status.HTTP_201_CREATED,
)
async def add_relation(
    data: RelationCreate,
    db: AsyncSession = Depends(get_db_session),
    user: AdminUser = Depends(require_admin),
):
    return await edit_service.add_relation(db, data, author=user.username)


@router.delete(
    "/family/relations/{relation_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def remove_relation(
    relation_id: int,
    db: AsyncSession = Depends(get_db_session),
    user: AdminUser = Depends(require_admin),
):
    await edit_service.remove_relation(db, relation_id, author=user.username)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
