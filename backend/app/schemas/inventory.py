from datetime import datetime
from decimal import Decimal
from typing import Optional, Any
from pydantic import BaseModel, Field


# === Attribute Schemas ===

class AttributeCreate(BaseModel):
    name: str
    value: str
    extra_data: Optional[dict[str, Any]] = None
    order: int = 0


class AttributeUpdate(BaseModel):
    name: Optional[str] = None
    value: Optional[str] = None
    extra_data: Optional[dict[str, Any]] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None


class AttributeResponse(BaseModel):
    id: int
    group_id: int
    name: str
    value: str
    extra_data: Optional[dict[str, Any]] = None
    order: int
    is_active: bool

    class Config:
        from_attributes = True


# === Brand Schemas ===

class BrandCreate(BaseModel):
    name: str
    slug: str
    logo_url: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    order: int = 0


class BrandUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    logo_url: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None


class CollectionCreate(BaseModel):
    name: str
    slug: str
    image_url: Optional[str] = None
    description: Optional[str] = None
    order: int = 0


class CollectionUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    image_url: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None


class CollectionResponse(BaseModel):
    id: int
    brand_id: int
    name: str
    slug: str
    image_url: Optional[str] = None
    description: Optional[str] = None
    order: int
    is_active: bool
    created_at: datetime
    items_count: int = 0

    class Config:
        from_attributes = True


class BrandResponse(BaseModel):
    id: int
    company_id: int
    name: str
    slug: str
    logo_url: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    order: int
    is_active: bool
    created_at: datetime
    collections: list[CollectionResponse] = []
    items_count: int = 0

    class Config:
        from_attributes = True


# === Attribute Group Schemas ===

class AttributeGroupCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    selection_type: str = "single"  # single, multi
    value_type: str = "text"  # text, number, color, boolean
    is_filterable: bool = True
    show_in_card: bool = True
    order: int = 0
    attributes: Optional[list[AttributeCreate]] = None


class AttributeGroupUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    selection_type: Optional[str] = None
    value_type: Optional[str] = None
    is_filterable: Optional[bool] = None
    show_in_card: Optional[bool] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None


