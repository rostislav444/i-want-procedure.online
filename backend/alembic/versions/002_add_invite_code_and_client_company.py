"""Add invite_code to companies and company_id to clients

Revision ID: 002
Revises: 001
Create Date: 2024-01-02

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add invite_code to companies
    op.add_column('companies', sa.Column('invite_code', sa.String(length=20), nullable=True))
    op.create_index(op.f('ix_companies_invite_code'), 'companies', ['invite_code'], unique=True)

    # Generate invite codes for existing companies
    op.execute("""
        UPDATE companies
        SET invite_code = substr(md5(random()::text), 1, 12)
        WHERE invite_code IS NULL
    """)

    # Make invite_code not nullable
    op.alter_column('companies', 'invite_code', nullable=False)

    # Add company_id to clients
    op.add_column('clients', sa.Column('company_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_clients_company_id', 'clients', 'companies', ['company_id'], ['id'])


def downgrade() -> None:
    op.drop_constraint('fk_clients_company_id', 'clients', type_='foreignkey')
    op.drop_column('clients', 'company_id')
    op.drop_index(op.f('ix_companies_invite_code'), table_name='companies')
    op.drop_column('companies', 'invite_code')
