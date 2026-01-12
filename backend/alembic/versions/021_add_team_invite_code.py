"""Add team_invite_code to companies

Revision ID: 021
Revises: 020
Create Date: 2026-01-08

This migration adds:
- team_invite_code column for inviting specialists to join a clinic
"""
import secrets
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '021'
down_revision: Union[str, None] = '020'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def generate_invite_code() -> str:
    return secrets.token_urlsafe(8)


def upgrade() -> None:
    # Add column as nullable first
    op.add_column('companies', sa.Column('team_invite_code', sa.String(20), nullable=True))

    # Generate unique codes for existing companies
    connection = op.get_bind()
    companies = connection.execute(sa.text("SELECT id FROM companies")).fetchall()
    for company in companies:
        code = generate_invite_code()
        # Make sure code is unique
        while connection.execute(
            sa.text("SELECT 1 FROM companies WHERE team_invite_code = :code"),
            {"code": code}
        ).fetchone():
            code = generate_invite_code()
        connection.execute(
            sa.text("UPDATE companies SET team_invite_code = :code WHERE id = :id"),
            {"code": code, "id": company[0]}
        )

    # Make column not nullable and add constraints
    op.alter_column('companies', 'team_invite_code', nullable=False)
    op.create_index('ix_companies_team_invite_code', 'companies', ['team_invite_code'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_companies_team_invite_code', table_name='companies')
    op.drop_column('companies', 'team_invite_code')
