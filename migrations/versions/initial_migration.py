"""initial

Revision ID: 0001
Revises: 
Create Date: 2025-06-01 23:25:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create all tables based on actual model definitions
    op.create_table(
        'admin_users',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('username', sa.String(80), nullable=False, unique=True),
        sa.Column('email', sa.String(120), nullable=False, unique=True),
        sa.Column('hashed_password', sa.String(256), nullable=False),
        sa.Column('role', sa.String(50), nullable=False, default='admin'),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(), default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column('last_login', sa.DateTime(), nullable=True)
    )

    op.create_table(
        'family_members',
        sa.Column('id', sa.String(100), primary_key=True),
        sa.Column('first_name', sa.String(100), nullable=False),
        sa.Column('last_name', sa.String(100), nullable=True),
        sa.Column('birth_date', sa.Date(), nullable=True),
        sa.Column('death_date', sa.Date(), nullable=True),
        sa.Column('gender', sa.Enum('MALE', 'FEMALE', 'OTHER', name='gender_enum'), nullable=True),
        sa.Column('location', sa.String(100), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), default=sa.func.now(), onupdate=sa.func.now())
    )

    op.create_table(
        'relations',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('relation_type', sa.Enum('PARENT', 'CHILD', 'SPOUSE', 'SIBLING', name='relation_type_enum'), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('from_member_id', sa.String(100), sa.ForeignKey('family_members.id', ondelete='CASCADE')),
        sa.Column('to_member_id', sa.String(100), sa.ForeignKey('family_members.id', ondelete='CASCADE')),
        sa.Column('created_at', sa.DateTime(), default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), default=sa.func.now(), onupdate=sa.func.now()),
        sa.UniqueConstraint('from_member_id', 'to_member_id', 'relation_type', name='_from_to_type_uc')
    )

    op.create_table(
        'subscribed_emails',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('email', sa.String(120), nullable=False, unique=True),
        sa.Column('subscription_date', sa.DateTime(), default=sa.func.now()),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('last_updated', sa.DateTime(), default=sa.func.now(), onupdate=sa.func.now())
    )


def downgrade() -> None:
    op.drop_table('subscribed_emails')
    op.drop_table('relations')
    op.drop_table('family_members')
    op.drop_table('admin_users')
    op.execute('DROP TYPE IF EXISTS relation_type_enum')
    op.execute('DROP TYPE IF EXISTS gender_enum')