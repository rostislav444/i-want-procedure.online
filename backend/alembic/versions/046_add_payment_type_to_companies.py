"""Add payment_type to companies

Revision ID: 046
Revises: 045
"""
from alembic import op
import sqlalchemy as sa

revision = "046"
down_revision = "045"


def upgrade() -> None:
    op.add_column(
        "companies",
        sa.Column("payment_type", sa.String(30), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("companies", "payment_type")
