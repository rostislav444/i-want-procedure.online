"""Add specialties table and user_specialties relationship

Revision ID: 013
Revises: 012
Create Date: 2026-01-06

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '013'
down_revision: Union[str, None] = '012'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create specialties table
    op.create_table(
        'specialties',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('color', sa.String(7), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_specialties_company_id'), 'specialties', ['company_id'], unique=False)

    # Create user_specialties many-to-many table
    op.create_table(
        'user_specialties',
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('specialty_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['specialty_id'], ['specialties.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id', 'specialty_id')
    )

    # Add specialty_id to services table
    op.add_column('services', sa.Column('specialty_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_services_specialty_id',
        'services', 'specialties',
        ['specialty_id'], ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    op.drop_constraint('fk_services_specialty_id', 'services', type_='foreignkey')
    op.drop_column('services', 'specialty_id')
    op.drop_table('user_specialties')
    op.drop_index(op.f('ix_specialties_company_id'), table_name='specialties')
    op.drop_table('specialties')
