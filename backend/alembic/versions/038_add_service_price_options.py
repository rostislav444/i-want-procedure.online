"""Add service price options table and appointment price fields

Revision ID: 038
Revises: 037
Create Date: 2026-03-04
"""
from alembic import op
import sqlalchemy as sa

revision = '038'
down_revision = '037'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'service_price_options',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('service_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('price', sa.Numeric(10, 2), nullable=False),
        sa.Column('duration_minutes', sa.Integer(), nullable=True),
        sa.Column('order', sa.Integer(), nullable=False, server_default='0'),
        sa.ForeignKeyConstraint(['service_id'], ['services.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(
        op.f('ix_service_price_options_service_id'),
        'service_price_options', ['service_id'], unique=False
    )

    # Add price tracking fields to appointments
    op.add_column('appointments',
        sa.Column('price_option_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_appointments_price_option_id',
        'appointments', 'service_price_options',
        ['price_option_id'], ['id'],
        ondelete='SET NULL'
    )
    op.add_column('appointments',
        sa.Column('service_price', sa.Numeric(10, 2), nullable=True))


def downgrade() -> None:
    op.drop_constraint('fk_appointments_price_option_id', 'appointments', type_='foreignkey')
    op.drop_column('appointments', 'service_price')
    op.drop_column('appointments', 'price_option_id')
    op.drop_index(op.f('ix_service_price_options_service_id'), table_name='service_price_options')
    op.drop_table('service_price_options')
