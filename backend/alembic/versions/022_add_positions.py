"""Add positions table

Revision ID: 022
Revises: 021
Create Date: 2026-01-08

This migration adds:
- positions table for job roles in clinics
- position_id column in services table
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '022'
down_revision: Union[str, None] = '021'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create positions table
    op.create_table(
        'positions',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('company_id', sa.Integer(), sa.ForeignKey('companies.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('color', sa.String(20), nullable=True),
        sa.Column('order', sa.Integer(), default=0, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # Add position_id to services
    op.add_column('services', sa.Column('position_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_services_position_id',
        'services', 'positions',
        ['position_id'], ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    op.drop_constraint('fk_services_position_id', 'services', type_='foreignkey')
    op.drop_column('services', 'position_id')
    op.drop_table('positions')
