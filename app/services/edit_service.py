"""The write path. Every change to people or relations goes through here and
leaves a row in `changes`."""

import enum
import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Change, FamilyMember, Relation
from app.models.relation import RelationTypeEnum
from app.schemas.family import MemberCreate, MemberUpdate, RelationCreate


class NotFoundError(Exception):
    pass


class ConflictError(Exception):
    pass


def _text(value) -> str | None:
    if value is None:
        return None
    if isinstance(value, enum.Enum):
        return value.value
    return str(value)


def _log(db: AsyncSession, **fields) -> None:
    db.add(Change(changed_at=datetime.utcnow(), **fields))


async def get_member(db: AsyncSession, member_id: str) -> FamilyMember:
    stmt = (
        select(FamilyMember)
        .where(FamilyMember.id == member_id)
        .options(
            selectinload(FamilyMember.relationships_from),
            selectinload(FamilyMember.relationships_to),
        )
    )
    member = (await db.execute(stmt)).scalar_one_or_none()
    if member is None:
        raise NotFoundError(member_id)
    return member


async def create_member(
    db: AsyncSession, data: MemberCreate, author: str
) -> FamilyMember:
    member = FamilyMember(id=uuid.uuid4().hex[:12], **data.model_dump())
    db.add(member)
    await db.flush()
    _log(
        db,
        entity="member",
        kind="added",
        entity_id=member.id,
        subject=member.name,
        author=author,
    )
    await db.commit()
    return await get_member(db, member.id)


async def update_member(
    db: AsyncSession, member_id: str, patch: MemberUpdate, author: str
) -> FamilyMember:
    member = await get_member(db, member_id)
    name = member.name
    for field, value in patch.model_dump(exclude_unset=True).items():
        old = getattr(member, field)
        if _text(old) == _text(value):
            continue
        _log(
            db,
            entity="member",
            kind="changed",
            entity_id=member.id,
            subject=name,
            field=field,
            old=_text(old),
            new=_text(value),
            author=author,
        )
        setattr(member, field, value)
    await db.commit()
    return await get_member(db, member_id)


async def _names(db: AsyncSession, ids: set[str]) -> dict[str, str]:
    if not ids:
        return {}
    rows = (
        await db.execute(select(FamilyMember).where(FamilyMember.id.in_(ids)))
    ).scalars()
    return {m.id: m.name for m in rows}


async def delete_member(db: AsyncSession, member_id: str, author: str) -> None:
    member = await get_member(db, member_id)
    rels = [*member.relationships_from, *member.relationships_to]
    names = await _names(
        db, {r.from_member_id for r in rels} | {r.to_member_id for r in rels}
    )
    for r in rels:
        _log(
            db,
            entity="relation",
            kind="removed",
            entity_id=r.from_member_id,
            subject=names.get(r.from_member_id, r.from_member_id),
            other_id=r.to_member_id,
            other=names.get(r.to_member_id, r.to_member_id),
            relation_type=r.relation_type.value,
            author=author,
        )
    _log(
        db,
        entity="member",
        kind="removed",
        entity_id=member.id,
        subject=member.name,
        author=author,
    )
    await db.delete(member)
    await db.commit()


async def add_relation(db: AsyncSession, data: RelationCreate, author: str) -> Relation:
    if data.from_member_id == data.to_member_id:
        raise ConflictError("self")
    a = await db.get(FamilyMember, data.from_member_id)
    b = await db.get(FamilyMember, data.to_member_id)
    if a is None or b is None:
        raise NotFoundError(data.from_member_id if a is None else data.to_member_id)
    # One row per couple regardless of who was entered first.
    if data.relation_type is RelationTypeEnum.SPOUSE and a.id > b.id:
        a, b = b, a
    rel = Relation(
        from_member_id=a.id,
        to_member_id=b.id,
        relation_type=data.relation_type,
        start_date=data.start_date,
        end_date=data.end_date,
    )
    db.add(rel)
    try:
        await db.flush()
    except IntegrityError as e:
        await db.rollback()
        raise ConflictError("exists") from e
    _log(
        db,
        entity="relation",
        kind="added",
        entity_id=a.id,
        subject=a.name,
        other_id=b.id,
        other=b.name,
        relation_type=data.relation_type.value,
        author=author,
    )
    await db.commit()
    return rel


async def remove_relation(db: AsyncSession, relation_id: int, author: str) -> None:
    rel = await db.get(Relation, relation_id)
    if rel is None:
        raise NotFoundError(str(relation_id))
    names = await _names(db, {rel.from_member_id, rel.to_member_id})
    _log(
        db,
        entity="relation",
        kind="removed",
        entity_id=rel.from_member_id,
        subject=names.get(rel.from_member_id, rel.from_member_id),
        other_id=rel.to_member_id,
        other=names.get(rel.to_member_id, rel.to_member_id),
        relation_type=rel.relation_type.value,
        author=author,
    )
    await db.delete(rel)
    await db.commit()
