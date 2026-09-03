import csv
import io
import logging

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import FamilyMember, Relation
from app.models.family_member import GenderEnum
from app.models.relation import RelationTypeEnum
from scripts.google_sheets_utils import get_family_data_from_sheet, parse_sheet_date

logger = logging.getLogger(__name__)


def _clean(value) -> str | None:
    value = value.strip() if isinstance(value, str) else ""
    return value or None


def _gender(value: str | None) -> GenderEnum | None:
    if not value:
        return None
    try:
        return GenderEnum[value.upper()]
    except KeyError:
        logger.warning(f"Unknown gender {value!r}, stored as empty")
        return None


def parse_rows(rows) -> tuple[list[FamilyMember], list[Relation]]:
    """Sheet rows -> ORM objects.

    Rows without id/first_name are skipped. Parent links come from
    mother_id/father_id, spouse links from spouse_id (one edge per pair).
    """
    members: dict[str, FamilyMember] = {}
    links: list[tuple[str, str | None, str | None, str | None]] = []
    for row in rows:
        member_id = _clean(row.get("id"))
        first_name = _clean(row.get("first_name"))
        if not member_id or not first_name:
            logger.warning(f"Skipping row without id/first_name: {row}")
            continue
        if member_id in members:
            logger.warning(f"Duplicate id {member_id}, keeping the first row")
            continue
        members[member_id] = FamilyMember(
            id=member_id,
            first_name=first_name,
            last_name=_clean(row.get("last_name")),
            birth_date=parse_sheet_date(_clean(row.get("birth_date"))),
            death_date=parse_sheet_date(_clean(row.get("death_date"))),
            gender=_gender(_clean(row.get("gender"))),
            location=_clean(row.get("location")),
            notes=_clean(row.get("notes")),
        )
        links.append(
            (
                member_id,
                _clean(row.get("mother_id")),
                _clean(row.get("father_id")),
                _clean(row.get("spouse_id")),
            )
        )

    relations: list[Relation] = []
    seen: set[tuple] = set()

    def link(src: str, dst: str, kind: RelationTypeEnum) -> None:
        if src not in members or dst not in members:
            logger.warning(f"{kind.value} {src} -> {dst}: unknown id, skipped")
            return
        if src == dst:
            return
        pair = sorted((src, dst)) if kind is RelationTypeEnum.SPOUSE else (src, dst)
        key = (kind, *pair)
        if key in seen:
            return
        seen.add(key)
        relations.append(
            Relation(from_member_id=src, to_member_id=dst, relation_type=kind)
        )

    for member_id, mother, father, spouse in links:
        for parent in (mother, father):
            if parent:
                link(parent, member_id, RelationTypeEnum.PARENT)
        if spouse:
            link(member_id, spouse, RelationTypeEnum.SPOUSE)

    return list(members.values()), relations


async def process_family_data(db: AsyncSession) -> None:
    """Replace family_members and relations with the sheet contents, one transaction."""
    csv_data = get_family_data_from_sheet()
    if not csv_data:
        logger.error("No data from Google Sheets, database left untouched")
        return

    members, relations = parse_rows(csv.DictReader(io.StringIO(csv_data)))
    if not members:
        logger.error("Sheet parsed to zero members, database left untouched")
        return

    await db.execute(delete(Relation))
    await db.execute(delete(FamilyMember))
    db.add_all(members)
    await db.flush()
    db.add_all(relations)
    await db.commit()
    logger.info(f"Ingested {len(members)} members, {len(relations)} relations")
