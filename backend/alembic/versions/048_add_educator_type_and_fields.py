"""Add educator company type and fields

Revision ID: 048
Revises: 047
"""
from alembic import op
import sqlalchemy as sa

revision = "048"
down_revision = "047"


def upgrade() -> None:
    # Add educator-specific columns to companies
    op.add_column("companies", sa.Column("educator_tagline", sa.String(300), nullable=True))
    op.add_column("companies", sa.Column("educator_credentials", sa.Text(), nullable=True))
    op.add_column("companies", sa.Column("educator_video_url", sa.String(500), nullable=True))
    op.add_column("companies", sa.Column("referral_code", sa.String(50), nullable=True))
    op.add_column("companies", sa.Column("referral_commission_pct", sa.Integer(), server_default="20", nullable=False))
    op.create_index("ix_companies_referral_code", "companies", ["referral_code"], unique=True)

    # Add referred_by_company_id to users
    op.add_column(
        "users",
        sa.Column("referred_by_company_id", sa.Integer(), sa.ForeignKey("companies.id", ondelete="SET NULL"), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "referred_by_company_id")
    op.drop_index("ix_companies_referral_code", table_name="companies")
    op.drop_column("companies", "referral_commission_pct")
    op.drop_column("companies", "referral_code")
    op.drop_column("companies", "educator_video_url")
    op.drop_column("companies", "educator_credentials")
    op.drop_column("companies", "educator_tagline")
