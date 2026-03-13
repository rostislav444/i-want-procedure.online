"""Add offering questions table

Revision ID: 056
Revises: 055
Create Date: 2026-03-12
"""
from alembic import op
import sqlalchemy as sa

revision = '056'
down_revision = '055'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'offering_questions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('offering_id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('visitor_name', sa.String(200), nullable=False),
        sa.Column('visitor_email', sa.String(200), nullable=True),
        sa.Column('question', sa.Text(), nullable=False),
        sa.Column('answer', sa.Text(), nullable=True),
        sa.Column('is_answered', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_visible', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('answered_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['offering_id'], ['educator_offerings.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_offering_questions_offering_id', 'offering_questions', ['offering_id'])
    op.create_index('ix_offering_questions_company_id', 'offering_questions', ['company_id'])


def downgrade():
    op.drop_table('offering_questions')
