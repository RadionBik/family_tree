"""Add location column to family_members table

Revision ID: 1fc8568adbf8
Revises: 36ae48ef3219
Create Date: 2025-04-23 21:26:44.553329

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1fc8568adbf8'
down_revision: Union[str, None] = '36ae48ef3219'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass