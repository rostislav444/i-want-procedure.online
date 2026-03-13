"""add educator profile social/bio fields

Revision ID: 055
Revises: 054
Create Date: 2026-03-11
"""
from alembic import op
import sqlalchemy as sa

revision = '055'
down_revision = '054'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('companies', sa.Column('instagram_url', sa.String(500), nullable=True))
    op.add_column('companies', sa.Column('youtube_url', sa.String(500), nullable=True))
    op.add_column('companies', sa.Column('website_url', sa.String(500), nullable=True))
    op.add_column('companies', sa.Column('bio', sa.Text(), nullable=True))
    op.add_column('companies', sa.Column('students_count', sa.Integer(), nullable=False, server_default='0'))


def downgrade():
    op.drop_column('companies', 'students_count')
    op.drop_column('companies', 'bio')
    op.drop_column('companies', 'website_url')
    op.drop_column('companies', 'youtube_url')
    op.drop_column('companies', 'instagram_url')
