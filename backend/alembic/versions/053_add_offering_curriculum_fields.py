"""add offering curriculum fields

Revision ID: 053
Revises: 052
Create Date: 2026-03-11
"""
from alembic import op
import sqlalchemy as sa

revision = '053'
down_revision = '052'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('educator_offerings', sa.Column('learning_outcomes', sa.Text(), nullable=True))
    op.add_column('educator_offerings', sa.Column('target_audience', sa.Text(), nullable=True))
    op.add_column('educator_offerings', sa.Column('level', sa.String(20), nullable=True))
    op.add_column('educator_offerings', sa.Column('curriculum', sa.Text(), nullable=True))
    op.add_column('educator_offerings', sa.Column('language', sa.String(10), nullable=False, server_default='uk'))
    op.add_column('educator_offerings', sa.Column('certificate_included', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('educator_offerings', sa.Column('what_includes', sa.Text(), nullable=True))


def downgrade():
    op.drop_column('educator_offerings', 'what_includes')
    op.drop_column('educator_offerings', 'certificate_included')
    op.drop_column('educator_offerings', 'language')
    op.drop_column('educator_offerings', 'curriculum')
    op.drop_column('educator_offerings', 'level')
    op.drop_column('educator_offerings', 'target_audience')
    op.drop_column('educator_offerings', 'learning_outcomes')
