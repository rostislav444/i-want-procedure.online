"""add_company_public_fields

Revision ID: 005
Revises: 7d9a7b100dba
Create Date: 2026-01-04

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '005'
down_revision: Union[str, None] = '7d9a7b100dba'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new columns to companies table
    op.add_column('companies', sa.Column('slug', sa.String(length=100), nullable=True))
    op.add_column('companies', sa.Column('description', sa.Text(), nullable=True))
    op.add_column('companies', sa.Column('phone', sa.String(length=50), nullable=True))
    op.add_column('companies', sa.Column('address', sa.String(length=500), nullable=True))
    op.add_column('companies', sa.Column('telegram', sa.String(length=100), nullable=True))

    # Generate slugs for existing companies based on their id
    op.execute("UPDATE companies SET slug = 'company-' || id WHERE slug IS NULL")

    # Now make slug not nullable and add unique index
    op.alter_column('companies', 'slug', nullable=False)
    op.create_index('ix_companies_slug', 'companies', ['slug'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_companies_slug', table_name='companies')
    op.drop_column('companies', 'telegram')
    op.drop_column('companies', 'address')
    op.drop_column('companies', 'phone')
    op.drop_column('companies', 'description')
    op.drop_column('companies', 'slug')
