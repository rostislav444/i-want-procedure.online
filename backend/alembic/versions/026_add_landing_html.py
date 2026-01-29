"""Add landing_html to companies

Revision ID: 026
Revises: 025_section_templates
Create Date: 2025-01-21
"""
from alembic import op
import sqlalchemy as sa

revision = '026'
down_revision = '025_section_templates'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('companies', sa.Column('landing_html', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('companies', 'landing_html')
