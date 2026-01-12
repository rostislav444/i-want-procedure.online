"""Add position_id to specialist_profiles

Revision ID: 023
Revises: 022
Create Date: 2026-01-08

This migration adds position_id to specialist_profiles table
to link specialists to their job positions.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '023'
down_revision: Union[str, None] = '022'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add position_id to specialist_profiles
    op.add_column('specialist_profiles', sa.Column('position_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_specialist_profiles_position_id',
        'specialist_profiles', 'positions',
        ['position_id'], ['id'],
        ondelete='SET NULL'
    )
    op.create_index('ix_specialist_profiles_position_id', 'specialist_profiles', ['position_id'])


def downgrade() -> None:
    op.drop_index('ix_specialist_profiles_position_id', 'specialist_profiles')
    op.drop_constraint('fk_specialist_profiles_position_id', 'specialist_profiles', type_='foreignkey')
    op.drop_column('specialist_profiles', 'position_id')
