"""Add service_steps and service_products tables

Revision ID: 003
Revises: 002
Create Date: 2024-01-03

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '003'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create service_steps table
    op.create_table(
        'service_steps',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('service_id', sa.Integer(), nullable=False),
        sa.Column('order', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('duration_minutes', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['service_id'], ['services.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_service_steps_service_id'), 'service_steps', ['service_id'], unique=False)

    # Create service_products table
    op.create_table(
        'service_products',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('service_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('manufacturer', sa.String(length=255), nullable=True),
        sa.ForeignKeyConstraint(['service_id'], ['services.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_service_products_service_id'), 'service_products', ['service_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_service_products_service_id'), table_name='service_products')
    op.drop_table('service_products')
    op.drop_index(op.f('ix_service_steps_service_id'), table_name='service_steps')
    op.drop_table('service_steps')
