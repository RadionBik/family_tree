from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import FamilyMember
from app.schemas.family import FamilyMemberRead


async def get_all_family_members(db: AsyncSession) -> list[FamilyMemberRead]:
    """All members with their relations, for the public tree."""
    stmt = (
        select(FamilyMember)
        .options(
            selectinload(FamilyMember.relationships_from),
            selectinload(FamilyMember.relationships_to),
        )
        .order_by(FamilyMember.id)
    )
    members = (await db.execute(stmt)).scalars().all()
    return [FamilyMemberRead.model_validate(m) for m in members]
