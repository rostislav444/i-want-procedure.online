"""Add specialist_services table

Revision ID: 020
Revises: 019
Create Date: 2026-01-08

This migration adds:
- specialist_services table (links specialists to services they can perform)
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '020'
down_revision: Union[str, None] = '019'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'specialist_services',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('specialist_profile_id', sa.Integer(), nullable=False),
        sa.Column('service_id', sa.Integer(), nullable=False),
        sa.Column('custom_price', sa.Numeric(10, 2), nullable=True),
        sa.Column('custom_duration_minutes', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['specialist_profile_id'], ['specialist_profiles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['service_id'], ['services.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('specialist_profile_id', 'service_id', name='uq_specialist_service')
    )
    op.create_index('ix_specialist_services_specialist_profile_id', 'specialist_services', ['specialist_profile_id'])
    op.create_index('ix_specialist_services_service_id', 'specialist_services', ['service_id'])


def downgrade() -> None:
    op.drop_index('ix_specialist_services_service_id', table_name='specialist_services')
    op.drop_index('ix_specialist_services_specialist_profile_id', table_name='specialist_services')
    op.drop_table('specialist_services')
