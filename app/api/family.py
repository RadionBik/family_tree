import logging
import math  # For calculating total_pages

from fastapi import (  # Added Query
    APIRouter,
    Depends,
    HTTPException,
    Query,
    Response,
    status,
)
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_active_user  # Import the auth dependency
from app.models.admin_user import AdminUser  # For dependency injection type hint

# Import necessary schemas and models
from app.schemas.family import (
    FamilyMemberCreate,
    FamilyMemberRead,
    FamilyMemberUpdate,
    MemberListDelete,
    PaginatedFamilyMembersResponse,  # Added pagination response schema
    RelationCreate,
    RelationRead,
)
from app.services import family_service
from app.services.family_service import (  # Import custom exceptions
    InvalidRelationError,
    MemberNotFoundError,
    RelationNotFoundError,
)
from app.utils.database import get_db_session
from app.utils.localization import get_text

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get(
    "/family/tree",  # Corrected path to match frontend service call
    response_model=list[
        FamilyMemberRead
    ],  # Specify the response schema (a list of members)
    summary="Get Complete Family Tree",
    description="Retrieves all family members and their relationships.",
    tags=["Family"],  # Tag for API documentation grouping
)
async def get_family_tree(
    db: AsyncSession = Depends(get_db_session),  # Inject async DB session
):
    """
    API endpoint to retrieve the entire family tree data.
    """
    logger.info(
        "Received request for /family/tree endpoint."
    )  # Corrected log message path
    try:
        logger.info("Attempting to call family_service.get_all_family_members...")
        family_members_orm = await family_service.get_all_family_members(db)
        logger.info(
            f"Successfully retrieved {len(family_members_orm)} members from service."
        )
        # FastAPI automatically converts the list of ORM objects to a list of FamilyMemberRead Pydantic models
        logger.info("Returning family members data.")
        return family_members_orm
    except Exception as e:
        # Log the specific error details
        logger.error(
            f"Error type: {type(e).__name__}, Error details: {e}", exc_info=True
        )
        logger.exception(
            "An unexpected error occurred while fetching the family tree."
        )  # Keep original exception log too
        # Raise a standard HTTPException which will be caught by our handler in main.py
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=get_text("error_occurred"),  # Use localized error message
        )


# --- Admin Paginated List Endpoint ---


@router.get(
    "/family/members/list",
    response_model=PaginatedFamilyMembersResponse,
    summary="List Family Members (Admin, Paginated)",
    description="Retrieves a paginated list of family members. Requires admin authentication.",
    tags=["Family Admin"],
)
async def list_family_members(
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    size: int = Query(10, ge=1, le=100, description="Items per page"),
    search: str | None = Query(
        None, description="Search term to filter by name"
    ),  # Add search query param
    db: AsyncSession = Depends(get_db_session),
    current_user: AdminUser = Depends(get_current_active_user),  # Protect route
):
    """
    Admin endpoint to get a paginated list of family members, with optional search.
    """
    logger.info(
        f"Admin '{current_user.username}' listing members: page={page}, size={size}, search='{search}'"
    )
    skip = (page - 1) * size
    limit = size
    try:
        members_list, total_items = await family_service.get_paginated_family_members(
            db=db,
            skip=skip,
            limit=limit,
            search_term=search,  # Pass search term
        )
        total_pages = math.ceil(total_items / size) if size > 0 else 0

        return PaginatedFamilyMembersResponse(
            total_items=total_items,
            items=members_list,
            page=page,
            size=size,
            total_pages=total_pages,
        )
    except Exception as e:
        logger.exception(
            f"Error listing members for admin '{current_user.username}': {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=get_text("error_listing_members"),  # Add this key to locales
        )


# --- Admin CRUD Endpoints for Individual Family Members ---


