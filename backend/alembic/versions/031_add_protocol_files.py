"""Add protocol_files table for storing procedure photos

Revision ID: 031
Revises: 030
Create Date: 2025-01-29
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '031'
down_revision: Union[str, None] = '030'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'protocol_files',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('protocol_id', sa.Integer(), nullable=True),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('file_type', sa.String(length=20), nullable=False),
        sa.Column('filename', sa.String(length=255), nullable=False),
        sa.Column('original_filename', sa.String(length=255), nullable=False),
        sa.Column('file_path', sa.String(length=500), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('mime_type', sa.String(length=100), nullable=False),
        sa.Column('uploaded_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['protocol_id'], ['procedure_protocols.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['uploaded_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_protocol_files_protocol_id', 'protocol_files', ['protocol_id'])
    op.create_index('ix_protocol_files_company_id', 'protocol_files', ['company_id'])


def downgrade() -> None:
    op.drop_index('ix_protocol_files_company_id', table_name='protocol_files')
    op.drop_index('ix_protocol_files_protocol_id', table_name='protocol_files')
    op.drop_table('protocol_files')
