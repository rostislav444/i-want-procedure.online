"""add event ticket types

Revision ID: 054
Revises: 053
Create Date: 2026-03-11
"""
from alembic import op
import sqlalchemy as sa

revision = '054'
down_revision = '053'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'event_ticket_types',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('event_id', sa.Integer(), sa.ForeignKey('educator_events.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('price', sa.Integer(), nullable=False, default=0),
        sa.Column('quantity', sa.Integer(), nullable=True),
        sa.Column('sold_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('order', sa.Integer(), nullable=False, server_default='0'),
    )

    op.add_column('event_registrations', sa.Column('ticket_type_id', sa.Integer(), sa.ForeignKey('event_ticket_types.id', ondelete='SET NULL'), nullable=True))
    op.add_column('event_registrations', sa.Column('ticket_count', sa.Integer(), nullable=False, server_default='1'))


def downgrade():
    op.drop_column('event_registrations', 'ticket_count')
    op.drop_column('event_registrations', 'ticket_type_id')
    op.drop_table('event_ticket_types')
