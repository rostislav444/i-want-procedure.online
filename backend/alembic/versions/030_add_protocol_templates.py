"""Add protocol templates table

Revision ID: 030
Revises: 029
Create Date: 2025-01-29

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '030'
down_revision: Union[str, None] = '029'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create protocol_templates table
    op.create_table(
        'protocol_templates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=True),
        sa.Column('service_id', sa.Integer(), nullable=True),
        sa.Column('category_id', sa.Integer(), nullable=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('sections', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('is_default', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_system', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('tags', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['service_id'], ['services.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['category_id'], ['service_categories.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_protocol_templates_company_id', 'protocol_templates', ['company_id'])
    op.create_index('ix_protocol_templates_service_id', 'protocol_templates', ['service_id'])
    op.create_index('ix_protocol_templates_category_id', 'protocol_templates', ['category_id'])

    # Add template_id and template_data columns to procedure_protocols
    op.add_column('procedure_protocols', sa.Column('template_id', sa.Integer(), nullable=True))
    op.add_column('procedure_protocols', sa.Column('template_data', sa.JSON(), nullable=True))
    op.create_foreign_key(
        'fk_procedure_protocols_template_id',
        'procedure_protocols',
        'protocol_templates',
        ['template_id'],
        ['id'],
        ondelete='SET NULL'
    )
    op.create_index('ix_procedure_protocols_template_id', 'procedure_protocols', ['template_id'])


def downgrade() -> None:
    # Remove template_id from procedure_protocols
    op.drop_index('ix_procedure_protocols_template_id', table_name='procedure_protocols')
    op.drop_constraint('fk_procedure_protocols_template_id', 'procedure_protocols', type_='foreignkey')
    op.drop_column('procedure_protocols', 'template_data')
    op.drop_column('procedure_protocols', 'template_id')

    # Drop protocol_templates table
    op.drop_index('ix_protocol_templates_category_id', table_name='protocol_templates')
    op.drop_index('ix_protocol_templates_service_id', table_name='protocol_templates')
    op.drop_index('ix_protocol_templates_company_id', table_name='protocol_templates')
    op.drop_table('protocol_templates')
