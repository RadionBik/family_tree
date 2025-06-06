import logging
import uuid
from collections import deque  # Use deque for BFS queue

from sqlalchemy import func, select  # Import func for count
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import FamilyMember, Relation  # Import the ORM models
from app.models.relation import RelationTypeEnum

# Import necessary schemas
from app.schemas.family import (
    FamilyMemberCreate,
    FamilyMemberRead,
    FamilyMemberReadMinimal,
    FamilyMemberUpdate,
    RelationRead,  # Keep relation schemas
)
from app.utils.localization import get_text  # For exception messages

logger = logging.getLogger(__name__)


# --- Custom Exceptions ---
class MemberNotFoundError(Exception):
    """Custom exception for when a family member is not found."""

    def __init__(self, member_id: int):
        self.member_id = member_id
        super().__init__(get_text("error_member_not_found_detail", member_id=member_id))


class RelationNotFoundError(Exception):
    """Custom exception for when a relationship is not found."""

    def __init__(self, relation_id: int):
        self.relation_id = relation_id
        super().__init__(
            get_text("error_relation_not_found_detail", relation_id=relation_id)
        )  # Add this key


class InvalidRelationError(Exception):
    """Custom exception for invalid relationship attempts (e.g., self-relation, duplicate)."""

    def __init__(self, message_key: str, **kwargs):
        # Pass the localization key and any format arguments
        super().__init__(get_text(message_key, **kwargs))  # Use get_text directly


# --- Service Functions ---


async def get_all_family_members(db: AsyncSession) -> list[FamilyMemberRead]:
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
                selectinload(FamilyMember.relationships_from).selectinload(
                    Relation.from_member
                ),
                selectinload(FamilyMember.relationships_from).selectinload(
                    Relation.to_member
                ),
                selectinload(FamilyMember.relationships_to).selectinload(
                    Relation.from_member
                ),
                selectinload(FamilyMember.relationships_to).selectinload(
                    Relation.to_member
                ),
            )
            .order_by(FamilyMember.id)
        )
        result = await db.execute(stmt)
        family_members_orm = result.unique().scalars().all()
        logger.info(f"Successfully fetched {len(family_members_orm)} family members.")

        if not family_members_orm:
            return []

        # --- Calculate is_descendant flag relative to primary root(s) ---
        members_dict: dict[int, FamilyMember] = {m.id: m for m in family_members_orm}
        # Build only the child map (parent map isn't needed for BFS from specific roots)
        child_map: dict[int, set[int]] = {m_id: set() for m_id in members_dict}
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

        logger.debug(
            f"Identified primary root member(s) (heuristic - lowest ID): {primary_root_ids}"
        )

        # Perform BFS starting *only* from the primary root(s)
        descendant_ids: set[int] = set()
        if primary_root_ids:
            descendant_ids.update(primary_root_ids)  # Start with the roots themselves
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

        logger.debug(
            f"Identified descendant members (IDs) from primary root(s): {descendant_ids}"
        )

        # Convert ORM objects to Pydantic models, adding the is_descendant flag
        family_members_read: list[FamilyMemberRead] = []
        for member in family_members_orm:
            # Use model_validate to create Pydantic model from ORM object
            member_read = FamilyMemberRead.model_validate(
                member
            )  # from_attributes=True is default in ConfigDict
            # Set the calculated flag
            member_read.is_descendant = member.id in descendant_ids
            family_members_read.append(member_read)
        # ------------------------------------

        logger.debug(
            f"Family members Pydantic data with is_descendant flag being returned: {family_members_read}"
        )
        return family_members_read

    except Exception as e:
        logger.exception("Error fetching or processing family members.", exc_info=True)
        raise e


