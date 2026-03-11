"""Unify service products with inventory catalog, add stock batches

- Add is_required, notes columns to service_inventory_items
- Create stock_batches table for batch-level tracking
- Add batch_id FK to stock_movements
- Migrate existing service_products to service_inventory_items
- Migrate existing INCOMING stock_movements to stock_batches

Revision ID: 040
Revises: 039
Create Date: 2026-03-04
"""
from alembic import op
import sqlalchemy as sa

revision = '040'
down_revision = '039'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Add new columns to service_inventory_items
    op.add_column('service_inventory_items', sa.Column(
        'is_required', sa.Boolean(), nullable=False, server_default='true'
    ))
    op.add_column('service_inventory_items', sa.Column(
        'notes', sa.Text(), nullable=True
    ))

    # 2. Create stock_batches table
    op.create_table(
        'stock_batches',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('company_id', sa.Integer(), nullable=False),
        sa.Column('item_id', sa.Integer(), nullable=False),
        sa.Column('batch_number', sa.String(length=100), nullable=True),
        sa.Column('purchase_price', sa.Numeric(10, 2), nullable=True),
        sa.Column('quantity_received', sa.Integer(), nullable=False),
        sa.Column('quantity_remaining', sa.Integer(), nullable=False),
        sa.Column('supplier', sa.String(length=255), nullable=True),
        sa.Column('expiry_date', sa.DateTime(), nullable=True),
        sa.Column('received_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['item_id'], ['inventory_items.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_stock_batches_item_id', 'stock_batches', ['item_id'])
    op.create_index('ix_stock_batches_company_id', 'stock_batches', ['company_id'])

    # 3. Add batch_id FK to stock_movements
    op.add_column('stock_movements', sa.Column(
        'batch_id', sa.Integer(), nullable=True
    ))
    op.create_foreign_key(
        'fk_stock_movements_batch_id',
        'stock_movements', 'stock_batches',
        ['batch_id'], ['id'],
        ondelete='SET NULL'
    )

    # 4. Migrate existing INCOMING movements to stock_batches
    # and link them back
    conn = op.get_bind()

    # Create batches from incoming movements
    incoming_movements = conn.execute(sa.text("""
        SELECT id, company_id, item_id, quantity, unit_price, batch_number, expiry_date, created_at
        FROM stock_movements
        WHERE movement_type = 'incoming' AND quantity > 0
        ORDER BY created_at ASC
    """)).fetchall()

    for mov in incoming_movements:
        # Calculate remaining: received - consumed (outgoing linked to same item after this date)
        # For simplicity, set remaining = received (will be corrected by outgoing migration below)
        result = conn.execute(sa.text("""
            INSERT INTO stock_batches (company_id, item_id, batch_number, purchase_price,
                quantity_received, quantity_remaining, expiry_date, received_at, notes)
            VALUES (:company_id, :item_id, :batch_number, :purchase_price,
                :qty, :qty, :expiry_date, :received_at, 'Мігровано з руху')
            RETURNING id
        """), {
            'company_id': mov.company_id,
            'item_id': mov.item_id,
            'batch_number': mov.batch_number,
            'purchase_price': mov.unit_price,
            'qty': mov.quantity,
            'expiry_date': mov.expiry_date,
            'received_at': mov.created_at,
        })
        batch_id = result.fetchone()[0]

        # Link incoming movement to batch
        conn.execute(sa.text("""
            UPDATE stock_movements SET batch_id = :batch_id WHERE id = :mov_id
        """), {'batch_id': batch_id, 'mov_id': mov.id})

    # Now handle outgoing movements: assign to oldest batch (FIFO) and decrement remaining
    outgoing_movements = conn.execute(sa.text("""
        SELECT id, item_id, quantity
        FROM stock_movements
        WHERE movement_type IN ('outgoing', 'sale', 'write_off') AND quantity < 0
        ORDER BY created_at ASC
    """)).fetchall()

    for mov in outgoing_movements:
        consumed = abs(mov.quantity)
        # Find oldest batch with remaining > 0 for this item
        batches = conn.execute(sa.text("""
            SELECT id, quantity_remaining FROM stock_batches
            WHERE item_id = :item_id AND quantity_remaining > 0
            ORDER BY received_at ASC
        """), {'item_id': mov.item_id}).fetchall()

        for batch in batches:
            if consumed <= 0:
                break
            take = min(consumed, batch.quantity_remaining)
            conn.execute(sa.text("""
                UPDATE stock_batches SET quantity_remaining = quantity_remaining - :take
                WHERE id = :batch_id
            """), {'take': take, 'batch_id': batch.id})

            # Link outgoing movement to batch (first one that had stock)
            if consumed == abs(mov.quantity):  # First iteration
                conn.execute(sa.text("""
                    UPDATE stock_movements SET batch_id = :batch_id WHERE id = :mov_id
                """), {'batch_id': batch.id, 'mov_id': mov.id})

            consumed -= take

    # 5. Migrate service_products to service_inventory_items
    # For each service_product, try to find matching InventoryItem by name
    service_products = conn.execute(sa.text("""
        SELECT sp.id, sp.service_id, sp.name, sp.manufacturer, sp.description,
               s.company_id
        FROM service_products sp
        JOIN services s ON sp.service_id = s.id
    """)).fetchall()

    for sp in service_products:
        # Check if already linked via service_inventory_items
        existing = conn.execute(sa.text("""
            SELECT 1 FROM service_inventory_items si
            JOIN inventory_items ii ON si.item_id = ii.id
            WHERE si.service_id = :service_id
            AND LOWER(ii.name) = LOWER(:name)
            LIMIT 1
        """), {'service_id': sp.service_id, 'name': sp.name}).fetchone()

        if existing:
            continue

        # Try to find matching inventory item
        inv_item = conn.execute(sa.text("""
            SELECT id FROM inventory_items
            WHERE company_id = :company_id
            AND LOWER(name) = LOWER(:name)
            AND parent_id IS NULL
            LIMIT 1
        """), {'company_id': sp.company_id, 'name': sp.name}).fetchone()

        if inv_item:
            item_id = inv_item.id
        else:
            # Create new inventory item
            result = conn.execute(sa.text("""
                INSERT INTO inventory_items (company_id, name, manufacturer, usage_type, unit, is_active, "order", is_default, is_available_for_sale, quantity_in_pack)
                VALUES (:company_id, :name, :manufacturer, 'internal', 'шт', true, 0, false, false, 1)
                RETURNING id
            """), {
                'company_id': sp.company_id,
                'name': sp.name,
                'manufacturer': sp.manufacturer,
            })
            item_id = result.fetchone()[0]

        # Create service_inventory_item link
        conn.execute(sa.text("""
            INSERT INTO service_inventory_items (service_id, item_id, quantity, is_required, notes)
            VALUES (:service_id, :item_id, 1, true, :notes)
        """), {
            'service_id': sp.service_id,
            'item_id': item_id,
            'notes': sp.description,
        })


def downgrade() -> None:
    # Remove batch_id from stock_movements
    op.drop_constraint('fk_stock_movements_batch_id', 'stock_movements', type_='foreignkey')
    op.drop_column('stock_movements', 'batch_id')

    # Drop stock_batches
    op.drop_index('ix_stock_batches_company_id', table_name='stock_batches')
    op.drop_index('ix_stock_batches_item_id', table_name='stock_batches')
    op.drop_table('stock_batches')

    # Remove new columns from service_inventory_items
    op.drop_column('service_inventory_items', 'notes')
    op.drop_column('service_inventory_items', 'is_required')
