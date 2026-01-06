"""Add payment requisites fields to companies

Revision ID: 012
Revises: 011
Create Date: 2026-01-06

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '012'
down_revision: Union[str, None] = '011'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('companies', sa.Column('payment_iban', sa.String(34), nullable=True))
    op.add_column('companies', sa.Column('payment_bank_name', sa.String(100), nullable=True))
    op.add_column('companies', sa.Column('payment_recipient_name', sa.String(200), nullable=True))
    op.add_column('companies', sa.Column('payment_card_number', sa.String(19), nullable=True))
    op.add_column('companies', sa.Column('payment_monobank_jar', sa.String(200), nullable=True))


def downgrade() -> None:
    op.drop_column('companies', 'payment_monobank_jar')
    op.drop_column('companies', 'payment_card_number')
    op.drop_column('companies', 'payment_recipient_name')
    op.drop_column('companies', 'payment_bank_name')
    op.drop_column('companies', 'payment_iban')
