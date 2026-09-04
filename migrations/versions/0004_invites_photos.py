"""invites, optional user email, user -> member link

Revision ID: 0004
Revises: 0003
Create Date: 2026-09-04
"""

import sqlalchemy as sa
from alembic import op

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "invites",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("token", sa.String(64), nullable=False, unique=True, index=True),
        sa.Column("role", sa.String(16), nullable=False),
        sa.Column("created_by", sa.String(80), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("used_at", sa.DateTime(), nullable=True),
        sa.Column("used_by", sa.String(80), nullable=True),
    )
    with op.batch_alter_table("admin_users") as batch:
        batch.alter_column("email", existing_type=sa.String(120), nullable=True)
        batch.add_column(sa.Column("member_id", sa.String(100), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("admin_users") as batch:
        batch.drop_column("member_id")
        batch.alter_column("email", existing_type=sa.String(120), nullable=False)
    op.drop_table("invites")