class AttributeGroupResponse(BaseModel):
    id: int
    company_id: int
    name: str
    slug: str
    description: Optional[str] = None
    selection_type: str
    value_type: str
    is_filterable: bool
    show_in_card: bool
    order: int
    is_active: bool
    attributes: list[AttributeResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True


# === Category Schemas ===

class InventoryCategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    parent_id: Optional[int] = None
    image_url: Optional[str] = None
    photo_level: Optional[int] = None
    display_type: str = "grid"
    order: int = 0
    attribute_group_ids: Optional[list[int]] = None


class InventoryCategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[int] = None
    image_url: Optional[str] = None
    photo_level: Optional[int] = None
    display_type: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None
    attribute_group_ids: Optional[list[int]] = None


class InventoryCategoryResponse(BaseModel):
    id: int
    company_id: int
    parent_id: Optional[int] = None
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    photo_level: Optional[int] = None
    display_type: str
    order: int
    is_active: bool
    created_at: datetime
    items_count: int = 0

    class Config:
        from_attributes = True


class InventoryCategoryTreeResponse(BaseModel):
    """Категория с детьми для дерева"""
    id: int
    company_id: int
    parent_id: Optional[int] = None
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    photo_level: Optional[int] = None
    display_type: str
    order: int
    is_active: bool
    created_at: datetime
    items_count: int = 0
    children: list["InventoryCategoryTreeResponse"] = []
    attribute_groups: list[AttributeGroupResponse] = []

    class Config:
        from_attributes = True


# === Item Attribute Schemas ===

class ItemAttributeCreate(BaseModel):
    attribute_id: int
    custom_value: Optional[str] = None


class ItemAttributeResponse(BaseModel):
    id: int
    attribute_id: int
    attribute_name: str = ""
    attribute_value: str = ""
    group_name: str = ""
    group_id: int = 0
    custom_value: Optional[str] = None

    class Config:
        from_attributes = True


# === Image Schema ===

class ItemImage(BaseModel):
    url: str
    is_main: bool = False


# === Inventory Item Schemas ===

class InventoryItemCreate(BaseModel):
    name: str
    category_id: Optional[int] = None
    brand_id: Optional[int] = None
    collection_id: Optional[int] = None
    parent_id: Optional[int] = None  # Батьківський товар (для варіантів)
    sku: Optional[str] = None
    barcode: Optional[str] = None
    description: Optional[str] = None
    usage_type: str = "internal"  # internal, sale, both
    purchase_price: Optional[Decimal] = None
    sale_price: Optional[Decimal] = None
    unit: str = "шт"
    min_stock_level: Optional[int] = None
    manufacturer: Optional[str] = None
    images: Optional[list[ItemImage]] = None
    attributes: Optional[list[ItemAttributeCreate]] = None
    is_available_for_sale: bool = False  # Відображати у публічному каталозі
    quantity_in_pack: int = 1  # Кількість в упаковці
    order: int = 0  # Порядок сортування
    is_default: bool = False  # Варіант за замовчуванням
    # Начальный приход
    initial_stock: Optional[int] = None
    # Варіанти при створенні батьківського товару
    variants: Optional[list["InventoryItemVariantCreate"]] = None


class InventoryItemVariantCreate(BaseModel):
    """Схема для створення варіанту разом з батьківським товаром"""
    name: str
    sku: Optional[str] = None
    barcode: Optional[str] = None
    purchase_price: Optional[Decimal] = None
    sale_price: Optional[Decimal] = None
    quantity_in_pack: int = 1
    order: int = 0
    is_default: bool = False
    initial_stock: Optional[int] = None
    images: Optional[list[ItemImage]] = None


class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[int] = None
    brand_id: Optional[int] = None
    collection_id: Optional[int] = None
    parent_id: Optional[int] = None
    sku: Optional[str] = None
    barcode: Optional[str] = None
    description: Optional[str] = None
    usage_type: Optional[str] = None
    purchase_price: Optional[Decimal] = None
    sale_price: Optional[Decimal] = None
    unit: Optional[str] = None
    min_stock_level: Optional[int] = None
    manufacturer: Optional[str] = None
    images: Optional[list[ItemImage]] = None
    is_active: Optional[bool] = None
    is_available_for_sale: Optional[bool] = None
    quantity_in_pack: Optional[int] = None
    order: Optional[int] = None
    is_default: Optional[bool] = None


class InventoryItemVariantResponse(BaseModel):
    """Відповідь для варіанту товару (дочірнього елемента)"""
    id: int
    name: str
    sku: Optional[str] = None
    barcode: Optional[str] = None
    purchase_price: Optional[Decimal] = None
    sale_price: Optional[Decimal] = None
    quantity_in_pack: int = 1
    order: int = 0
    is_default: bool = False
    is_active: bool = True
    current_stock: int = 0
    is_low_stock: bool = False
    images: Optional[list[ItemImage]] = None

    class Config:
        from_attributes = True


class InventoryItemResponse(BaseModel):
    id: int
    company_id: int
    category_id: Optional[int] = None
    brand_id: Optional[int] = None
    collection_id: Optional[int] = None
    parent_id: Optional[int] = None
    name: str
    sku: Optional[str] = None
    barcode: Optional[str] = None
    description: Optional[str] = None
    usage_type: str
    purchase_price: Optional[Decimal] = None
    sale_price: Optional[Decimal] = None
    unit: str
    min_stock_level: Optional[int] = None
    manufacturer: Optional[str] = None
    images: Optional[list[ItemImage]] = None
    is_active: bool
    is_available_for_sale: bool = False
    quantity_in_pack: int = 1
    order: int = 0
    is_default: bool = False
    created_at: datetime
    updated_at: datetime
    # Обчислювані поля
    current_stock: int = 0
    total_stock: int = 0  # Сума залишків батьківського товару + всіх варіантів
    is_low_stock: bool = False
    category_name: Optional[str] = None
    brand_name: Optional[str] = None
    collection_name: Optional[str] = None
    attributes: list[ItemAttributeResponse] = []
    # Варіанти (дочірні товари)
    variants: list[InventoryItemVariantResponse] = []
    variants_count: int = 0
    # Мінімальна та максимальна ціна серед варіантів
    min_variant_price: Optional[Decimal] = None
    max_variant_price: Optional[Decimal] = None

    class Config:
        from_attributes = True


class VariantListItem(BaseModel):
    """Скорочена версія варіанту для списку"""
    id: int
    name: str
    sale_price: Optional[Decimal] = None
    current_stock: int = 0
    is_default: bool = False
    is_low_stock: bool = False


class InventoryItemListResponse(BaseModel):
    """Скорочена версія для списку"""
    id: int
    name: str
    sku: Optional[str] = None
    barcode: Optional[str] = None
    usage_type: str
    purchase_price: Optional[Decimal] = None
    sale_price: Optional[Decimal] = None
    unit: str
    current_stock: int = 0
    total_stock: int = 0  # Сумарний залишок батьківського + всіх варіантів
    is_low_stock: bool = False
    main_image_url: Optional[str] = None
    category_name: Optional[str] = None
    category_id: Optional[int] = None
    brand_id: Optional[int] = None
    brand_name: Optional[str] = None
    collection_id: Optional[int] = None
    collection_name: Optional[str] = None
    parent_id: Optional[int] = None
    is_active: bool
    is_available_for_sale: bool = False
    quantity_in_pack: int = 1
    order: int = 0
    is_default: bool = False
    # Для батьківських товарів
    variants_count: int = 0
    min_variant_price: Optional[Decimal] = None
    max_variant_price: Optional[Decimal] = None
    variants: list[VariantListItem] = []  # Список варіантів для відображення

    class Config:
        from_attributes = True


# === Stock Movement Schemas ===

class StockMovementCreate(BaseModel):
    item_id: int
    movement_type: str  # incoming, outgoing, sale, adjustment, write_off
    quantity: int  # положительное для прихода, отрицательное для расхода
    unit_price: Optional[Decimal] = None
    appointment_id: Optional[int] = None
    notes: Optional[str] = None
    batch_number: Optional[str] = None
    expiry_date: Optional[datetime] = None


class StockMovementResponse(BaseModel):
    id: int
    company_id: int
    item_id: int
    item_name: str = ""
    movement_type: str
    quantity: int
    unit_price: Optional[Decimal] = None
    appointment_id: Optional[int] = None
    performed_by: Optional[int] = None
    performed_by_name: Optional[str] = None
    notes: Optional[str] = None
    batch_number: Optional[str] = None
    expiry_date: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# === Service Inventory Item Schemas ===

class ServiceInventoryItemCreate(BaseModel):
    item_id: int
    quantity: int = 1


class ServiceInventoryItemResponse(BaseModel):
    id: int
    service_id: int
    item_id: int
    item_name: str = ""
    quantity: int
    current_stock: int = 0
    unit: str = "шт"
    created_at: datetime

    class Config:
        from_attributes = True


# === Stats Schemas ===

class InventoryStats(BaseModel):
    total_items: int = 0
    low_stock_items: int = 0
    total_value: Decimal = Decimal("0")
    items_for_sale: int = 0
    items_internal: int = 0


# === Pagination Schemas ===

class PaginatedItemsResponse(BaseModel):
    items: list[InventoryItemListResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# Resolve forward references
InventoryCategoryTreeResponse.model_rebuild()
InventoryItemCreate.model_rebuild()