async def get_paginated_family_members(
    db: AsyncSession, skip: int = 0, limit: int = 10, search_term: str | None = None
) -> tuple[list[FamilyMemberRead], int]:
    """
    Fetches a paginated list of family members from the database, optionally filtering by a search term.
    Does not preload relationships for efficiency in list view.

    Args:
        db: The asynchronous database session.
        skip: The number of records to skip (for pagination).
        limit: The maximum number of records to return (page size).

    Returns:
        A tuple containing:
            - A list of FamilyMemberRead Pydantic models for the current page.
            - The total number of family members matching the criteria.
    """
    logger.info(
        f"Fetching paginated family members: skip={skip}, limit={limit}, search='{search_term}'"
    )

    try:
        # Base query
        base_query = select(FamilyMember)
        count_query = select(func.count(FamilyMember.id))

        # Apply search filter if provided (case-insensitive search on name)
        if search_term:
            search_filter = FamilyMember.name.ilike(f"%{search_term}%")
            base_query = base_query.where(search_filter)
            count_query = count_query.where(search_filter)

        # Query for the items on the current page
        items_stmt = (
            base_query.order_by(FamilyMember.id)  # Or name, etc.
            .offset(skip)
            .limit(limit)
            # No relationship preloading for the list view
        )
        items_result = await db.execute(items_stmt)
        members_orm = items_result.scalars().all()
        members_read = [
            FamilyMemberRead.model_validate(m) for m in members_orm
        ]  # Convert to Pydantic

        # Query for the total count of items matching the filter
        total_items_result = await db.execute(count_query)
        total_items = total_items_result.scalar_one()

        logger.info(
            f"Successfully fetched {len(members_read)} members (page) matching search='{search_term}' out of {total_items} total."
        )
        return members_read, total_items

    except Exception as e:
        logger.exception(
            f"Error fetching paginated family members (skip={skip}, limit={limit}).",
            exc_info=True,
        )
        raise e  # Re-raise for the API layer


async def get_member_by_id(db: AsyncSession, member_id: int) -> FamilyMemberRead:
    """
    Fetches a single family member by their ID with relationships preloaded.

    Args:
        db: The asynchronous database session.
        member_id: The ID of the member to fetch.

    Returns:
        A FamilyMemberRead Pydantic model.

    Raises:
        MemberNotFoundError: If no member with the given ID is found.
    """
    logger.info(f"Fetching family member with ID: {member_id}")
    stmt = (
        select(FamilyMember)
        .where(FamilyMember.id == member_id)
        .options(
            selectinload(FamilyMember.relationships_from).selectinload(
                Relation.to_member
            ),
            selectinload(FamilyMember.relationships_to).selectinload(
                Relation.from_member
            ),
        )
    )
    result = await db.execute(stmt)
    member_orm = result.unique().scalar_one_or_none()

    if member_orm is None:
        logger.warning(f"Member with ID {member_id} not found.")
        raise MemberNotFoundError(member_id=member_id)

    logger.info(f"Successfully fetched member ID {member_id}.")
    # We might need to recalculate is_descendant relative to this member or a root
    # For now, return without it or set to None/False for single fetch
    member_read = FamilyMemberRead.model_validate(member_orm)
    member_read.is_descendant = None  # Or calculate if needed for this context
    return member_read


async def create_family_member(
    db: AsyncSession, member_data: FamilyMemberCreate, member_id: str | None = None
) -> FamilyMemberReadMinimal:
    """
    Creates a new family member in the database.

    Args:
        db: The asynchronous database session.
        member_data: The Pydantic schema containing the data for the new member.

    Returns:
        The newly created family member as a FamilyMemberRead Pydantic model.
    """
    logger.info(
        f"Creating new family member: {member_data.first_name} {member_data.last_name}"
    )

    # Generate ID if not provided
    if member_id is None:
        member_id = str(uuid.uuid4())

    # Create ORM model instance
    new_member_orm = FamilyMember(
        id=member_id,
        last_name=member_data.last_name,
        first_name=member_data.first_name,
        birth_date=member_data.birth_date,
        death_date=member_data.death_date,
        gender=member_data.gender,
        location=member_data.location,
        notes=member_data.notes,  # Map bio from frontend to notes
        # created_at and updated_at are handled by the model defaults
    )

    try:
        db.add(new_member_orm)
        await db.flush()  # Assigns ID to new_member_orm
        await db.refresh(new_member_orm)  # Load default values like created_at
        await db.commit()  # Commit the transaction
        logger.info(
            f"Successfully created member ID {new_member_orm.id}: {member_data.first_name} {member_data.last_name}"
        )
        # Return the Pydantic model
        return FamilyMemberReadMinimal.model_validate(new_member_orm)
    except Exception as e:
        await db.rollback()  # Rollback in case of error
        logger.exception(
            f"Database error creating family member {member_data.first_name} {member_data.last_name}.",
            exc_info=True,
        )
        raise e  # Re-raise the exception for the API layer to handle


