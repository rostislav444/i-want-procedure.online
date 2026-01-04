"""Add appointment cancellation fields

Revision ID: 008
Revises: 7d9a7b100dba
Create Date: 2026-01-04

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '008_cancellation'
down_revision: Union[str, None] = '7d9a7b100dba'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('appointments', sa.Column('cancelled_by', sa.String(20), nullable=True))
    op.add_column('appointments', sa.Column('cancellation_reason', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('appointments', 'cancellation_reason')
    op.drop_column('appointments', 'cancelled_by')
