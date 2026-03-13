"""Create referral tables

Revision ID: 050
Revises: 049
"""
from alembic import op
import sqlalchemy as sa

revision = "050"
down_revision = "049"


def upgrade() -> None:
    op.create_table(
        "referrals",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("referrer_company_id", sa.Integer(), sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("referred_user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("referred_company_id", sa.Integer(), sa.ForeignKey("companies.id", ondelete="SET NULL"), nullable=True),
        sa.Column("commission_pct", sa.Integer(), server_default="20"),
        sa.Column("is_active", sa.Boolean(), server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("referred_user_id", name="uq_referral_per_user"),
    )

    op.create_table(
        "referral_earnings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("referral_id", sa.Integer(), sa.ForeignKey("referrals.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("payment_id", sa.Integer(), sa.ForeignKey("payments.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("commission_pct", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "referral_payouts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("company_id", sa.Integer(), sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(20), server_default="pending"),
        sa.Column("payout_method", sa.String(30), nullable=True),
        sa.Column("payout_details", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("referral_payouts")
    op.drop_table("referral_earnings")
    op.drop_table("referrals")
