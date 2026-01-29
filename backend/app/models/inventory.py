from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import TYPE_CHECKING, Optional

from sqlalchemy import String, DateTime, ForeignKey, Integer, Numeric, Boolean, Text, JSON, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.company import Company
    from app.models.user import User
    from app.models.appointment import Appointment
    from app.models.service import Service


class UsageType(str, Enum):
    """Тип использования товара"""
    INTERNAL = "internal"  # Для внутреннего использования
    SALE = "sale"  # Для продажи
    BOTH = "both"  # Универсальный


class MovementType(str, Enum):
    """Тип движения товара"""
    INCOMING = "incoming"  # Приход (закупка)
    OUTGOING = "outgoing"  # Расход (использовано)
    SALE = "sale"  # Продажа клиенту
    ADJUSTMENT = "adjustment"  # Корректировка (инвентаризация)
    WRITE_OFF = "write_off"  # Списание


class SelectionType(str, Enum):
    """Тип выбора атрибутов"""
    SINGLE = "single"  # Один вариант (радио)
    MULTI = "multi"  # Несколько вариантов (чекбоксы)


class ValueType(str, Enum):
    """Тип значений атрибутов"""
    TEXT = "text"
    NUMBER = "number"
    COLOR = "color"
    BOOLEAN = "boolean"


class InventoryCategory(Base):
    """Рекурсивная категория товаров на складе"""
    __tablename__ = "inventory_categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"))
    parent_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("inventory_categories.id", ondelete="CASCADE"), nullable=True
    )

    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    slug: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Уровень для фото: на каком уровне рекурсии начинают отображаться фото товаров
    # null = наследуется от родителя, 0 = текущий уровень
    photo_level: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Настройки отображения
    display_type: Mapped[str] = mapped_column(String(50), default="grid")  # grid, list, table

    order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    company: Mapped["Company"] = relationship(back_populates="inventory_categories")
    parent: Mapped[Optional["InventoryCategory"]] = relationship(
        back_populates="children", remote_side=[id]
    )
    children: Mapped[list["InventoryCategory"]] = relationship(
        back_populates="parent", cascade="all, delete-orphan"
    )
    items: Mapped[list["InventoryItem"]] = relationship(back_populates="category")

    # Связь с группами атрибутов (M2M)
    attribute_groups: Mapped[list["AttributeGroup"]] = relationship(
        secondary="category_attribute_groups", back_populates="categories"
    )


class AttributeGroup(Base):
    """Группа атрибутов (фильтров).

    Примеры:
    - "Объем" (атрибуты: 30мл, 50мл, 100мл)
    - "Тип кожи" (атрибуты: суха, жирна, комбінована)
    - "Производитель" (атрибуты: L'Oreal, Vichy, La Roche-Posay)
    """
    __tablename__ = "attribute_groups"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"))

    name: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    selection_type: Mapped[str] = mapped_column(String(50), default=SelectionType.SINGLE.value)
    value_type: Mapped[str] = mapped_column(String(50), default=ValueType.TEXT.value)

    is_filterable: Mapped[bool] = mapped_column(Boolean, default=True)
    show_in_card: Mapped[bool] = mapped_column(Boolean, default=True)

    order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    company: Mapped["Company"] = relationship(back_populates="attribute_groups")
    attributes: Mapped[list["Attribute"]] = relationship(
        back_populates="group", cascade="all, delete-orphan", order_by="Attribute.order"
    )
    categories: Mapped[list["InventoryCategory"]] = relationship(
        secondary="category_attribute_groups", back_populates="attribute_groups"
    )


class Attribute(Base):
    """Конкретный атрибут внутри группы.

    Примеры для группы "Объем": 30мл, 50мл, 100мл
    """
    __tablename__ = "attributes"

    id: Mapped[int] = mapped_column(primary_key=True)
    group_id: Mapped[int] = mapped_column(
        ForeignKey("attribute_groups.id", ondelete="CASCADE")
    )

    name: Mapped[str] = mapped_column(String(255))
    value: Mapped[str] = mapped_column(String(255))

    # Дополнительные данные (цвет для color type, и т.д.)
    extra_data: Mapped[Optional[dict]] = mapped_column("metadata", JSON, nullable=True)

    order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    group: Mapped["AttributeGroup"] = relationship(back_populates="attributes")
    item_attributes: Mapped[list["InventoryItemAttribute"]] = relationship(
        back_populates="attribute"
    )


class CategoryAttributeGroup(Base):
    """Связующая таблица: какие группы атрибутов доступны для категории"""
    __tablename__ = "category_attribute_groups"

    category_id: Mapped[int] = mapped_column(
        ForeignKey("inventory_categories.id", ondelete="CASCADE"), primary_key=True
    )
    group_id: Mapped[int] = mapped_column(
        ForeignKey("attribute_groups.id", ondelete="CASCADE"), primary_key=True
    )

    is_required: Mapped[bool] = mapped_column(Boolean, default=False)


class Brand(Base):
    """Бренд товарів"""
    __tablename__ = "brands"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"))

    name: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(255), index=True)
    logo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    company: Mapped["Company"] = relationship(back_populates="brands")
    collections: Mapped[list["Collection"]] = relationship(
        back_populates="brand", cascade="all, delete-orphan", order_by="Collection.order"
    )
    items: Mapped[list["InventoryItem"]] = relationship(back_populates="brand")


