"""Add accent_color, background_color, accent_font, body_font fields to companies

Revision ID: 018
Revises: 017
Create Date: 2026-01-06

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '018'
down_revision = '017'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new color and font columns
    op.add_column('companies', sa.Column('accent_color', sa.String(7), nullable=True))
    op.add_column('companies', sa.Column('background_color', sa.String(7), nullable=True))
    op.add_column('companies', sa.Column('accent_font', sa.String(100), nullable=True))
    op.add_column('companies', sa.Column('body_font', sa.String(100), nullable=True))

    # Migrate primary_color to accent_color where primary_color exists
    op.execute("""
        UPDATE companies
        SET accent_color = primary_color
        WHERE primary_color IS NOT NULL AND accent_color IS NULL
    """)


def downgrade() -> None:
    op.drop_column('companies', 'body_font')
    op.drop_column('companies', 'accent_font')
    op.drop_column('companies', 'background_color')
    op.drop_column('companies', 'accent_color')
