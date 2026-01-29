"""Add reference_images to landing_versions

Revision ID: 028
Revises: 027
Create Date: 2025-01-21
"""
from alembic import op
import sqlalchemy as sa

revision = '028'
down_revision = '027'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'landing_versions',
        sa.Column('reference_images', sa.JSON(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('landing_versions', 'reference_images')
