"""Add is_available_for_sale to inventory_items

Revision ID: 034
Revises: 033
Create Date: 2025-01-29
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '034'
down_revision: Union[str, None] = '033'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'inventory_items',
        sa.Column('is_available_for_sale', sa.Boolean(), server_default='false', nullable=False)
    )


def downgrade() -> None:
    op.drop_column('inventory_items', 'is_available_for_sale')
