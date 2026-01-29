"""Add procedure protocols tables

Revision ID: 029
Revises: 028
Create Date: 2025-01-29

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '029'
down_revision: Union[str, None] = '028'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create procedure_protocols table
    op.create_table(
        'procedure_protocols',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('appointment_id', sa.Integer(), nullable=False),
        sa.Column('specialist_id', sa.Integer(), nullable=True),
        sa.Column('skin_condition', sa.Text(), nullable=True),
        sa.Column('complaints', sa.Text(), nullable=True),
        sa.Column('procedure_notes', sa.Text(), nullable=True),
        sa.Column('technique_used', sa.String(500), nullable=True),
        sa.Column('results', sa.Text(), nullable=True),
        sa.Column('recommendations', sa.Text(), nullable=True),
        sa.Column('next_visit_notes', sa.Text(), nullable=True),
        sa.Column('photos_before', sa.JSON(), nullable=True),
        sa.Column('photos_after', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['appointment_id'], ['appointments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['specialist_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('appointment_id')
    )
    op.create_index('ix_procedure_protocols_appointment_id', 'procedure_protocols', ['appointment_id'])

    # Create protocol_products table
    op.create_table(
        'protocol_products',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('protocol_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('manufacturer', sa.String(255), nullable=True),
        sa.Column('quantity', sa.String(100), nullable=True),
        sa.Column('batch_number', sa.String(100), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['protocol_id'], ['procedure_protocols.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_protocol_products_protocol_id', 'protocol_products', ['protocol_id'])


def downgrade() -> None:
    op.drop_index('ix_protocol_products_protocol_id', table_name='protocol_products')
    op.drop_table('protocol_products')
    op.drop_index('ix_procedure_protocols_appointment_id', table_name='procedure_protocols')
    op.drop_table('procedure_protocols')