async def update_family_member(
    db: AsyncSession, member_id: int, member_data: FamilyMemberUpdate
) -> FamilyMemberRead:
    """
    Updates an existing family member in the database.

    Args:
        db: The asynchronous database session.
        member_id: The ID of the member to update.
        member_data: The Pydantic schema containing the updated data (fields are optional).

    Returns:
        The updated family member as a FamilyMemberRead Pydantic model.

    Raises:
        MemberNotFoundError: If no member with the given ID is found.
    """
    logger.info(f"Updating family member with ID: {member_id}")

    # Fetch the existing member
    stmt = select(FamilyMember).where(FamilyMember.id == member_id)
    result = await db.execute(stmt)
    member_orm = result.scalar_one_or_none()

    if member_orm is None:
        logger.warning(f"Attempted to update non-existent member ID: {member_id}")
        raise MemberNotFoundError(member_id=member_id)

    # Update fields from the Pydantic model if they are provided
    update_data = member_data.model_dump(exclude_unset=True)  # Get only provided fields

    # Handle name concatenation if name parts are provided
    # Unused variables first_name, last_name, middle_name removed.

    # Reconstruct full name based on potentially updated parts
    # This logic assumes a simple "LastName FirstName MiddleName" structure and might need refinement
    current_parts = member_orm.name.split(" ")
    if "last_name" in update_data:
        current_parts[0] = update_data["last_name"]
    if "first_name" in update_data:
        current_parts[1] = update_data["first_name"]
    # Filter out empty strings that might result from None middle names
    member_orm.name = " ".join(filter(None, current_parts))

    # Update other fields directly
    if "birth_date" in update_data:
        member_orm.birth_date = update_data["birth_date"]
    if "death_date" in update_data:
        member_orm.death_date = update_data["death_date"]
    if "gender" in update_data:
        member_orm.gender = update_data["gender"]
    if "location" in update_data:
        member_orm.location = update_data["location"]
    if "notes" in update_data:  # Map bio to notes
        member_orm.notes = update_data["notes"]

    # updated_at is handled automatically by the model event listener

    try:
        await db.flush()  # Apply changes to the session
        await db.refresh(member_orm)  # Refresh to get updated state (like updated_at)
        await db.commit()  # Commit the transaction
        logger.info(f"Successfully updated member ID {member_id}.")
        # Return the updated Pydantic model
        return FamilyMemberRead.model_validate(member_orm)
    except Exception as e:
        await db.rollback()
        logger.exception(
            f"Database error updating member ID {member_id}.", exc_info=True
        )
        raise e


async def delete_family_member(db: AsyncSession, member_id: int) -> None:
    """
    Deletes a family member from the database.

    Args:
        db: The asynchronous database session.
        member_id: The ID of the member to delete.

    Raises:
        MemberNotFoundError: If no member with the given ID is found.
    """
    logger.info(f"Attempting to delete family member with ID: {member_id}")

    # Fetch the existing member
    stmt = select(FamilyMember).where(FamilyMember.id == member_id)
    result = await db.execute(stmt)
    member_orm = result.scalar_one_or_none()

    if member_orm is None:
        logger.warning(f"Attempted to delete non-existent member ID: {member_id}")
        raise MemberNotFoundError(member_id=member_id)

    # TODO: Consider relationship handling. Deleting a member might require
    # deleting related Relation entries or handling constraints.
    # For now, assume cascade delete is set up correctly in the DB/model,
    # or handle relationship deletion explicitly here if needed.

    try:
        await db.delete(member_orm)
        await db.commit()  # Commit the transaction
        logger.info(f"Successfully deleted member ID {member_id}.")
    except Exception as e:
        await db.rollback()
        # Log potential constraint violations or other DB errors
        logger.exception(
            f"Database error deleting member ID {member_id}.", exc_info=True
        )
        raise e