class Collection(Base):
    """Колекція товарів всередині бренду"""
    __tablename__ = "collections"

    id: Mapped[int] = mapped_column(primary_key=True)
    brand_id: Mapped[int] = mapped_column(ForeignKey("brands.id", ondelete="CASCADE"))

    name: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(255), index=True)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    brand: Mapped["Brand"] = relationship(back_populates="collections")
    items: Mapped[list["InventoryItem"]] = relationship(back_populates="collection")


class InventoryItem(Base):
    """Рекурсивна модель товару на складі.

    Підтримує ієрархію: батьківський товар → дочірні варіанти.
    Приклад:
    - Набір вітамінів (parent)
      - 1 Pack (child з власним SKU, ціною, залишком)
      - 2 Pack (child)
      - 3 Pack (child)
    """
    __tablename__ = "inventory_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"))
    category_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("inventory_categories.id", ondelete="SET NULL"), nullable=True
    )
    # Рекурсивний зв'язок: батьківський товар
    parent_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("inventory_items.id", ondelete="CASCADE"), nullable=True
    )
    # Бренд та колекція
    brand_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("brands.id", ondelete="SET NULL"), nullable=True
    )
    collection_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("collections.id", ondelete="SET NULL"), nullable=True
    )

    name: Mapped[str] = mapped_column(String(255))
    sku: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    barcode: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    usage_type: Mapped[str] = mapped_column(String(50), default=UsageType.INTERNAL.value)

    purchase_price: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    sale_price: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)

    unit: Mapped[str] = mapped_column(String(50), default="шт")
    min_stock_level: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Кількість в упаковці (для варіантів типу "2 Pack")
    quantity_in_pack: Mapped[int] = mapped_column(Integer, default=1)

    # Фото (JSON массив URL)
    images: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)

    manufacturer: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    order: Mapped[int] = mapped_column(Integer, default=0)  # Порядок сортування варіантів
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)  # Варіант за замовчуванням
    is_available_for_sale: Mapped[bool] = mapped_column(Boolean, default=False)  # Відображати у публічному каталозі

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    company: Mapped["Company"] = relationship(back_populates="inventory_items")
    category: Mapped[Optional["InventoryCategory"]] = relationship(back_populates="items")
    brand: Mapped[Optional["Brand"]] = relationship(back_populates="items")
    collection: Mapped[Optional["Collection"]] = relationship(back_populates="items")

    # Рекурсивні зв'язки
    parent: Mapped[Optional["InventoryItem"]] = relationship(
        back_populates="children", remote_side=[id]
    )
    children: Mapped[list["InventoryItem"]] = relationship(
        back_populates="parent", cascade="all, delete-orphan", order_by="InventoryItem.order"
    )

    attributes: Mapped[list["InventoryItemAttribute"]] = relationship(
        back_populates="item", cascade="all, delete-orphan"
    )
    stock_movements: Mapped[list["StockMovement"]] = relationship(
        back_populates="item", cascade="all, delete-orphan"
    )
    service_items: Mapped[list["ServiceInventoryItem"]] = relationship(
        back_populates="item", cascade="all, delete-orphan"
    )


class InventoryItemAttribute(Base):
    """Связь товара с атрибутом (значение атрибута для товара)"""
    __tablename__ = "inventory_item_attributes"

    id: Mapped[int] = mapped_column(primary_key=True)
    item_id: Mapped[int] = mapped_column(
        ForeignKey("inventory_items.id", ondelete="CASCADE")
    )
    attribute_id: Mapped[int] = mapped_column(
        ForeignKey("attributes.id", ondelete="CASCADE")
    )

    custom_value: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Relationships
    item: Mapped["InventoryItem"] = relationship(back_populates="attributes")
    attribute: Mapped["Attribute"] = relationship(back_populates="item_attributes")


class StockMovement(Base):
    """Движение товара на складе.

    Каждая операция (приход, расход, списание) создает запись.
    Текущий остаток = сумма всех quantity.
    Рух прив'язується до конкретного товару (включаючи дочірні варіанти).
    """
    __tablename__ = "stock_movements"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"))
    item_id: Mapped[int] = mapped_column(
        ForeignKey("inventory_items.id", ondelete="CASCADE")
    )

    movement_type: Mapped[str] = mapped_column(String(50))

    # Количество (положительное для прихода, отрицательное для расхода)
    quantity: Mapped[int] = mapped_column(Integer)

    unit_price: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)

    # Связь с записью на прием (если расход на процедуру)
    appointment_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("appointments.id", ondelete="SET NULL"), nullable=True
    )

    performed_by: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    batch_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    expiry_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    company: Mapped["Company"] = relationship(back_populates="stock_movements")
    item: Mapped["InventoryItem"] = relationship(back_populates="stock_movements")
    performed_by_user: Mapped[Optional["User"]] = relationship(back_populates="stock_movements")
    appointment: Mapped[Optional["Appointment"]] = relationship(back_populates="stock_movements")


class ServiceInventoryItem(Base):
    """Зв'язок послуги з товарами для автосписання.

    Можна прив'язувати як батьківський товар, так і конкретний варіант (дочірній товар).
    """
    __tablename__ = "service_inventory_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    service_id: Mapped[int] = mapped_column(
        ForeignKey("services.id", ondelete="CASCADE")
    )
    item_id: Mapped[int] = mapped_column(
        ForeignKey("inventory_items.id", ondelete="CASCADE")
    )

    # Скільки списувати за одну процедуру
    quantity: Mapped[int] = mapped_column(Integer, default=1)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    service: Mapped["Service"] = relationship(back_populates="inventory_items")
    item: Mapped["InventoryItem"] = relationship(back_populates="service_items")
