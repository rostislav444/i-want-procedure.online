"""Add promo_video_url and content_url to educator_offerings.

Revision ID: 052
Revises: 051
Create Date: 2026-03-11
"""

from alembic import op
import sqlalchemy as sa

revision = "052"
down_revision = "051"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "educator_offerings",
        sa.Column("promo_video_url", sa.String(500), nullable=True),
    )
    op.add_column(
        "educator_offerings",
        sa.Column("content_url", sa.String(500), nullable=True),
    )


def downgrade():
    op.drop_column("educator_offerings", "content_url")
    op.drop_column("educator_offerings", "promo_video_url")
