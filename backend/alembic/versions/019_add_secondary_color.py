"""Add secondary_color to companies

Revision ID: 019
Revises: 018
Create Date: 2026-01-06

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '019'
down_revision = '018'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('companies', sa.Column('secondary_color', sa.String(7), nullable=True))


def downgrade() -> None:
    op.drop_column('companies', 'secondary_color')
