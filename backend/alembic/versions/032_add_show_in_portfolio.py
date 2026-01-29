"""Add show_in_portfolio field to protocol_files table

Revision ID: 032
Revises: 031
Create Date: 2025-01-29
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '032'
down_revision: Union[str, None] = '031'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'protocol_files',
        sa.Column('show_in_portfolio', sa.Boolean(), nullable=False, server_default='false')
    )


def downgrade() -> None:
    op.drop_column('protocol_files', 'show_in_portfolio')
