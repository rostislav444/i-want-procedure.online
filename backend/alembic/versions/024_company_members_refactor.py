"""Company Members Refactor

Revision ID: 024
Revises: 023
Create Date: 2026-01-12

This migration:
1. Creates company_members table (unified profile for owners, managers, specialists)
2. Creates member_services table (links specialists to their services)
3. Adds member_id to appointments
4. Migrates data from specialist_profiles
5. Removes old role field from users
6. Removes old profile tables
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '024'
down_revision: Union[str, None] = '023'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create company_members table
    op.create_table(
        'company_members',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('position_id', sa.Integer(), nullable=True),
        sa.Column('is_owner', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('is_manager', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('is_specialist', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('photo_url', sa.String(500), nullable=True),
        sa.Column('can_edit_services', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('can_manage_team', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('can_view_finances', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['position_id'], ['positions.id'], ondelete='SET NULL'),
        sa.UniqueConstraint('user_id', 'company_id', name='uq_company_member')
    )
    op.create_index('ix_company_members_user_id', 'company_members', ['user_id'])
    op.create_index('ix_company_members_company_id', 'company_members', ['company_id'])

    # 2. Create member_services table
    op.create_table(
        'member_services',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('member_id', sa.Integer(), nullable=False),
        sa.Column('service_id', sa.Integer(), nullable=False),
        sa.Column('custom_price', sa.Numeric(10, 2), nullable=True),
        sa.Column('custom_duration_minutes', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['member_id'], ['company_members.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['service_id'], ['services.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('member_id', 'service_id', name='uq_member_service')
    )
    op.create_index('ix_member_services_member_id', 'member_services', ['member_id'])
    op.create_index('ix_member_services_service_id', 'member_services', ['service_id'])

    # 3. Add member_id to appointments
    op.add_column('appointments', sa.Column('member_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_appointments_member_id',
        'appointments', 'company_members',
        ['member_id'], ['id'],
        ondelete='SET NULL'
    )

    # 4. Migrate data from users with company_id (they were specialists/owners)
    # Each user with company_id becomes a member with is_owner=true, is_specialist=true
    op.execute("""
        INSERT INTO company_members (user_id, company_id, is_owner, is_manager, is_specialist, is_active)
        SELECT u.id, u.company_id, true, true, true, u.is_active
        FROM users u
        WHERE u.company_id IS NOT NULL
        ON CONFLICT (user_id, company_id) DO NOTHING
    """)

    # 5. Migrate specialist_profiles data into company_members if not already migrated
    # Note: photo_url column may not exist in specialist_profiles, so we skip it
    op.execute("""
        INSERT INTO company_members (user_id, company_id, position_id, is_specialist, bio, is_active)
        SELECT sp.user_id, sp.company_id, sp.position_id, true, sp.bio, sp.is_active
        FROM specialist_profiles sp
        WHERE NOT EXISTS (
            SELECT 1 FROM company_members cm
            WHERE cm.user_id = sp.user_id AND cm.company_id = sp.company_id
        )
        ON CONFLICT (user_id, company_id) DO UPDATE SET
            position_id = EXCLUDED.position_id,
            bio = COALESCE(EXCLUDED.bio, company_members.bio),
            is_specialist = true
    """)

    # 6. Migrate specialist_services to member_services
    op.execute("""
        INSERT INTO member_services (member_id, service_id, custom_price, custom_duration_minutes, is_active)
        SELECT cm.id, ss.service_id, ss.custom_price, ss.custom_duration_minutes, ss.is_active
        FROM specialist_services ss
        JOIN specialist_profiles sp ON sp.id = ss.specialist_profile_id
        JOIN company_members cm ON cm.user_id = sp.user_id AND cm.company_id = sp.company_id
        ON CONFLICT (member_id, service_id) DO NOTHING
    """)

    # 7. Update appointments.member_id from specialist_profile_id
    op.execute("""
        UPDATE appointments a
        SET member_id = cm.id
        FROM specialist_profiles sp
        JOIN company_members cm ON cm.user_id = sp.user_id AND cm.company_id = sp.company_id
        WHERE a.specialist_profile_id = sp.id
    """)

    # 8. For appointments without specialist_profile_id, try to match by doctor_id
    op.execute("""
        UPDATE appointments a
        SET member_id = cm.id
        FROM company_members cm
        WHERE a.member_id IS NULL
        AND a.doctor_id = cm.user_id
        AND a.company_id = cm.company_id
    """)

    # 9. Remove old columns from users table
    # First drop the foreign key constraint if exists
    try:
        op.drop_constraint('users_company_id_fkey', 'users', type_='foreignkey')
    except:
        pass
    op.drop_column('users', 'company_id')
    op.drop_column('users', 'role')

    # 10. Drop old profile tables and related
    op.drop_table('specialist_services')
    op.drop_table('specialist_profiles')
    op.drop_table('manager_profiles')
    op.drop_table('client_profiles')
    op.drop_table('user_roles')

    # 11. Remove old columns from appointments
    try:
        op.drop_constraint('appointments_specialist_profile_id_fkey', 'appointments', type_='foreignkey')
    except:
        pass
    try:
        op.drop_constraint('appointments_client_profile_id_fkey', 'appointments', type_='foreignkey')
    except:
        pass
    op.drop_column('appointments', 'specialist_profile_id')
    op.drop_column('appointments', 'client_profile_id')


def downgrade() -> None:
    # This is a major refactor, downgrade is complex
    # Re-create old tables first
    op.create_table(
        'user_roles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('role', sa.String(20), nullable=False),
        sa.Column('is_primary', sa.Boolean(), server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )

    op.create_table(
        'specialist_profiles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('photo_url', sa.String(500), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('position_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
    )

    op.create_table(
        'manager_profiles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('can_edit_services', sa.Boolean(), server_default='true'),
        sa.Column('can_manage_team', sa.Boolean(), server_default='true'),
        sa.Column('can_view_finances', sa.Boolean(), server_default='false'),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
    )

    op.create_table(
        'client_profiles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
    )

    op.create_table(
        'specialist_services',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('specialist_id', sa.Integer(), nullable=False),
        sa.Column('service_id', sa.Integer(), nullable=False),
        sa.Column('custom_price', sa.Numeric(10, 2), nullable=True),
        sa.Column('custom_duration_minutes', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['specialist_id'], ['specialist_profiles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['service_id'], ['services.id'], ondelete='CASCADE'),
    )

    # Re-add columns to users
    op.add_column('users', sa.Column('company_id', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('role', sa.String(20), nullable=True))

    # Re-add columns to appointments
    op.add_column('appointments', sa.Column('specialist_profile_id', sa.Integer(), nullable=True))
    op.add_column('appointments', sa.Column('client_profile_id', sa.Integer(), nullable=True))

    # Drop new tables
    op.drop_constraint('fk_appointments_member_id', 'appointments', type_='foreignkey')
    op.drop_column('appointments', 'member_id')
    op.drop_table('member_services')
    op.drop_table('company_members')
