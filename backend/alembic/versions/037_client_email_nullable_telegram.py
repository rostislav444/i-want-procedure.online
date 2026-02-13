"""Make telegram_id nullable and add email field to clients

Revision ID: 037
Revises: 036
Create Date: 2026-02-13

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '037'
down_revision = '036'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column('clients', 'telegram_id',
                     existing_type=sa.BigInteger(),
                     nullable=True)
    op.add_column('clients', sa.Column('email', sa.String(255), nullable=True))
    op.create_index('ix_clients_email', 'clients', ['email'])


def downgrade() -> None:
    op.drop_index('ix_clients_email', table_name='clients')
    op.drop_column('clients', 'email')
    op.alter_column('clients', 'telegram_id',
                     existing_type=sa.BigInteger(),
                     nullable=False)
