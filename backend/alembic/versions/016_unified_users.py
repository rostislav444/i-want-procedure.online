"""Add user roles, profiles tables and appointment profile references

Revision ID: 016
Revises: 015
Create Date: 2026-01-06

This migration adds:
- user_roles table (many-to-many roles)
- specialist_profiles table
- manager_profiles table
- client_profiles table
- specialist_profile_id and client_profile_id columns to appointments
- Migrates existing users to have specialist role and profile
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '016'
down_revision: Union[str, None] = '015'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create user_roles table
    op.create_table(
        'user_roles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('role', sa.String(20), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_user_roles_user_id', 'user_roles', ['user_id'])
    op.create_index('ix_user_roles_role', 'user_roles', ['role'])

    # 2. Create specialist_profiles table
    op.create_table(
        'specialist_profiles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('position', sa.String(100), nullable=True),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'company_id', name='uq_specialist_user_company')
    )
    op.create_index('ix_specialist_profiles_user_id', 'specialist_profiles', ['user_id'])
    op.create_index('ix_specialist_profiles_company_id', 'specialist_profiles', ['company_id'])

    # 3. Create manager_profiles table
    op.create_table(
        'manager_profiles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('can_edit_services', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('can_manage_specialists', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('can_view_finances', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'company_id', name='uq_manager_user_company')
    )
    op.create_index('ix_manager_profiles_user_id', 'manager_profiles', ['user_id'])
    op.create_index('ix_manager_profiles_company_id', 'manager_profiles', ['company_id'])

    # 4. Create client_profiles table
    op.create_table(
        'client_profiles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('tags', sa.String(500), nullable=True),
        sa.Column('source', sa.String(50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'company_id', name='uq_client_user_company')
    )
    op.create_index('ix_client_profiles_user_id', 'client_profiles', ['user_id'])
    op.create_index('ix_client_profiles_company_id', 'client_profiles', ['company_id'])

    # 5. Add profile references to appointments
    op.add_column('appointments', sa.Column('specialist_profile_id', sa.Integer(), nullable=True))
    op.add_column('appointments', sa.Column('client_profile_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_appointments_specialist_profile',
        'appointments', 'specialist_profiles',
        ['specialist_profile_id'], ['id'],
        ondelete='SET NULL'
    )
    op.create_foreign_key(
        'fk_appointments_client_profile',
        'appointments', 'client_profiles',
        ['client_profile_id'], ['id'],
        ondelete='SET NULL'
    )

    # 6. Migrate existing users to user_roles table
    # All existing users get 'specialist' role
    op.execute("""
        INSERT INTO user_roles (user_id, role)
        SELECT id, 'specialist' FROM users WHERE company_id IS NOT NULL
    """)

    # Users with is_superadmin=true also get 'superadmin' role
    op.execute("""
        INSERT INTO user_roles (user_id, role)
        SELECT id, 'superadmin' FROM users WHERE is_superadmin = true
    """)

    # 7. Create specialist_profiles for existing users with company_id
    op.execute("""
        INSERT INTO specialist_profiles (user_id, company_id, created_at)
        SELECT id, company_id, created_at FROM users WHERE company_id IS NOT NULL
    """)

    # 8. Update appointments with specialist_profile_id
    op.execute("""
        UPDATE appointments a
        SET specialist_profile_id = sp.id
        FROM specialist_profiles sp
        WHERE a.doctor_id = sp.user_id AND a.company_id = sp.company_id
    """)


def downgrade() -> None:
    # Remove FK constraints first
    op.drop_constraint('fk_appointments_client_profile', 'appointments', type_='foreignkey')
    op.drop_constraint('fk_appointments_specialist_profile', 'appointments', type_='foreignkey')

    # Remove columns from appointments
    op.drop_column('appointments', 'client_profile_id')
    op.drop_column('appointments', 'specialist_profile_id')

    # Drop profile tables
    op.drop_table('client_profiles')
    op.drop_table('manager_profiles')
    op.drop_table('specialist_profiles')
    op.drop_table('user_roles')
