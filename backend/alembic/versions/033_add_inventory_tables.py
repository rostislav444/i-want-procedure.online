"""Add inventory management tables

Revision ID: 033
Revises: 032
Create Date: 2025-01-29
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '033'
down_revision: Union[str, None] = '032'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Inventory Categories (recursive)
    op.create_table(
        'inventory_categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('parent_id', sa.Integer(), nullable=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('slug', sa.String(255), nullable=True),
        sa.Column('image_url', sa.String(500), nullable=True),
        sa.Column('photo_level', sa.Integer(), nullable=True),
        sa.Column('display_type', sa.String(50), server_default='grid', nullable=False),
        sa.Column('order', sa.Integer(), server_default='0', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['parent_id'], ['inventory_categories.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_inventory_categories_company_id', 'inventory_categories', ['company_id'])
    op.create_index('ix_inventory_categories_parent_id', 'inventory_categories', ['parent_id'])

    # 2. Attribute Groups
    op.create_table(
        'attribute_groups',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('slug', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('selection_type', sa.String(50), server_default='single', nullable=False),
        sa.Column('value_type', sa.String(50), server_default='text', nullable=False),
        sa.Column('is_filterable', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('show_in_card', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('order', sa.Integer(), server_default='0', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_attribute_groups_company_id', 'attribute_groups', ['company_id'])

    # 3. Attributes
    op.create_table(
        'attributes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('group_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('value', sa.String(255), nullable=False),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('order', sa.Integer(), server_default='0', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.ForeignKeyConstraint(['group_id'], ['attribute_groups.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_attributes_group_id', 'attributes', ['group_id'])

    # 4. Category-AttributeGroup link table
    op.create_table(
        'category_attribute_groups',
        sa.Column('category_id', sa.Integer(), nullable=False),
        sa.Column('group_id', sa.Integer(), nullable=False),
        sa.Column('is_required', sa.Boolean(), server_default='false', nullable=False),
        sa.ForeignKeyConstraint(['category_id'], ['inventory_categories.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['group_id'], ['attribute_groups.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('category_id', 'group_id')
    )

    # 5. Inventory Items
    op.create_table(
        'inventory_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('sku', sa.String(100), nullable=True),
        sa.Column('barcode', sa.String(100), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('usage_type', sa.String(50), server_default='internal', nullable=False),
        sa.Column('purchase_price', sa.Numeric(10, 2), nullable=True),
        sa.Column('sale_price', sa.Numeric(10, 2), nullable=True),
        sa.Column('unit', sa.String(50), server_default='шт', nullable=False),
        sa.Column('min_stock_level', sa.Integer(), nullable=True),
        sa.Column('images', sa.JSON(), nullable=True),
        sa.Column('manufacturer', sa.String(255), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['category_id'], ['inventory_categories.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_inventory_items_company_id', 'inventory_items', ['company_id'])
    op.create_index('ix_inventory_items_category_id', 'inventory_items', ['category_id'])
    op.create_index('ix_inventory_items_sku', 'inventory_items', ['sku'])
    op.create_index('ix_inventory_items_barcode', 'inventory_items', ['barcode'])

    # 6. Item-Attribute link table
    op.create_table(
        'inventory_item_attributes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('item_id', sa.Integer(), nullable=False),
        sa.Column('attribute_id', sa.Integer(), nullable=False),
        sa.Column('custom_value', sa.String(255), nullable=True),
        sa.ForeignKeyConstraint(['item_id'], ['inventory_items.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['attribute_id'], ['attributes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_inventory_item_attributes_item_id', 'inventory_item_attributes', ['item_id'])

    # 7. Stock Movements
    op.create_table(
        'stock_movements',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('item_id', sa.Integer(), nullable=False),
        sa.Column('movement_type', sa.String(50), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('unit_price', sa.Numeric(10, 2), nullable=True),
        sa.Column('appointment_id', sa.Integer(), nullable=True),
        sa.Column('performed_by', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('batch_number', sa.String(100), nullable=True),
        sa.Column('expiry_date', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['item_id'], ['inventory_items.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['appointment_id'], ['appointments.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['performed_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_stock_movements_company_id', 'stock_movements', ['company_id'])
    op.create_index('ix_stock_movements_item_id', 'stock_movements', ['item_id'])
    op.create_index('ix_stock_movements_created_at', 'stock_movements', ['created_at'])

    # 8. Service-InventoryItem link table (for auto-deduction)
    op.create_table(
        'service_inventory_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('service_id', sa.Integer(), nullable=False),
        sa.Column('item_id', sa.Integer(), nullable=False),
        sa.Column('quantity', sa.Integer(), server_default='1', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['service_id'], ['services.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['item_id'], ['inventory_items.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_service_inventory_items_service_id', 'service_inventory_items', ['service_id'])
    op.create_index('ix_service_inventory_items_item_id', 'service_inventory_items', ['item_id'])


def downgrade() -> None:
    op.drop_index('ix_service_inventory_items_item_id', table_name='service_inventory_items')
    op.drop_index('ix_service_inventory_items_service_id', table_name='service_inventory_items')
    op.drop_table('service_inventory_items')

    op.drop_index('ix_stock_movements_created_at', table_name='stock_movements')
    op.drop_index('ix_stock_movements_item_id', table_name='stock_movements')
    op.drop_index('ix_stock_movements_company_id', table_name='stock_movements')
    op.drop_table('stock_movements')

    op.drop_index('ix_inventory_item_attributes_item_id', table_name='inventory_item_attributes')
    op.drop_table('inventory_item_attributes')

    op.drop_index('ix_inventory_items_barcode', table_name='inventory_items')
    op.drop_index('ix_inventory_items_sku', table_name='inventory_items')
    op.drop_index('ix_inventory_items_category_id', table_name='inventory_items')
    op.drop_index('ix_inventory_items_company_id', table_name='inventory_items')
    op.drop_table('inventory_items')

    op.drop_table('category_attribute_groups')

    op.drop_index('ix_attributes_group_id', table_name='attributes')
    op.drop_table('attributes')

    op.drop_index('ix_attribute_groups_company_id', table_name='attribute_groups')
    op.drop_table('attribute_groups')

    op.drop_index('ix_inventory_categories_parent_id', table_name='inventory_categories')
    op.drop_index('ix_inventory_categories_company_id', table_name='inventory_categories')
    op.drop_table('inventory_categories')
