"""Add Google OAuth fields to users

Revision ID: 014
Revises: 013
Create Date: 2026-01-06

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '014'
down_revision: Union[str, None] = '013'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('google_id', sa.String(100), nullable=True))
    op.add_column('users', sa.Column('google_email', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('google_access_token', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('google_refresh_token', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('google_token_expires_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('google_calendar_enabled', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('users', sa.Column('google_calendar_id', sa.String(255), nullable=True))

    op.create_index(op.f('ix_users_google_id'), 'users', ['google_id'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_users_google_id'), table_name='users')
    op.drop_column('users', 'google_calendar_id')
    op.drop_column('users', 'google_calendar_enabled')
    op.drop_column('users', 'google_token_expires_at')
    op.drop_column('users', 'google_refresh_token')
    op.drop_column('users', 'google_access_token')
    op.drop_column('users', 'google_email')
    op.drop_column('users', 'google_id')
