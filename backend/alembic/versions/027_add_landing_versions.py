"""Add landing_versions table

Revision ID: 027
Revises: 026
Create Date: 2025-01-21
"""
from alembic import op
import sqlalchemy as sa

revision = '027'
down_revision = '026'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'landing_versions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('html', sa.Text(), nullable=False),
        sa.Column('prompt', sa.Text(), nullable=True),
        sa.Column('had_reference_image', sa.Boolean(), default=False, nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), default=False, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_landing_versions_company_id'), 'landing_versions', ['company_id'], unique=False)
    op.create_index(op.f('ix_landing_versions_is_active'), 'landing_versions', ['is_active'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_landing_versions_is_active'), table_name='landing_versions')
    op.drop_index(op.f('ix_landing_versions_company_id'), table_name='landing_versions')
    op.drop_table('landing_versions')
