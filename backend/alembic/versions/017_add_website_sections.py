"""Add website_sections table and industry_theme to companies

Revision ID: 017
Revises: 016
Create Date: 2026-01-06

This migration adds:
- industry_theme column to companies table
- website_enabled column to companies table
- website_sections table for flexible page builder
- Creates default sections for existing companies
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision: str = '017'
down_revision: Union[str, None] = '016'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add industry_theme and website_enabled columns to companies
    op.add_column('companies', sa.Column('industry_theme', sa.String(30), server_default='cosmetology', nullable=False))
    op.add_column('companies', sa.Column('website_enabled', sa.Boolean(), server_default='true', nullable=False))

    # 2. Create website_sections table
    op.create_table(
        'website_sections',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('section_type', sa.String(50), nullable=False),
        sa.Column('order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_visible', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('content', JSONB, nullable=False, server_default='{}'),
        sa.Column('style', JSONB, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_website_sections_company_id', 'website_sections', ['company_id'])
    op.create_index('ix_website_sections_order', 'website_sections', ['company_id', 'order'])

    # 3. Create default sections for existing companies
    # Hero section (order 0)
    op.execute("""
        INSERT INTO website_sections (company_id, section_type, "order", content)
        SELECT id, 'hero', 0, '{"style": "gradient"}'::jsonb FROM companies
    """)

    # Services section (order 1)
    op.execute("""
        INSERT INTO website_sections (company_id, section_type, "order", content)
        SELECT id, 'services', 1, '{"display_mode": "grid"}'::jsonb FROM companies
    """)

    # Contact section (order 2)
    op.execute("""
        INSERT INTO website_sections (company_id, section_type, "order", content)
        SELECT id, 'contact', 2, '{"show_phone": true, "show_telegram": true}'::jsonb FROM companies
    """)


def downgrade() -> None:
    # Drop website_sections table
    op.drop_index('ix_website_sections_order', 'website_sections')
    op.drop_index('ix_website_sections_company_id', 'website_sections')
    op.drop_table('website_sections')

    # Remove columns from companies
    op.drop_column('companies', 'website_enabled')
    op.drop_column('companies', 'industry_theme')
