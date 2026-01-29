"""Add section templates table

Revision ID: 025
Revises: 024_company_members_refactor
Create Date: 2025-01-21
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '025_section_templates'
down_revision = '024'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'section_templates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('section_type', sa.String(50), nullable=False, server_default='hero'),
        sa.Column('html_template', sa.Text(), nullable=False),
        sa.Column('variables_schema', sa.JSON(), nullable=False, server_default='{}'),
        sa.Column('preview_image_url', sa.String(500), nullable=True),
        sa.Column('source_image_url', sa.String(500), nullable=True),
        sa.Column('is_system', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_by_id', sa.Integer(), nullable=True),
        sa.Column('tags', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_section_templates_section_type', 'section_templates', ['section_type'])
    op.create_index('ix_section_templates_is_system', 'section_templates', ['is_system'])


def downgrade() -> None:
    op.drop_index('ix_section_templates_is_system')
    op.drop_index('ix_section_templates_section_type')
    op.drop_table('section_templates')
