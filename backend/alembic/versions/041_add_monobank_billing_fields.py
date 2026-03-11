"""add monobank billing fields

Revision ID: 041
Revises: 040
Create Date: 2026-03-11
"""
from alembic import op
import sqlalchemy as sa

revision = '041'
down_revision = '040'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add monobank_token to companies for client payments
    op.add_column('companies', sa.Column('monobank_token', sa.String(200), nullable=True))

    # Add card tokenization fields to subscriptions for recurring payments
    op.add_column('subscriptions', sa.Column('card_token', sa.String(255), nullable=True))
    op.add_column('subscriptions', sa.Column('wallet_id', sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column('subscriptions', 'wallet_id')
    op.drop_column('subscriptions', 'card_token')
    op.drop_column('companies', 'monobank_token')
