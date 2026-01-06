"""Add client_companies table for multi-specialist support

Revision ID: 010
Revises: 009
Create Date: 2026-01-06

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '010'
down_revision: Union[str, None] = '009'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create client_companies table
    op.create_table(
        'client_companies',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('client_id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['client_id'], ['clients.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('client_id', 'company_id', name='uq_client_company')
    )
    op.create_index('ix_client_companies_client_id', 'client_companies', ['client_id'])
    op.create_index('ix_client_companies_company_id', 'client_companies', ['company_id'])

    # Migrate existing data: create client_companies entries from clients.company_id
    op.execute("""
        INSERT INTO client_companies (client_id, company_id, created_at)
        SELECT id, company_id, created_at
        FROM clients
        WHERE company_id IS NOT NULL
    """)

    # Make clients.company_id nullable (keep for backwards compatibility)
    op.alter_column('clients', 'company_id',
                    existing_type=sa.Integer(),
                    nullable=True)


def downgrade() -> None:
    # Make clients.company_id not nullable again
    op.alter_column('clients', 'company_id',
                    existing_type=sa.Integer(),
                    nullable=False)

    # Drop client_companies table
    op.drop_index('ix_client_companies_company_id', table_name='client_companies')
    op.drop_index('ix_client_companies_client_id', table_name='client_companies')
    op.drop_table('client_companies')
