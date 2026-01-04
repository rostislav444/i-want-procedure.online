"""add_telegram_auth_fields

Revision ID: 006
Revises: 005
Create Date: 2026-01-04

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '006'
down_revision: Union[str, None] = '005'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new columns to users table
    op.add_column('users', sa.Column('patronymic', sa.String(length=100), nullable=True))
    op.add_column('users', sa.Column('phone', sa.String(length=20), nullable=True))
    op.add_column('users', sa.Column('telegram_username', sa.String(length=100), nullable=True))

    # Make email nullable (for Telegram-only users)
    op.alter_column('users', 'email', existing_type=sa.String(length=255), nullable=True)

    # Make hashed_password nullable (for Telegram-only users)
    op.alter_column('users', 'hashed_password', existing_type=sa.String(length=255), nullable=True)

    # Create unique index on telegram_id (partial - only where not null)
    op.create_index(
        'ix_users_telegram_id',
        'users',
        ['telegram_id'],
        unique=True,
        postgresql_where=sa.text('telegram_id IS NOT NULL')
    )


def downgrade() -> None:
    op.drop_index('ix_users_telegram_id', table_name='users')
    op.alter_column('users', 'hashed_password', existing_type=sa.String(length=255), nullable=False)
    op.alter_column('users', 'email', existing_type=sa.String(length=255), nullable=False)
    op.drop_column('users', 'telegram_username')
    op.drop_column('users', 'phone')
    op.drop_column('users', 'patronymic')
