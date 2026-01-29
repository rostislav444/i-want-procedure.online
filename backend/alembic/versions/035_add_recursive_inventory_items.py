"""Add recursive inventory items (parent_id, quantity_in_pack, order, is_default)

Revision ID: 035
Revises: 034
Create Date: 2025-01-29
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '035'
down_revision: Union[str, None] = '034'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Додаємо parent_id для рекурсивної структури товарів
    op.add_column(
        'inventory_items',
        sa.Column('parent_id', sa.Integer(), sa.ForeignKey('inventory_items.id', ondelete='CASCADE'), nullable=True)
    )

    # Кількість в упаковці (для варіантів типу "2 Pack")
    op.add_column(
        'inventory_items',
        sa.Column('quantity_in_pack', sa.Integer(), server_default='1', nullable=False)
    )

    # Порядок сортування варіантів
    op.add_column(
        'inventory_items',
        sa.Column('order', sa.Integer(), server_default='0', nullable=False)
    )

    # Варіант за замовчуванням
    op.add_column(
        'inventory_items',
        sa.Column('is_default', sa.Boolean(), server_default='false', nullable=False)
    )

    # Індекс для швидкого пошуку дочірніх товарів
    op.create_index('ix_inventory_items_parent_id', 'inventory_items', ['parent_id'])


def downgrade() -> None:
    op.drop_index('ix_inventory_items_parent_id', table_name='inventory_items')
    op.drop_column('inventory_items', 'is_default')
    op.drop_column('inventory_items', 'order')
    op.drop_column('inventory_items', 'quantity_in_pack')
    op.drop_column('inventory_items', 'parent_id')
