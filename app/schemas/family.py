from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List, TypeVar, Generic
from datetime import date, datetime

# Generic type variable for paginated items
T = TypeVar('T')

# --- Generic Pagination Schema ---
class PaginatedResponse(BaseModel, Generic[T]):
    """Generic schema for paginated API responses."""
    total_items: int = Field(..., description="Total number of items available.")
    items: List[T] = Field(..., description="List of items for the current page.")
    page: int = Field(..., description="Current page number (1-based).")
    size: int = Field(..., description="Number of items per page.")
    total_pages: int = Field(..., description="Total number of pages.")

# --- Relation Schemas ---

class RelationBase(BaseModel):
    """Base schema for relation data (common fields)."""
    relation_type: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    # IDs will be handled separately or in specific context schemas

class RelationRead(RelationBase):
    """Schema for reading relation data, including IDs and related members."""
    id: int
    from_member_id: int
    to_member_id: int
    # We might include nested member info later if needed, but keep it simple for now
    # from_member: 'FamilyMemberReadMinimal' # Forward reference
    # to_member: 'FamilyMemberReadMinimal' # Forward reference

    model_config = ConfigDict(from_attributes=True) # Enable ORM mode

class RelationCreate(RelationBase):
    """Schema for creating a new relationship."""
    from_member_id: int
    to_member_id: int
    # relation_type, start_date, end_date are inherited from RelationBase

# --- Family Member Schemas ---

class FamilyMemberBase(BaseModel):
    """Base schema for family member data."""
    name: str
    birth_date: Optional[date] = None
    death_date: Optional[date] = None
    gender: Optional[str] = None # Consider Enum later
    location: Optional[str] = None # Added location
    notes: Optional[str] = None # Frontend 'bio' maps here

class FamilyMemberCreate(BaseModel):
    """Schema for creating a new family member."""
    # Accept separate name parts, combine in service layer
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    birth_date: Optional[date] = None
    death_date: Optional[date] = None
    gender: Optional[str] = None # Consider Enum later
    location: Optional[str] = None
    notes: Optional[str] = None # Frontend 'bio' maps here

class FamilyMemberUpdate(BaseModel):
    """Schema for updating an existing family member (all fields optional)."""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    middle_name: Optional[str] = None
    birth_date: Optional[date] = None
    death_date: Optional[date] = None
    gender: Optional[str] = None # Consider Enum later
    location: Optional[str] = None
    notes: Optional[str] = None # Frontend 'bio' maps here

class FamilyMemberReadMinimal(FamilyMemberBase):
    """Minimal schema for reading family member data (e.g., in lists or nested)."""
    id: int

    model_config = ConfigDict(from_attributes=True) # Enable ORM mode

class FamilyMemberRead(FamilyMemberBase):
    """Full schema for reading a single family member, including relationships."""
    id: int
    created_at: datetime
    updated_at: datetime
    relationships_from: List[RelationRead] = [] # List of relations where this member is 'from'
    relationships_to: List[RelationRead] = []   # List of relations where this member is 'to'
    is_descendant: Optional[bool] = None      # Flag indicating if the member is a direct descendant in the main line

    model_config = ConfigDict(from_attributes=True) # Enable ORM mode

# Update forward references if needed after all models are defined
# This is often handled automatically by Pydantic v2, but explicit update_forward_refs might be needed in complex cases.
# RelationRead.model_rebuild()
# FamilyMemberRead.model_rebuild()

# --- Specific Paginated Response for Family Members ---
class PaginatedFamilyMembersResponse(PaginatedResponse[FamilyMemberRead]):
    """Paginated response specifically for FamilyMemberRead items."""
    pass # Inherits all fields from PaginatedResponse[FamilyMemberRead]

# --- Batch Operation Schemas ---
class MemberListDelete(BaseModel):
    """Schema for deleting a list of members by their IDs."""
    member_ids: List[int] = Field(..., description="List of family member IDs to delete.")