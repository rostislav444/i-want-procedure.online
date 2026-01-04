"""Add schedule_exceptions table

Revision ID: 004
Revises: 003
Create Date: 2024-01-04

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '004'
down_revision: Union[str, None] = '003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'schedule_exceptions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('doctor_id', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('type', sa.String(length=20), nullable=False),
        sa.Column('start_time', sa.Time(), nullable=True),
        sa.Column('end_time', sa.Time(), nullable=True),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['doctor_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_schedule_exceptions_date'), 'schedule_exceptions', ['date'], unique=False)
    op.create_index(op.f('ix_schedule_exceptions_doctor_id'), 'schedule_exceptions', ['doctor_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_schedule_exceptions_doctor_id'), table_name='schedule_exceptions')
    op.drop_index(op.f('ix_schedule_exceptions_date'), table_name='schedule_exceptions')
    op.drop_table('schedule_exceptions')
