"""switch services to global categories directly

Revision ID: 043
Revises: 042
Create Date: 2026-03-11
"""
from alembic import op
import sqlalchemy as sa

revision = '043'
down_revision = '042'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add global_category_id directly to services
    op.add_column('services', sa.Column(
        'global_category_id', sa.Integer(),
        sa.ForeignKey('global_service_categories.id', ondelete='SET NULL'),
        nullable=True
    ))

    # Migrate: copy global_category_id from service_categories to services
    op.execute("""
        UPDATE services s
        SET global_category_id = sc.global_category_id
        FROM service_categories sc
        WHERE s.category_id = sc.id
        AND sc.global_category_id IS NOT NULL
    """)


def downgrade() -> None:
    op.drop_column('services', 'global_category_id')
