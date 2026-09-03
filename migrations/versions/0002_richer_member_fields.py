"""richer member fields

Revision ID: 0002
Revises: 0001
Create Date: 2026-09-03
"""

import sqlalchemy as sa
from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None

COLUMNS = [
    ("middle_name", sa.String(100)),
    ("maiden_name", sa.String(100)),
    ("birth_place", sa.String(200)),
    ("profession", sa.String(200)),
    ("photo_url", sa.String(500)),
    ("phone", sa.String(50)),
    ("telegram", sa.String(100)),
    ("vk", sa.String(200)),
    ("instagram", sa.String(100)),
]


def upgrade() -> None:
    with op.batch_alter_table("family_members") as batch:
        for name, type_ in COLUMNS:
            batch.add_column(sa.Column(name, type_, nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("family_members") as batch:
        for name, _ in reversed(COLUMNS):
            batch.drop_column(name)
