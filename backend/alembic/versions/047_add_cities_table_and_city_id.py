"""Add cities table and city_id to users/companies

Revision ID: 047
Revises: 046
"""
from alembic import op
import sqlalchemy as sa

revision = "047"
down_revision = "046"


def upgrade() -> None:
    # Create cities table
    op.create_table(
        "cities",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False, index=True),
        sa.Column("oblast", sa.String(100), nullable=False, index=True),
        sa.Column("country", sa.String(2), nullable=False, server_default="UA", index=True),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("population", sa.Integer(), nullable=True),
        sa.Column("is_regional_center", sa.Boolean(), server_default="false"),
    )

    # Add city_id and address to users
    op.add_column(
        "users",
        sa.Column("city_id", sa.Integer(), sa.ForeignKey("cities.id"), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("address", sa.String(500), nullable=True),
    )

    # Add city_id to companies
    op.add_column(
        "companies",
        sa.Column("city_id", sa.Integer(), sa.ForeignKey("cities.id"), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("companies", "city_id")
    op.drop_column("users", "address")
    op.drop_column("users", "city_id")
    op.drop_table("cities")