async def create_relationship(
    db: AsyncSession,
    from_member_id: str,
    to_member_id: str,
    relation_type: RelationTypeEnum,
) -> RelationRead:
    """
    Creates a new relationship between two family members.

    Args:
        db: The asynchronous database session.
        relation_data: The Pydantic schema containing the data for the new relationship.

    Returns:
        The newly created relationship as a RelationRead Pydantic model.

    Raises:
        MemberNotFoundError: If either the 'from' or 'to' member doesn't exist.
        InvalidRelationError: If the relationship is invalid (e.g., self-relation, duplicate).
    """
    logger.info(
        f"Creating relationship: {from_member_id} -> {to_member_id} ({relation_type})"
    )

    # --- Validation ---
    if from_member_id == to_member_id:
        logger.warning("Attempted to create self-relation.")
        raise InvalidRelationError("error_relation_self")

    from_member = await db.get(FamilyMember, from_member_id)
    if not from_member:
        raise MemberNotFoundError(from_member_id)
    to_member = await db.get(FamilyMember, to_member_id)
    if not to_member:
        raise MemberNotFoundError(to_member_id)

    # --- Creation ---
    new_relation_orm = Relation(
        from_member_id=from_member_id,
        to_member_id=to_member_id,
        relation_type=relation_type,
    )

    try:
        db.add(new_relation_orm)
        await db.flush()  # Assigns ID
        await db.refresh(new_relation_orm)  # Load defaults
        await db.commit()
        logger.info(f"Successfully created relationship ID {new_relation_orm.id}")
        # Return the Pydantic model
        return RelationRead.model_validate(new_relation_orm)
    except Exception as e:
        await db.rollback()
        logger.exception(
            f"Database error creating relationship {from_member_id} -> {to_member_id}.",
            exc_info=True,
        )
        raise e  # Re-raise for API layer


async def delete_relationship(db: AsyncSession, relation_id: int) -> None:
    """
    Deletes a relationship from the database.

    Args:
        db: The asynchronous database session.
        relation_id: The ID of the relationship to delete.

    Raises:
        RelationNotFoundError: If no relationship with the given ID is found.
    """
    logger.info(f"Attempting to delete relationship with ID: {relation_id}")

    # Fetch the existing relationship
    relation_orm = await db.get(Relation, relation_id)

    if relation_orm is None:
        logger.warning(
            f"Attempted to delete non-existent relationship ID: {relation_id}"
        )
        raise RelationNotFoundError(relation_id=relation_id)

    try:
        await db.delete(relation_orm)
        await db.commit()
        logger.info(f"Successfully deleted relationship ID {relation_id}.")
    except Exception as e:
        await db.rollback()
        logger.exception(
            f"Database error deleting relationship ID {relation_id}.", exc_info=True
        )
        raise e


async def delete_multiple_family_members(
    db: AsyncSession, member_ids: list[int]
) -> int:
    """
    Deletes multiple family members from the database based on a list of IDs.

    Args:
        db: The asynchronous database session.
        member_ids: A list of IDs of the members to delete.

    Returns:
        The number of members successfully deleted.

    Raises:
        # Could potentially raise an error if some IDs are not found,
        # but for batch delete, often we just delete those that exist.
    """
    if not member_ids:
        logger.warning("Attempted batch delete with an empty list of member IDs.")
        return 0

    logger.info(f"Attempting to batch delete family members with IDs: {member_ids}")

    # Fetch existing members matching the provided IDs
    stmt = select(FamilyMember).where(FamilyMember.id.in_(member_ids))
    result = await db.execute(stmt)
    members_to_delete = result.scalars().all()

    if not members_to_delete:
        logger.warning(f"Batch delete: None of the provided IDs found: {member_ids}")
        return 0

    deleted_count = 0
    found_ids = {m.id for m in members_to_delete}
    not_found_ids = set(member_ids) - found_ids
    if not_found_ids:
        logger.warning(
            f"Batch delete: The following member IDs were not found: {list(not_found_ids)}"
        )

    # TODO: Consider relationship handling as in single delete.

    try:
        for member in members_to_delete:
            await db.delete(member)
            deleted_count += 1
        await db.commit()  # Commit the transaction after all deletions are staged
        logger.info(f"Successfully batch deleted {deleted_count} members.")
        return deleted_count
    except Exception as e:
        await db.rollback()
        logger.exception(
            f"Database error during batch delete of members: {member_ids}.",
            exc_info=True,
        )
        raise e  # Re-raise for the API layer
