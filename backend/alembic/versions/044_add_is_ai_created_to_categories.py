"""Add is_ai_created flag to global_service_categories

Revision ID: 044
Revises: 043
"""
from alembic import op
import sqlalchemy as sa

revision = "044"
down_revision = "043"


def upgrade() -> None:
    op.add_column(
        "global_service_categories",
        sa.Column("is_ai_created", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )


def downgrade() -> None:
    op.drop_column("global_service_categories", "is_ai_created")
