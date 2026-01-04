"""Add city field and make company_id optional

Revision ID: 007
Revises: 006
Create Date: 2024-01-04

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '007'
down_revision: Union[str, None] = '006'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add city field
    op.add_column('users', sa.Column('city', sa.String(length=100), nullable=True))

    # Make company_id nullable
    op.alter_column('users', 'company_id',
                    existing_type=sa.INTEGER(),
                    nullable=True)


def downgrade() -> None:
    # Make company_id required again (will fail if there are NULL values)
    op.alter_column('users', 'company_id',
                    existing_type=sa.INTEGER(),
                    nullable=False)

    # Remove city field
    op.drop_column('users', 'city')
