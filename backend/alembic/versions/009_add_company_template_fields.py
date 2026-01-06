"""Add company template fields

Revision ID: 009
Revises: 008
Create Date: 2026-01-06

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '009'
down_revision: Union[str, None] = '008'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Template settings
    op.add_column('companies', sa.Column('template_type', sa.String(20), nullable=False, server_default='solo'))
    op.add_column('companies', sa.Column('primary_color', sa.String(7), nullable=True))
    op.add_column('companies', sa.Column('logo_url', sa.String(500), nullable=True))
    op.add_column('companies', sa.Column('cover_image_url', sa.String(500), nullable=True))

    # Additional info for public page
    op.add_column('companies', sa.Column('specialization', sa.String(200), nullable=True))
    op.add_column('companies', sa.Column('working_hours', sa.Text(), nullable=True))
    op.add_column('companies', sa.Column('social_links', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('companies', 'social_links')
    op.drop_column('companies', 'working_hours')
    op.drop_column('companies', 'specialization')
    op.drop_column('companies', 'cover_image_url')
    op.drop_column('companies', 'logo_url')
    op.drop_column('companies', 'primary_color')
    op.drop_column('companies', 'template_type')
