"""changes log

Revision ID: 0003
Revises: 0002
Create Date: 2026-09-04
"""

import sqlalchemy as sa
from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "changes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("changed_at", sa.DateTime(), nullable=False, index=True),
        sa.Column("entity", sa.String(16), nullable=False),
        sa.Column("kind", sa.String(16), nullable=False),
        sa.Column("entity_id", sa.String(100), nullable=False),
        sa.Column("subject", sa.String(200), nullable=False),
        sa.Column("other_id", sa.String(100), nullable=True),
        sa.Column("other", sa.String(200), nullable=True),
        sa.Column("relation_type", sa.String(16), nullable=True),
        sa.Column("field", sa.String(40), nullable=True),
        sa.Column("old", sa.Text(), nullable=True),
        sa.Column("new", sa.Text(), nullable=True),
        sa.Column("author", sa.String(80), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("changes")
