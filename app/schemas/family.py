from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import date, datetime

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

# --- Family Member Schemas ---

class FamilyMemberBase(BaseModel):
    """Base schema for family member data."""
    name: str
    birth_date: Optional[date] = None
    death_date: Optional[date] = None
    gender: Optional[str] = None
    notes: Optional[str] = None

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

    model_config = ConfigDict(from_attributes=True) # Enable ORM mode

# Update forward references if needed after all models are defined
# This is often handled automatically by Pydantic v2, but explicit update_forward_refs might be needed in complex cases.
# RelationRead.model_rebuild()
# FamilyMemberRead.model_rebuild()