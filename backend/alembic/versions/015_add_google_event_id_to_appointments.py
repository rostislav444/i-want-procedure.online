"""Add google_event_id to appointments

Revision ID: 015
Revises: 014
Create Date: 2025-01-06

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '015'
down_revision = '014'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('appointments', sa.Column('google_event_id', sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column('appointments', 'google_event_id')