@router.post(
    "/family/members",
    response_model=FamilyMemberRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create Family Member (Admin)",
    description="Adds a new family member to the database. Requires admin authentication.",
    tags=["Family Admin"],
)
async def create_family_member(
    member_data: FamilyMemberCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: AdminUser = Depends(get_current_active_user),  # Protect route
):
    """
    Admin endpoint to create a new family member.
    """
    logger.info(
        f"Admin '{current_user.username}' attempting to create family member: {member_data.first_name} {member_data.last_name}"
    )
    try:
        new_member = await family_service.create_family_member(
            db=db, member_data=member_data
        )
        logger.info(
            f"Successfully created member ID {new_member.id} by admin '{current_user.username}'"
        )
        return new_member
    except Exception as e:
        logger.exception(
            f"Error creating family member by admin '{current_user.username}': {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=get_text("error_creating_member"),  # Add this key to locales
        )


@router.get(
    "/family/members/{member_id}",
    response_model=FamilyMemberRead,
    summary="Get Family Member by ID (Admin)",
    description="Retrieves details for a specific family member by their ID. Requires admin authentication.",
    tags=["Family Admin"],
)
async def get_family_member(
    member_id: int,
    db: AsyncSession = Depends(get_db_session),
    current_user: AdminUser = Depends(get_current_active_user),  # Protect route
):
    """
    Admin endpoint to get a specific family member.
    """
    logger.info(
        f"Admin '{current_user.username}' attempting to fetch member ID: {member_id}"
    )
    try:
        member = await family_service.get_member_by_id(db=db, member_id=member_id)
        logger.info(
            f"Successfully fetched member ID {member_id} for admin '{current_user.username}'"
        )
        return member
    except MemberNotFoundError:
        logger.warning(
            f"Member ID {member_id} not found when requested by admin '{current_user.username}'."
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=get_text("error_member_not_found"),  # Add this key to locales
        )
    except Exception as e:
        logger.exception(
            f"Error fetching member ID {member_id} by admin '{current_user.username}': {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=get_text("error_fetching_member"),  # Add this key to locales
        )


@router.put(
    "/family/members/{member_id}",
    response_model=FamilyMemberRead,
    summary="Update Family Member (Admin)",
    description="Updates details for an existing family member. Requires admin authentication.",
    tags=["Family Admin"],
)
async def update_family_member(
    member_id: int,
    member_data: FamilyMemberUpdate,
    db: AsyncSession = Depends(get_db_session),
    current_user: AdminUser = Depends(get_current_active_user),  # Protect route
):
    """
    Admin endpoint to update a family member.
    """
    logger.info(
        f"Admin '{current_user.username}' attempting to update member ID: {member_id}"
    )
    try:
        updated_member = await family_service.update_family_member(
            db=db, member_id=member_id, member_data=member_data
        )
        logger.info(
            f"Successfully updated member ID {member_id} by admin '{current_user.username}'"
        )
        return updated_member
    except MemberNotFoundError:
        logger.warning(
            f"Attempt to update non-existent member ID {member_id} by admin '{current_user.username}'."
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=get_text("error_member_not_found"),
        )
    except Exception as e:
        logger.exception(
            f"Error updating member ID {member_id} by admin '{current_user.username}': {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=get_text("error_updating_member"),  # Add this key to locales
        )


@router.delete(
    "/family/members/{member_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Family Member (Admin)",
    description="Deletes a family member from the database. Requires admin authentication.",
    tags=["Family Admin"],
)
async def delete_family_member(
    member_id: int,
    db: AsyncSession = Depends(get_db_session),
    current_user: AdminUser = Depends(get_current_active_user),  # Protect route
):
    """
    Admin endpoint to delete a family member.
    """
    logger.info(
        f"Admin '{current_user.username}' attempting to delete member ID: {member_id}"
    )
    try:
        await family_service.delete_family_member(db=db, member_id=member_id)
        logger.info(
            f"Successfully deleted member ID {member_id} by admin '{current_user.username}'"
        )
        # Return Response with 204 status explicitly for clarity
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except MemberNotFoundError:
        logger.warning(
            f"Attempt to delete non-existent member ID {member_id} by admin '{current_user.username}'."
        )
        # Even if not found, deletion is idempotent, so maybe don't raise 404?
        # Let's raise 404 for consistency with GET/PUT.
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=get_text("error_member_not_found"),
        )
    except Exception as e:
        # Consider specific exceptions, e.g., if deletion fails due to constraints
        logger.exception(
            f"Error deleting member ID {member_id} by admin '{current_user.username}': {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=get_text("error_deleting_member"),  # Add this key to locales
        )


