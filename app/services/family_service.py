import logging
from typing import List, Dict, Set
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from collections import deque # Use deque for BFS queue

from app.models import FamilyMember, Relation # Import the ORM models
from app.models.relation import RelationTypeEnum # Import the Enum
from app.schemas.family import FamilyMemberRead # Import the Pydantic schema for response

logger = logging.getLogger(__name__)

async def get_all_family_members(db: AsyncSession) -> List[FamilyMemberRead]: # Return Pydantic models
    """
    Fetches all family members from the database with their relationships preloaded,
    calculates the 'is_descendant' flag based on parent-child relationships
    starting from root nodes within the dataset.

    Args:
        db: The asynchronous database session.

    Returns:
        A list of FamilyMemberRead Pydantic models, including the calculated
        'is_descendant' flag.
    """
    logger.info("Fetching all family members from database.")
    try:
        stmt = (
            select(FamilyMember)
            .options(
                # Eager load relationships AND the members involved in them
                selectinload(FamilyMember.relationships_from).selectinload(Relation.from_member),
                selectinload(FamilyMember.relationships_from).selectinload(Relation.to_member),
                selectinload(FamilyMember.relationships_to).selectinload(Relation.from_member),
                selectinload(FamilyMember.relationships_to).selectinload(Relation.to_member)
            )
            .order_by(FamilyMember.id)
        )
        result = await db.execute(stmt)
        family_members_orm = result.unique().scalars().all()
        logger.info(f"Successfully fetched {len(family_members_orm)} family members.")

        if not family_members_orm:
            return []

        # --- Calculate is_descendant flag relative to primary root(s) ---
        members_dict: Dict[int, FamilyMember] = {m.id: m for m in family_members_orm}
        # Build only the child map (parent map isn't needed for BFS from specific roots)
        child_map: Dict[int, Set[int]] = {m_id: set() for m_id in members_dict}
        for member in family_members_orm:
            for rel in member.relationships_from:
                 # Compare with Enum member directly
                 if rel.relation_type == RelationTypeEnum.PARENT:
                    # Ensure the target child is actually in our fetched members
                    if rel.to_member_id in members_dict:
                        child_map[member.id].add(rel.to_member_id)

        # Identify the primary root member(s) using a heuristic (lowest ID)
        # WARNING: This heuristic might be incorrect for complex family trees.
        # A more robust solution involves marking progenitors in the DB.
        if not members_dict:
            primary_root_ids = set()
        else:
            # Find the minimum ID among all fetched members
            min_id = min(members_dict.keys())
            primary_root_ids = {min_id}
            # Optional: Add checks here if min_id member has parents *within the dataset*
            # to ensure it's a plausible root, but keep it simple for now.

        logger.debug(f"Identified primary root member(s) (heuristic - lowest ID): {primary_root_ids}")

        # Perform BFS starting *only* from the primary root(s)
        descendant_ids: Set[int] = set()
        if primary_root_ids:
            descendant_ids.update(primary_root_ids) # Start with the roots themselves
            queue = deque(primary_root_ids)
            while queue:
                current_id = queue.popleft()
                # Find children using the pre-built child_map
                children = child_map.get(current_id, set())
                for child_id in children:
                    # Check if child exists and hasn't been visited
                    if child_id in members_dict and child_id not in descendant_ids:
                        descendant_ids.add(child_id)
                        queue.append(child_id)

        logger.debug(f"Identified descendant members (IDs) from primary root(s): {descendant_ids}")

        # Convert ORM objects to Pydantic models, adding the is_descendant flag
        family_members_read: List[FamilyMemberRead] = []
        for member in family_members_orm:
            # Use model_validate to create Pydantic model from ORM object
            member_read = FamilyMemberRead.model_validate(member) # from_attributes=True is default in ConfigDict
            # Set the calculated flag
            member_read.is_descendant = member.id in descendant_ids
            family_members_read.append(member_read)
        # ------------------------------------

        logger.debug(f"Family members Pydantic data with is_descendant flag being returned: {family_members_read}")
        return family_members_read

    except Exception as e:
        logger.exception("Error fetching or processing family members.", exc_info=True)
        raise e