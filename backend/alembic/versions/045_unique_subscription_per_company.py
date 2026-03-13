"""Add unique constraint on subscriptions.company_id

Revision ID: 045
Revises: 044
"""
from alembic import op

revision = "045"
down_revision = "044"


def upgrade() -> None:
    # Remove duplicates first (keep the latest)
    op.execute("""
        DELETE FROM subscriptions
        WHERE id NOT IN (
            SELECT DISTINCT ON (company_id) id
            FROM subscriptions
            ORDER BY company_id, created_at DESC
        )
    """)
    op.create_unique_constraint("uq_subscriptions_company_id", "subscriptions", ["company_id"])


def downgrade() -> None:
    op.drop_constraint("uq_subscriptions_company_id", "subscriptions", type_="unique")