# --- Admin Batch Delete Endpoint ---


@router.delete(
    "/family/members/batch",
    status_code=status.HTTP_200_OK,  # Or 204 if we don't return count
    summary="Batch Delete Family Members (Admin)",
    description="Deletes multiple family members based on a list of IDs. Requires admin authentication.",
    tags=["Family Admin"],
    # Consider adding a response model if returning more details, e.g., {"deleted_count": int}
)
async def batch_delete_family_members(
    delete_data: MemberListDelete,  # Get IDs from request body
    db: AsyncSession = Depends(get_db_session),
    current_user: AdminUser = Depends(get_current_active_user),  # Protect route
):
    """
    Admin endpoint to batch delete family members.
    """
    member_ids = delete_data.member_ids
    if not member_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=get_text("error_batch_delete_empty_list"),  # Add this key
        )

    logger.info(
        f"Admin '{current_user.username}' attempting to batch delete members with IDs: {member_ids}"
    )
    try:
        deleted_count = await family_service.delete_multiple_family_members(
            db=db, member_ids=member_ids
        )
        logger.info(
            f"Batch delete completed by admin '{current_user.username}'. Deleted {deleted_count} members."
        )
        # Return the count of deleted items
        return {
            "deleted_count": deleted_count,
            "message": get_text("success_batch_delete", count=deleted_count),
        }  # Add this key
    except Exception as e:
        logger.exception(
            f"Error during batch delete by admin '{current_user.username}': {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=get_text("error_batch_delete_failed"),  # Add this key
        )


# --- Admin CRUD Endpoints for Relationships ---


@router.post(
    "/family/relationships",
    response_model=RelationRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create Relationship (Admin)",
    description="Adds a new relationship between two family members. Requires admin authentication.",
    tags=["Family Admin"],
)
async def create_relationship(
    relation_data: RelationCreate,
    db: AsyncSession = Depends(get_db_session),
    current_user: AdminUser = Depends(get_current_active_user),  # Protect route
):
    """
    Admin endpoint to create a new relationship.
    """
    logger.info(
        f"Admin '{current_user.username}' attempting to create relationship: {relation_data.from_member_id} -> {relation_data.to_member_id} ({relation_data.relation_type})"
    )
    try:
        new_relation = await family_service.create_relationship(
            db=db, relation_data=relation_data
        )
        logger.info(
            f"Successfully created relationship ID {new_relation.id} by admin '{current_user.username}'"
        )
        return new_relation
    except (MemberNotFoundError, InvalidRelationError) as e:
        logger.warning(
            f"Failed to create relationship by admin '{current_user.username}': {e}"
        )
        # Use specific status codes if desired (e.g., 400 for InvalidRelationError)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,  # Or 404 if MemberNotFound
            detail=str(e),  # Use the exception's message (which should be localized)
        )
    except Exception as e:
        logger.exception(
            f"Error creating relationship by admin '{current_user.username}': {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=get_text("error_creating_relation"),  # Add this key to locales
        )


@router.delete(
    "/family/relationships/{relation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Relationship (Admin)",
    description="Deletes a relationship between family members. Requires admin authentication.",
    tags=["Family Admin"],
)
async def delete_relationship(
    relation_id: int,
    db: AsyncSession = Depends(get_db_session),
    current_user: AdminUser = Depends(get_current_active_user),  # Protect route
):
    """
    Admin endpoint to delete a relationship.
    """
    logger.info(
        f"Admin '{current_user.username}' attempting to delete relationship ID: {relation_id}"
    )
    try:
        await family_service.delete_relationship(db=db, relation_id=relation_id)
        logger.info(
            f"Successfully deleted relationship ID {relation_id} by admin '{current_user.username}'"
        )
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except RelationNotFoundError as e:
        logger.warning(
            f"Attempt to delete non-existent relationship ID {relation_id} by admin '{current_user.username}'."
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),  # Use the exception's localized message
        )
    except Exception as e:
        logger.exception(
            f"Error deleting relationship ID {relation_id} by admin '{current_user.username}': {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=get_text("error_deleting_relation"),  # Add this key to locales
        )
