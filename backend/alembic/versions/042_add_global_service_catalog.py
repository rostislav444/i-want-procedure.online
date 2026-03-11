"""add global service catalog

Revision ID: 042
Revises: 041
Create Date: 2026-03-11
"""
from alembic import op
import sqlalchemy as sa

revision = '042'
down_revision = '041'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Global service categories (marketplace catalog)
    op.create_table(
        'global_service_categories',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('parent_id', sa.Integer(), sa.ForeignKey('global_service_categories.id', ondelete='CASCADE'), nullable=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('name_en', sa.String(255), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('icon', sa.String(100), nullable=True),
        sa.Column('order', sa.Integer(), default=0, nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), default=True, nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Global service templates (procedure dictionary)
    op.create_table(
        'global_service_templates',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('category_id', sa.Integer(), sa.ForeignKey('global_service_categories.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('name_en', sa.String(255), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('default_duration_minutes', sa.Integer(), default=60, nullable=False, server_default='60'),
        sa.Column('is_active', sa.Boolean(), default=True, nullable=False, server_default='true'),
        sa.Column('order', sa.Integer(), default=0, nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Link service_categories to global catalog
    op.add_column('service_categories', sa.Column(
        'global_category_id', sa.Integer(),
        sa.ForeignKey('global_service_categories.id', ondelete='SET NULL'),
        nullable=True
    ))
    op.add_column('service_categories', sa.Column(
        'is_custom', sa.Boolean(), server_default='false', nullable=False
    ))

    # Link services to global templates
    op.add_column('services', sa.Column(
        'global_template_id', sa.Integer(),
        sa.ForeignKey('global_service_templates.id', ondelete='SET NULL'),
        nullable=True
    ))
    op.add_column('services', sa.Column(
        'is_custom', sa.Boolean(), server_default='false', nullable=False
    ))


def downgrade() -> None:
    op.drop_column('services', 'is_custom')
    op.drop_column('services', 'global_template_id')
    op.drop_column('service_categories', 'is_custom')
    op.drop_column('service_categories', 'global_category_id')
    op.drop_table('global_service_templates')
    op.drop_table('global_service_categories')
