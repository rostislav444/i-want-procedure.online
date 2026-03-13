"""Create education tables

Revision ID: 049
Revises: 048
"""
from alembic import op
import sqlalchemy as sa

revision = "049"
down_revision = "048"


def upgrade() -> None:
    # Education topic categories
    op.create_table(
        "education_topic_categories",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("parent_id", sa.Integer(), sa.ForeignKey("education_topic_categories.id", ondelete="CASCADE"), nullable=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("name_en", sa.String(255), nullable=True),
        sa.Column("icon", sa.String(100), nullable=True),
        sa.Column("order", sa.Integer(), server_default="0"),
        sa.Column("is_active", sa.Boolean(), server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Educator offerings
    op.create_table(
        "educator_offerings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("company_id", sa.Integer(), sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("topic_category_id", sa.Integer(), sa.ForeignKey("education_topic_categories.id", ondelete="SET NULL"), nullable=True),
        sa.Column("type", sa.String(30), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("slug", sa.String(200), nullable=False, index=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("short_description", sa.String(500), nullable=True),
        sa.Column("cover_image_url", sa.String(500), nullable=True),
        sa.Column("price", sa.Integer(), server_default="0"),
        sa.Column("currency", sa.String(3), server_default="UAH"),
        sa.Column("is_digital", sa.Boolean(), server_default="false"),
        sa.Column("digital_file_url", sa.String(500), nullable=True),
        sa.Column("prerequisites", sa.Text(), nullable=True),
        sa.Column("duration_hours", sa.Integer(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default="true"),
        sa.Column("order", sa.Integer(), server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("company_id", "slug", name="uq_offering_slug_per_company"),
    )

    # Educator events
    op.create_table(
        "educator_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("company_id", sa.Integer(), sa.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("offering_id", sa.Integer(), sa.ForeignKey("educator_offerings.id", ondelete="SET NULL"), nullable=True),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("cover_image_url", sa.String(500), nullable=True),
        # Schedule
        sa.Column("start_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_multi_day", sa.Boolean(), server_default="false"),
        sa.Column("schedule_details", sa.Text(), nullable=True),
        # Location
        sa.Column("city_id", sa.Integer(), sa.ForeignKey("cities.id"), nullable=True),
        sa.Column("venue_name", sa.String(300), nullable=True),
        sa.Column("venue_address", sa.String(500), nullable=True),
        sa.Column("is_online", sa.Boolean(), server_default="false"),
        sa.Column("online_link", sa.String(500), nullable=True),
        # Capacity & pricing
        sa.Column("price", sa.Integer(), server_default="0"),
        sa.Column("early_bird_price", sa.Integer(), nullable=True),
        sa.Column("early_bird_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("max_participants", sa.Integer(), nullable=True),
        # Status
        sa.Column("is_published", sa.Boolean(), server_default="false"),
        sa.Column("is_cancelled", sa.Boolean(), server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Event registrations
    op.create_table(
        "event_registrations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("event_id", sa.Integer(), sa.ForeignKey("educator_events.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("full_name", sa.String(300), nullable=False),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("phone", sa.String(50), nullable=True),
        sa.Column("telegram", sa.String(100), nullable=True),
        sa.Column("status", sa.String(20), server_default="pending"),
        sa.Column("amount_paid", sa.Integer(), server_default="0"),
        sa.Column("payment_external_id", sa.String(255), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("event_registrations")
    op.drop_table("educator_events")
    op.drop_table("educator_offerings")
    op.drop_table("education_topic_categories")
