from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, HTTPException, status, Query
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload

from app.api.deps import DbSession, CurrentUser
from app.models.inventory import (
    InventoryCategory,
    AttributeGroup,
    Attribute,
    Brand,
    Collection,
    InventoryItem,
    InventoryItemAttribute,
    StockMovement,
    CategoryAttributeGroup,
    ServiceInventoryItem,
    MovementType,
)
from app.schemas.inventory import (
    # Categories
    InventoryCategoryCreate,
    InventoryCategoryUpdate,
    InventoryCategoryResponse,
    InventoryCategoryTreeResponse,
    # Brands
    BrandCreate,
    BrandUpdate,
    BrandResponse,
    CollectionCreate,
    CollectionUpdate,
    CollectionResponse,
    # Attribute Groups
    AttributeGroupCreate,
    AttributeGroupUpdate,
    AttributeGroupResponse,
    AttributeCreate,
    AttributeUpdate,
    AttributeResponse,
    # Items
    InventoryItemCreate,
    InventoryItemUpdate,
    InventoryItemResponse,
    InventoryItemListResponse,
    InventoryItemVariantResponse,
    VariantListItem,
    ItemAttributeCreate,
    ItemAttributeResponse,
    # Stock
    StockMovementCreate,
    StockMovementResponse,
    # Service Items
    ServiceInventoryItemCreate,
    ServiceInventoryItemResponse,
    # Stats
    InventoryStats,
    # Pagination
    PaginatedItemsResponse,
)

router = APIRouter(prefix="/inventory", tags=["inventory"])


# === Helper Functions ===

def normalize_images(images: list | None) -> list[dict] | None:
    """Normalize images to ItemImage format (list of dicts with url and is_main).

    Supports both formats:
    - List of strings: ["url1", "url2"] -> [{"url": "url1", "is_main": True}, {"url": "url2", "is_main": False}]
    - List of dicts: [{"url": "...", "is_main": True}] -> as is
    """
    if not images:
        return None

    result = []
    for i, img in enumerate(images):
        if isinstance(img, str):
            result.append({"url": img, "is_main": i == 0})
        elif isinstance(img, dict):
            result.append(img)

    return result if result else None

def build_category_tree(
    categories: list[InventoryCategory],
    parent_id: Optional[int] = None
) -> list[InventoryCategoryTreeResponse]:
    """Построить дерево категорий с рекурсивным подсчётом товаров"""
    tree = []
    for cat in categories:
        if cat.parent_id == parent_id:
            children = build_category_tree(categories, cat.id)
            # Рахуємо тільки батьківські товари (без варіантів)
            direct_items = len([i for i in cat.items if i.parent_id is None]) if hasattr(cat, 'items') else 0
            # Додаємо товари з дочірніх категорій
            children_items = sum(child.items_count for child in children)
            items_count = direct_items + children_items
            tree.append(InventoryCategoryTreeResponse(
                id=cat.id,
                company_id=cat.company_id,
                parent_id=cat.parent_id,
                name=cat.name,
                description=cat.description,
                image_url=cat.image_url,
                photo_level=cat.photo_level,
                display_type=cat.display_type,
                order=cat.order,
                is_active=cat.is_active,
                created_at=cat.created_at,
                items_count=items_count,
                children=children,
                attribute_groups=[
                    AttributeGroupResponse(
                        id=g.id,
                        company_id=g.company_id,
                        name=g.name,
                        slug=g.slug,
                        description=g.description,
                        selection_type=g.selection_type,
                        value_type=g.value_type,
                        is_filterable=g.is_filterable,
                        show_in_card=g.show_in_card,
                        order=g.order,
                        is_active=g.is_active,
                        attributes=[
                            AttributeResponse(
                                id=a.id,
                                group_id=a.group_id,
                                name=a.name,
                                value=a.value,
                                extra_data=a.extra_data,
                                order=a.order,
                                is_active=a.is_active,
                            )
                            for a in g.attributes
                        ],
                        created_at=g.created_at,
                    )
                    for g in cat.attribute_groups
                ],
            ))
    return sorted(tree, key=lambda x: (x.order, x.name))


async def calculate_stock(db: DbSession, item_id: int) -> int:
    """Подсчитать текущий остаток товара"""
    result = await db.execute(
        select(func.coalesce(func.sum(StockMovement.quantity), 0))
        .where(StockMovement.item_id == item_id)
    )
    return result.scalar() or 0


def get_all_descendant_category_ids(
    categories: list[InventoryCategory],
    parent_id: int
) -> list[int]:
    """Отримати всі ID підкатегорій рекурсивно (включаючи саму категорію)"""
    result = [parent_id]
    for cat in categories:
        if cat.parent_id == parent_id:
            result.extend(get_all_descendant_category_ids(categories, cat.id))
    return result


# === Categories ===

@router.get("/categories", response_model=list[InventoryCategoryResponse])
async def get_categories(current_user: CurrentUser, db: DbSession):
    """Получить все категории (плоский список)"""
    result = await db.execute(
        select(InventoryCategory)
        .options(selectinload(InventoryCategory.items))
        .where(InventoryCategory.company_id == current_user.company_id)
        .order_by(InventoryCategory.order, InventoryCategory.name)
    )
    categories = result.scalars().all()
    return [
        InventoryCategoryResponse(
            id=cat.id,
            company_id=cat.company_id,
            parent_id=cat.parent_id,
            name=cat.name,
            description=cat.description,
            image_url=cat.image_url,
            photo_level=cat.photo_level,
            display_type=cat.display_type,
            order=cat.order,
            is_active=cat.is_active,
            created_at=cat.created_at,
            items_count=len(cat.items),
        )
        for cat in categories
    ]


@router.get("/categories/tree", response_model=list[InventoryCategoryTreeResponse])
async def get_categories_tree(current_user: CurrentUser, db: DbSession):
    """Получить категории как дерево"""
    result = await db.execute(
        select(InventoryCategory)
        .options(
            selectinload(InventoryCategory.items),
            selectinload(InventoryCategory.attribute_groups).selectinload(AttributeGroup.attributes),
        )
        .where(InventoryCategory.company_id == current_user.company_id)
    )
    categories = result.scalars().all()
    return build_category_tree(list(categories))


@router.post("/categories", response_model=InventoryCategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    data: InventoryCategoryCreate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Создать категорию"""
    category = InventoryCategory(
        company_id=current_user.company_id,
        parent_id=data.parent_id,
        name=data.name,
        description=data.description,
        image_url=data.image_url,
        photo_level=data.photo_level,
        display_type=data.display_type,
        order=data.order,
    )
    db.add(category)
    await db.flush()

    # Привязываем группы атрибутов
    if data.attribute_group_ids:
        for group_id in data.attribute_group_ids:
            link = CategoryAttributeGroup(category_id=category.id, group_id=group_id)
            db.add(link)

    await db.commit()
    await db.refresh(category)
    return InventoryCategoryResponse(
        id=category.id,
        company_id=category.company_id,
        parent_id=category.parent_id,
        name=category.name,
        description=category.description,
        image_url=category.image_url,
        photo_level=category.photo_level,
        display_type=category.display_type,
        order=category.order,
        is_active=category.is_active,
        created_at=category.created_at,
        items_count=0,
    )


@router.get("/categories/{category_id}", response_model=InventoryCategoryTreeResponse)
async def get_category(category_id: int, current_user: CurrentUser, db: DbSession):
    """Получить категорию с детьми и атрибутами"""
    result = await db.execute(
        select(InventoryCategory)
        .options(
            selectinload(InventoryCategory.items),
            selectinload(InventoryCategory.children),
            selectinload(InventoryCategory.attribute_groups).selectinload(AttributeGroup.attributes),
        )
        .where(
            InventoryCategory.id == category_id,
            InventoryCategory.company_id == current_user.company_id,
        )
    )
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # Получить всех детей рекурсивно
    all_categories_result = await db.execute(
        select(InventoryCategory)
        .options(
            selectinload(InventoryCategory.items),
            selectinload(InventoryCategory.attribute_groups).selectinload(AttributeGroup.attributes),
        )
        .where(InventoryCategory.company_id == current_user.company_id)
    )
    all_categories = all_categories_result.scalars().all()

    children = build_category_tree(list(all_categories), category_id)

    return InventoryCategoryTreeResponse(
        id=category.id,
        company_id=category.company_id,
        parent_id=category.parent_id,
        name=category.name,
        description=category.description,
        image_url=category.image_url,
        photo_level=category.photo_level,
        display_type=category.display_type,
        order=category.order,
        is_active=category.is_active,
        created_at=category.created_at,
        items_count=len(category.items),
        children=children,
        attribute_groups=[
            AttributeGroupResponse(
                id=g.id,
                company_id=g.company_id,
                name=g.name,
                slug=g.slug,
                description=g.description,
                selection_type=g.selection_type,
                value_type=g.value_type,
                is_filterable=g.is_filterable,
                show_in_card=g.show_in_card,
                order=g.order,
                is_active=g.is_active,
                attributes=[
                    AttributeResponse(
                        id=a.id,
                        group_id=a.group_id,
                        name=a.name,
                        value=a.value,
                        extra_data=a.extra_data,
                        order=a.order,
                        is_active=a.is_active,
                    )
                    for a in g.attributes
                ],
                created_at=g.created_at,
            )
            for g in category.attribute_groups
        ],
    )


@router.patch("/categories/{category_id}", response_model=InventoryCategoryResponse)
async def update_category(
    category_id: int,
    data: InventoryCategoryUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Обновить категорию"""
    result = await db.execute(
        select(InventoryCategory)
        .options(selectinload(InventoryCategory.items))
        .where(
            InventoryCategory.id == category_id,
            InventoryCategory.company_id == current_user.company_id,
        )
    )
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    update_data = data.model_dump(exclude_unset=True)
    attribute_group_ids = update_data.pop("attribute_group_ids", None)

    for field, value in update_data.items():
        setattr(category, field, value)

    # Обновляем связи с группами атрибутов
    if attribute_group_ids is not None:
        # Удаляем старые связи
        await db.execute(
            select(CategoryAttributeGroup)
            .where(CategoryAttributeGroup.category_id == category_id)
        )
        # Создаем новые
        for group_id in attribute_group_ids:
            link = CategoryAttributeGroup(category_id=category.id, group_id=group_id)
            db.add(link)

    await db.commit()
    await db.refresh(category)
    return InventoryCategoryResponse(
        id=category.id,
        company_id=category.company_id,
        parent_id=category.parent_id,
        name=category.name,
        description=category.description,
        image_url=category.image_url,
        photo_level=category.photo_level,
        display_type=category.display_type,
        order=category.order,
        is_active=category.is_active,
        created_at=category.created_at,
        items_count=len(category.items),
    )


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(category_id: int, current_user: CurrentUser, db: DbSession):
    """Удалить категорию (товары останутся без категории)"""
    result = await db.execute(
        select(InventoryCategory).where(
            InventoryCategory.id == category_id,
            InventoryCategory.company_id == current_user.company_id,
        )
    )
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    await db.delete(category)
    await db.commit()


# === Brands ===

@router.get("/brands", response_model=list[BrandResponse])
async def get_brands(current_user: CurrentUser, db: DbSession):
    """Отримати всі бренди з колекціями"""
    result = await db.execute(
        select(Brand)
        .options(
            selectinload(Brand.collections).selectinload(Collection.items),
            selectinload(Brand.items),
        )
        .where(Brand.company_id == current_user.company_id)
        .order_by(Brand.order, Brand.name)
    )
    brands = result.scalars().all()

    # Рахуємо товари для кожного бренду та колекції
    response = []
    for brand in brands:
        items_count = len([i for i in brand.items if i.parent_id is None])
        response.append(BrandResponse(
            id=brand.id,
            company_id=brand.company_id,
            name=brand.name,
            slug=brand.slug,
            logo_url=brand.logo_url,
            description=brand.description,
            website=brand.website,
            order=brand.order,
            is_active=brand.is_active,
            created_at=brand.created_at,
            collections=[
                CollectionResponse(
                    id=c.id,
                    brand_id=c.brand_id,
                    name=c.name,
                    slug=c.slug,
                    image_url=c.image_url,
                    description=c.description,
                    order=c.order,
                    is_active=c.is_active,
                    created_at=c.created_at,
                    items_count=len([i for i in c.items if i.parent_id is None]),
                )
                for c in brand.collections
            ],
            items_count=items_count,
        ))
    return response


@router.post("/brands", response_model=BrandResponse, status_code=status.HTTP_201_CREATED)
async def create_brand(
    data: BrandCreate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Створити бренд"""
    brand = Brand(
        company_id=current_user.company_id,
        name=data.name,
        slug=data.slug,
        logo_url=data.logo_url,
        description=data.description,
        website=data.website,
        order=data.order,
    )
    db.add(brand)
    await db.commit()
    await db.refresh(brand)

    return BrandResponse(
        id=brand.id,
        company_id=brand.company_id,
        name=brand.name,
        slug=brand.slug,
        logo_url=brand.logo_url,
        description=brand.description,
        website=brand.website,
        order=brand.order,
        is_active=brand.is_active,
        created_at=brand.created_at,
        collections=[],
        items_count=0,
    )


@router.get("/brands/{brand_id}", response_model=BrandResponse)
async def get_brand(brand_id: int, current_user: CurrentUser, db: DbSession):
    """Отримати бренд за ID"""
    result = await db.execute(
        select(Brand)
        .options(
            selectinload(Brand.collections),
            selectinload(Brand.items),
        )
        .where(
            Brand.id == brand_id,
            Brand.company_id == current_user.company_id
        )
    )
    brand = result.scalar_one_or_none()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    items_count = len([i for i in brand.items if i.parent_id is None])
    return BrandResponse(
        id=brand.id,
        company_id=brand.company_id,
        name=brand.name,
        slug=brand.slug,
        logo_url=brand.logo_url,
        description=brand.description,
        website=brand.website,
        order=brand.order,
        is_active=brand.is_active,
        created_at=brand.created_at,
        collections=[
            CollectionResponse(
                id=c.id,
                brand_id=c.brand_id,
                name=c.name,
                slug=c.slug,
                image_url=c.image_url,
                description=c.description,
                order=c.order,
                is_active=c.is_active,
                created_at=c.created_at,
            )
            for c in brand.collections
        ],
        items_count=items_count,
    )


@router.patch("/brands/{brand_id}", response_model=BrandResponse)
async def update_brand(
    brand_id: int,
    data: BrandUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Оновити бренд"""
    result = await db.execute(
        select(Brand)
        .options(selectinload(Brand.collections), selectinload(Brand.items))
        .where(
            Brand.id == brand_id,
            Brand.company_id == current_user.company_id
        )
    )
    brand = result.scalar_one_or_none()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(brand, key, value)

    await db.commit()
    await db.refresh(brand)

    items_count = len([i for i in brand.items if i.parent_id is None])
    return BrandResponse(
        id=brand.id,
        company_id=brand.company_id,
        name=brand.name,
        slug=brand.slug,
        logo_url=brand.logo_url,
        description=brand.description,
        website=brand.website,
        order=brand.order,
        is_active=brand.is_active,
        created_at=brand.created_at,
        collections=[
            CollectionResponse(
                id=c.id,
                brand_id=c.brand_id,
                name=c.name,
                slug=c.slug,
                image_url=c.image_url,
                description=c.description,
                order=c.order,
                is_active=c.is_active,
                created_at=c.created_at,
            )
            for c in brand.collections
        ],
        items_count=items_count,
    )


@router.delete("/brands/{brand_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_brand(brand_id: int, current_user: CurrentUser, db: DbSession):
    """Видалити бренд"""
    result = await db.execute(
        select(Brand).where(
            Brand.id == brand_id,
            Brand.company_id == current_user.company_id
        )
    )
    brand = result.scalar_one_or_none()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    await db.delete(brand)
    await db.commit()


# === Collections ===

@router.post("/brands/{brand_id}/collections", response_model=CollectionResponse, status_code=status.HTTP_201_CREATED)
async def create_collection(
    brand_id: int,
    data: CollectionCreate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Створити колекцію для бренду"""
    # Перевіряємо, що бренд належить компанії
    result = await db.execute(
        select(Brand).where(
            Brand.id == brand_id,
            Brand.company_id == current_user.company_id
        )
    )
    brand = result.scalar_one_or_none()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    collection = Collection(
        brand_id=brand_id,
        name=data.name,
        slug=data.slug,
        image_url=data.image_url,
        description=data.description,
        order=data.order,
    )
    db.add(collection)
    await db.commit()
    await db.refresh(collection)

    return CollectionResponse(
        id=collection.id,
        brand_id=collection.brand_id,
        name=collection.name,
        slug=collection.slug,
        image_url=collection.image_url,
        description=collection.description,
        order=collection.order,
        is_active=collection.is_active,
        created_at=collection.created_at,
    )


@router.patch("/collections/{collection_id}", response_model=CollectionResponse)
async def update_collection(
    collection_id: int,
    data: CollectionUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Оновити колекцію"""
    result = await db.execute(
        select(Collection)
        .join(Brand)
        .where(
            Collection.id == collection_id,
            Brand.company_id == current_user.company_id
        )
    )
    collection = result.scalar_one_or_none()
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(collection, key, value)

    await db.commit()
    await db.refresh(collection)

    return CollectionResponse(
        id=collection.id,
        brand_id=collection.brand_id,
        name=collection.name,
        slug=collection.slug,
        image_url=collection.image_url,
        description=collection.description,
        order=collection.order,
        is_active=collection.is_active,
        created_at=collection.created_at,
    )


@router.delete("/collections/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_collection(collection_id: int, current_user: CurrentUser, db: DbSession):
    """Видалити колекцію"""
    result = await db.execute(
        select(Collection)
        .join(Brand)
        .where(
            Collection.id == collection_id,
            Brand.company_id == current_user.company_id
        )
    )
    collection = result.scalar_one_or_none()
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    await db.delete(collection)
    await db.commit()


# === Attribute Groups ===

@router.get("/attribute-groups", response_model=list[AttributeGroupResponse])
async def get_attribute_groups(current_user: CurrentUser, db: DbSession):
    """Получить все группы атрибутов с атрибутами"""
    result = await db.execute(
        select(AttributeGroup)
        .options(selectinload(AttributeGroup.attributes))
        .where(AttributeGroup.company_id == current_user.company_id)
        .order_by(AttributeGroup.order)
    )
    return result.scalars().all()


@router.post("/attribute-groups", response_model=AttributeGroupResponse, status_code=status.HTTP_201_CREATED)
async def create_attribute_group(
    data: AttributeGroupCreate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Создать группу атрибутов с атрибутами"""
    group = AttributeGroup(
        company_id=current_user.company_id,
        name=data.name,
        slug=data.slug,
        description=data.description,
        selection_type=data.selection_type,
        value_type=data.value_type,
        is_filterable=data.is_filterable,
        show_in_card=data.show_in_card,
        order=data.order,
    )
    db.add(group)
    await db.flush()

    # Создаем атрибуты
    if data.attributes:
        for attr_data in data.attributes:
            attr = Attribute(
                group_id=group.id,
                name=attr_data.name,
                value=attr_data.value,
                extra_data=attr_data.extra_data,
                order=attr_data.order,
            )
            db.add(attr)

    await db.commit()

    # Загружаем с атрибутами
    result = await db.execute(
        select(AttributeGroup)
        .options(selectinload(AttributeGroup.attributes))
        .where(AttributeGroup.id == group.id)
    )
    return result.scalar_one()


@router.get("/attribute-groups/{group_id}", response_model=AttributeGroupResponse)
async def get_attribute_group(group_id: int, current_user: CurrentUser, db: DbSession):
    """Получить группу атрибутов"""
    result = await db.execute(
        select(AttributeGroup)
        .options(selectinload(AttributeGroup.attributes))
        .where(
            AttributeGroup.id == group_id,
            AttributeGroup.company_id == current_user.company_id,
        )
    )
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=404, detail="Attribute group not found")
    return group


@router.patch("/attribute-groups/{group_id}", response_model=AttributeGroupResponse)
async def update_attribute_group(
    group_id: int,
    data: AttributeGroupUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Обновить группу атрибутов"""
    result = await db.execute(
        select(AttributeGroup)
        .options(selectinload(AttributeGroup.attributes))
        .where(
            AttributeGroup.id == group_id,
            AttributeGroup.company_id == current_user.company_id,
        )
    )
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=404, detail="Attribute group not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(group, field, value)

    await db.commit()
    await db.refresh(group)
    return group


@router.delete("/attribute-groups/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_attribute_group(group_id: int, current_user: CurrentUser, db: DbSession):
    """Удалить группу атрибутов"""
    result = await db.execute(
        select(AttributeGroup).where(
            AttributeGroup.id == group_id,
            AttributeGroup.company_id == current_user.company_id,
        )
    )
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=404, detail="Attribute group not found")

    await db.delete(group)
    await db.commit()


@router.post("/attribute-groups/{group_id}/attributes", response_model=AttributeResponse, status_code=status.HTTP_201_CREATED)
async def create_attribute(
    group_id: int,
    data: AttributeCreate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Добавить атрибут в группу"""
    # Проверяем, что группа принадлежит компании
    result = await db.execute(
        select(AttributeGroup).where(
            AttributeGroup.id == group_id,
            AttributeGroup.company_id == current_user.company_id,
        )
    )
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=404, detail="Attribute group not found")

    attr = Attribute(
        group_id=group_id,
        name=data.name,
        value=data.value,
        extra_data=data.extra_data,
        order=data.order,
    )
    db.add(attr)
    await db.commit()
    await db.refresh(attr)
    return attr


@router.patch("/attributes/{attribute_id}", response_model=AttributeResponse)
async def update_attribute(
    attribute_id: int,
    data: AttributeUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Обновить атрибут"""
    result = await db.execute(
        select(Attribute)
        .join(AttributeGroup)
        .where(
            Attribute.id == attribute_id,
            AttributeGroup.company_id == current_user.company_id,
        )
    )
    attr = result.scalar_one_or_none()
    if not attr:
        raise HTTPException(status_code=404, detail="Attribute not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(attr, field, value)

    await db.commit()
    await db.refresh(attr)
    return attr


@router.delete("/attributes/{attribute_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_attribute(attribute_id: int, current_user: CurrentUser, db: DbSession):
    """Удалить атрибут"""
    result = await db.execute(
        select(Attribute)
        .join(AttributeGroup)
        .where(
            Attribute.id == attribute_id,
            AttributeGroup.company_id == current_user.company_id,
        )
    )
    attr = result.scalar_one_or_none()
    if not attr:
        raise HTTPException(status_code=404, detail="Attribute not found")

    await db.delete(attr)
    await db.commit()


# === Items ===

@router.get("/items", response_model=PaginatedItemsResponse)
async def get_items(
    current_user: CurrentUser,
    db: DbSession,
    category_id: Optional[int] = Query(None),
    brand_id: Optional[int] = Query(None),
    collection_id: Optional[int] = Query(None),
    parent_id: Optional[int] = Query(None, description="Фільтр по батьківському товару. null = тільки батьківські товари"),
    include_children: bool = Query(False, description="Включити дочірні товари (варіанти)"),
    usage_type: Optional[str] = Query(None),
    is_low_stock: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """Отримати список товарів з фільтрацією та пагінацією.

    За замовчуванням повертає тільки батьківські товари (parent_id IS NULL).
    Для отримання варіантів конкретного товару використовуйте parent_id.
    """
    # Базовий фільтр
    base_filter = [InventoryItem.company_id == current_user.company_id]

    # За замовчуванням показуємо тільки батьківські товари
    if not include_children:
        if parent_id is not None:
            base_filter.append(InventoryItem.parent_id == parent_id)
        else:
            base_filter.append(InventoryItem.parent_id.is_(None))

    # Фільтр по категорії (включаючи підкатегорії)
    if category_id is not None:
        # Завантажуємо всі категорії для пошуку підкатегорій
        cats_result = await db.execute(
            select(InventoryCategory)
            .where(InventoryCategory.company_id == current_user.company_id)
        )
        all_categories = list(cats_result.scalars().all())
        # Отримуємо всі ID підкатегорій рекурсивно
        category_ids = get_all_descendant_category_ids(all_categories, category_id)
        base_filter.append(InventoryItem.category_id.in_(category_ids))
    # Фільтр по бренду та колекції
    if brand_id is not None:
        base_filter.append(InventoryItem.brand_id == brand_id)
    if collection_id is not None:
        base_filter.append(InventoryItem.collection_id == collection_id)
    if usage_type:
        base_filter.append(InventoryItem.usage_type == usage_type)
    if is_active is not None:
        base_filter.append(InventoryItem.is_active == is_active)
    if search:
        search_filter = or_(
            InventoryItem.name.ilike(f"%{search}%"),
            InventoryItem.sku.ilike(f"%{search}%"),
            InventoryItem.barcode.ilike(f"%{search}%"),
        )
        base_filter.append(search_filter)

    # Підрахунок загальної кількості
    count_query = select(func.count(InventoryItem.id)).where(*base_filter)
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Основний запит з пагінацією
    skip = (page - 1) * page_size
    query = (
        select(InventoryItem)
        .options(
            selectinload(InventoryItem.category),
            selectinload(InventoryItem.brand),
            selectinload(InventoryItem.collection),
            selectinload(InventoryItem.children),
        )
        .where(*base_filter)
        .order_by(InventoryItem.order, InventoryItem.name)
        .offset(skip)
        .limit(page_size)
    )
    result = await db.execute(query)
    items = result.scalars().all()

    # Підраховуємо залишки та інформацію про варіанти
    response_items = []
    for item in items:
        stock = await calculate_stock(db, item.id)
        is_low = item.min_stock_level is not None and stock <= item.min_stock_level

        # Пропускаємо якщо фільтр по низькому залишку
        if is_low_stock is not None and is_low_stock != is_low:
            continue

        # Отримуємо головне фото
        main_image = None
        if item.images:
            for img in item.images:
                # Підтримка обох форматів: dict з is_main/url або просто string URL
                if isinstance(img, dict):
                    if img.get("is_main"):
                        main_image = img.get("url")
                        break
                elif isinstance(img, str):
                    # Якщо це просто URL-рядок, використовуємо перший
                    if not main_image:
                        main_image = img
            if not main_image and item.images:
                first_img = item.images[0]
                main_image = first_img.get("url") if isinstance(first_img, dict) else first_img

        # Рахуємо варіанти, залишки та діапазон цін
        variants_count = len(item.children) if item.children else 0
        min_price = None
        max_price = None
        total_stock = stock  # Починаємо з залишку батьківського товару
        variants_list = []

        if variants_count > 0:
            prices = [c.sale_price for c in item.children if c.sale_price is not None]
            if prices:
                min_price = min(prices)
                max_price = max(prices)

            # Рахуємо залишки варіантів та будуємо список
            for variant in sorted(item.children, key=lambda x: (x.order, x.name)):
                variant_stock = await calculate_stock(db, variant.id)
                total_stock += variant_stock
                variant_is_low = variant.min_stock_level is not None and variant_stock <= variant.min_stock_level
                variants_list.append(VariantListItem(
                    id=variant.id,
                    name=variant.name,
                    sale_price=variant.sale_price,
                    current_stock=variant_stock,
                    is_default=variant.is_default,
                    is_low_stock=variant_is_low,
                ))

        response_items.append(InventoryItemListResponse(
            id=item.id,
            name=item.name,
            sku=item.sku,
            barcode=item.barcode,
            usage_type=item.usage_type,
            purchase_price=item.purchase_price,
            sale_price=item.sale_price,
            unit=item.unit,
            current_stock=stock,
            total_stock=total_stock,
            is_low_stock=is_low,
            main_image_url=main_image,
            category_name=item.category.name if item.category else None,
            category_id=item.category_id,
            brand_id=item.brand_id,
            brand_name=item.brand.name if item.brand else None,
            collection_id=item.collection_id,
            collection_name=item.collection.name if item.collection else None,
            parent_id=item.parent_id,
            is_active=item.is_active,
            is_available_for_sale=item.is_available_for_sale,
            quantity_in_pack=item.quantity_in_pack,
            order=item.order,
            is_default=item.is_default,
            variants_count=variants_count,
            min_variant_price=min_price,
            max_variant_price=max_price,
            variants=variants_list,
        ))

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PaginatedItemsResponse(
        items=response_items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("/items", response_model=InventoryItemResponse, status_code=status.HTTP_201_CREATED)
async def create_item(
    data: InventoryItemCreate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Створити товар з можливими варіантами.

    Якщо передано variants, будуть створені дочірні товари (варіанти).
    """
    item = InventoryItem(
        company_id=current_user.company_id,
        category_id=data.category_id,
        parent_id=data.parent_id,
        name=data.name,
        sku=data.sku,
        barcode=data.barcode,
        description=data.description,
        usage_type=data.usage_type,
        purchase_price=data.purchase_price,
        sale_price=data.sale_price,
        unit=data.unit,
        min_stock_level=data.min_stock_level,
        manufacturer=data.manufacturer,
        images=[img.model_dump() for img in data.images] if data.images else None,
        is_available_for_sale=data.is_available_for_sale,
        quantity_in_pack=data.quantity_in_pack,
        order=data.order,
        is_default=data.is_default,
    )
    db.add(item)
    await db.flush()

    # Додаємо атрибути
    if data.attributes:
        for attr_data in data.attributes:
            item_attr = InventoryItemAttribute(
                item_id=item.id,
                attribute_id=attr_data.attribute_id,
                custom_value=attr_data.custom_value,
            )
            db.add(item_attr)

    # Створюємо початковий приход якщо вказано
    if data.initial_stock and data.initial_stock > 0:
        movement = StockMovement(
            company_id=current_user.company_id,
            item_id=item.id,
            movement_type=MovementType.INCOMING.value,
            quantity=data.initial_stock,
            unit_price=data.purchase_price,
            performed_by=current_user.id,
            notes="Початковий залишок",
        )
        db.add(movement)

    # Створюємо варіанти якщо передано
    created_variants = []
    if data.variants:
        for i, variant_data in enumerate(data.variants):
            variant = InventoryItem(
                company_id=current_user.company_id,
                category_id=data.category_id,
                parent_id=item.id,
                name=variant_data.name,
                sku=variant_data.sku,
                barcode=variant_data.barcode,
                description=data.description,  # Успадковуємо опис від батька
                usage_type=data.usage_type,
                purchase_price=variant_data.purchase_price or data.purchase_price,
                sale_price=variant_data.sale_price or data.sale_price,
                unit=data.unit,
                min_stock_level=data.min_stock_level,
                manufacturer=data.manufacturer,
                images=[img.model_dump() for img in variant_data.images] if variant_data.images else None,
                is_available_for_sale=data.is_available_for_sale,
                quantity_in_pack=variant_data.quantity_in_pack,
                order=variant_data.order if variant_data.order else i,
                is_default=variant_data.is_default,
            )
            db.add(variant)
            await db.flush()
            created_variants.append(variant)

            # Створюємо початковий приход для варіанту
            if variant_data.initial_stock and variant_data.initial_stock > 0:
                v_movement = StockMovement(
                    company_id=current_user.company_id,
                    item_id=variant.id,
                    movement_type=MovementType.INCOMING.value,
                    quantity=variant_data.initial_stock,
                    unit_price=variant_data.purchase_price or data.purchase_price,
                    performed_by=current_user.id,
                    notes="Початковий залишок",
                )
                db.add(v_movement)

    await db.commit()

    # Завантажуємо з відношеннями
    result = await db.execute(
        select(InventoryItem)
        .options(
            selectinload(InventoryItem.category),
            selectinload(InventoryItem.brand),
            selectinload(InventoryItem.collection),
            selectinload(InventoryItem.children),
            selectinload(InventoryItem.attributes).selectinload(InventoryItemAttribute.attribute).selectinload(Attribute.group),
        )
        .where(InventoryItem.id == item.id)
    )
    item = result.scalar_one()

    stock = await calculate_stock(db, item.id)
    total_stock = stock  # Починаємо з залишку батьківського товару

    # Будуємо відповідь з варіантами
    variants_response = []
    min_price = None
    max_price = None
    if item.children:
        prices = []
        for child in item.children:
            child_stock = await calculate_stock(db, child.id)
            total_stock += child_stock  # Додаємо залишок варіанту
            variants_response.append(InventoryItemVariantResponse(
                id=child.id,
                name=child.name,
                sku=child.sku,
                barcode=child.barcode,
                purchase_price=child.purchase_price,
                sale_price=child.sale_price,
                quantity_in_pack=child.quantity_in_pack,
                order=child.order,
                is_default=child.is_default,
                is_active=child.is_active,
                current_stock=child_stock,
                is_low_stock=child.min_stock_level is not None and child_stock <= child.min_stock_level,
                images=normalize_images(child.images),
            ))
            if child.sale_price:
                prices.append(child.sale_price)
        if prices:
            min_price = min(prices)
            max_price = max(prices)

    return InventoryItemResponse(
        id=item.id,
        company_id=item.company_id,
        category_id=item.category_id,
        parent_id=item.parent_id,
        name=item.name,
        sku=item.sku,
        barcode=item.barcode,
        description=item.description,
        usage_type=item.usage_type,
        purchase_price=item.purchase_price,
        sale_price=item.sale_price,
        unit=item.unit,
        min_stock_level=item.min_stock_level,
        manufacturer=item.manufacturer,
        images=normalize_images(item.images),
        is_active=item.is_active,
        is_available_for_sale=item.is_available_for_sale,
        quantity_in_pack=item.quantity_in_pack,
        order=item.order,
        is_default=item.is_default,
        created_at=item.created_at,
        updated_at=item.updated_at,
        current_stock=stock,
        total_stock=total_stock,
        is_low_stock=item.min_stock_level is not None and stock <= item.min_stock_level,
        category_name=item.category.name if item.category else None,
        brand_name=item.brand.name if item.brand else None,
        collection_name=item.collection.name if item.collection else None,
        attributes=[
            ItemAttributeResponse(
                id=ia.id,
                attribute_id=ia.attribute_id,
                attribute_name=ia.attribute.name,
                attribute_value=ia.attribute.value,
                group_name=ia.attribute.group.name,
                group_id=ia.attribute.group.id,
                custom_value=ia.custom_value,
            )
            for ia in item.attributes
        ],
        variants=variants_response,
        variants_count=len(variants_response),
        min_variant_price=min_price,
        max_variant_price=max_price,
    )


@router.get("/items/{item_id}", response_model=InventoryItemResponse)
async def get_item(item_id: int, current_user: CurrentUser, db: DbSession):
    """Отримати товар з атрибутами, варіантами та поточним залишком"""
    result = await db.execute(
        select(InventoryItem)
        .options(
            selectinload(InventoryItem.category),
            selectinload(InventoryItem.brand),
            selectinload(InventoryItem.collection),
            selectinload(InventoryItem.children),
            selectinload(InventoryItem.attributes).selectinload(InventoryItemAttribute.attribute).selectinload(Attribute.group),
        )
        .where(
            InventoryItem.id == item_id,
            InventoryItem.company_id == current_user.company_id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    stock = await calculate_stock(db, item.id)
    total_stock = stock  # Починаємо з залишку батьківського товару

    # Будуємо відповідь з варіантами
    variants_response = []
    min_price = None
    max_price = None
    if item.children:
        prices = []
        for child in sorted(item.children, key=lambda x: x.order):
            child_stock = await calculate_stock(db, child.id)
            total_stock += child_stock  # Додаємо залишок варіанту до загального
            variants_response.append(InventoryItemVariantResponse(
                id=child.id,
                name=child.name,
                sku=child.sku,
                barcode=child.barcode,
                purchase_price=child.purchase_price,
                sale_price=child.sale_price,
                quantity_in_pack=child.quantity_in_pack,
                order=child.order,
                is_default=child.is_default,
                is_active=child.is_active,
                current_stock=child_stock,
                is_low_stock=child.min_stock_level is not None and child_stock <= child.min_stock_level,
                images=normalize_images(child.images),
            ))
            if child.sale_price:
                prices.append(child.sale_price)
        if prices:
            min_price = min(prices)
            max_price = max(prices)

    return InventoryItemResponse(
        id=item.id,
        company_id=item.company_id,
        category_id=item.category_id,
        parent_id=item.parent_id,
        name=item.name,
        sku=item.sku,
        barcode=item.barcode,
        description=item.description,
        usage_type=item.usage_type,
        purchase_price=item.purchase_price,
        sale_price=item.sale_price,
        unit=item.unit,
        min_stock_level=item.min_stock_level,
        manufacturer=item.manufacturer,
        images=normalize_images(item.images),
        is_active=item.is_active,
        is_available_for_sale=item.is_available_for_sale,
        quantity_in_pack=item.quantity_in_pack,
        order=item.order,
        is_default=item.is_default,
        created_at=item.created_at,
        updated_at=item.updated_at,
        current_stock=stock,
        total_stock=total_stock,
        is_low_stock=item.min_stock_level is not None and stock <= item.min_stock_level,
        category_name=item.category.name if item.category else None,
        brand_name=item.brand.name if item.brand else None,
        collection_name=item.collection.name if item.collection else None,
        attributes=[
            ItemAttributeResponse(
                id=ia.id,
                attribute_id=ia.attribute_id,
                attribute_name=ia.attribute.name,
                attribute_value=ia.attribute.value,
                group_name=ia.attribute.group.name,
                group_id=ia.attribute.group.id,
                custom_value=ia.custom_value,
            )
            for ia in item.attributes
        ],
        variants=variants_response,
        variants_count=len(variants_response),
        min_variant_price=min_price,
        max_variant_price=max_price,
    )


@router.patch("/items/{item_id}", response_model=InventoryItemResponse)
async def update_item(
    item_id: int,
    data: InventoryItemUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Оновити товар"""
    result = await db.execute(
        select(InventoryItem)
        .options(
            selectinload(InventoryItem.category),
            selectinload(InventoryItem.brand),
            selectinload(InventoryItem.collection),
            selectinload(InventoryItem.children),
            selectinload(InventoryItem.attributes).selectinload(InventoryItemAttribute.attribute).selectinload(Attribute.group),
        )
        .where(
            InventoryItem.id == item_id,
            InventoryItem.company_id == current_user.company_id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    update_data = data.model_dump(exclude_unset=True)

    # Обробляємо images окремо
    if "images" in update_data:
        images = update_data.pop("images")
        item.images = [img.model_dump() if hasattr(img, 'model_dump') else img for img in images] if images else None

    for field, value in update_data.items():
        setattr(item, field, value)

    await db.commit()

    # Перезавантажуємо з відношеннями
    result = await db.execute(
        select(InventoryItem)
        .options(
            selectinload(InventoryItem.category),
            selectinload(InventoryItem.brand),
            selectinload(InventoryItem.collection),
            selectinload(InventoryItem.children),
            selectinload(InventoryItem.attributes).selectinload(InventoryItemAttribute.attribute).selectinload(Attribute.group),
        )
        .where(InventoryItem.id == item.id)
    )
    item = result.scalar_one()

    stock = await calculate_stock(db, item.id)
    total_stock = stock  # Починаємо з залишку батьківського товару

    # Будуємо відповідь з варіантами
    variants_response = []
    min_price = None
    max_price = None
    if item.children:
        prices = []
        for child in sorted(item.children, key=lambda x: x.order):
            child_stock = await calculate_stock(db, child.id)
            total_stock += child_stock  # Додаємо залишок варіанту
            variants_response.append(InventoryItemVariantResponse(
                id=child.id,
                name=child.name,
                sku=child.sku,
                barcode=child.barcode,
                purchase_price=child.purchase_price,
                sale_price=child.sale_price,
                quantity_in_pack=child.quantity_in_pack,
                order=child.order,
                is_default=child.is_default,
                is_active=child.is_active,
                current_stock=child_stock,
                is_low_stock=child.min_stock_level is not None and child_stock <= child.min_stock_level,
                images=normalize_images(child.images),
            ))
            if child.sale_price:
                prices.append(child.sale_price)
        if prices:
            min_price = min(prices)
            max_price = max(prices)

    return InventoryItemResponse(
        id=item.id,
        company_id=item.company_id,
        category_id=item.category_id,
        parent_id=item.parent_id,
        name=item.name,
        sku=item.sku,
        barcode=item.barcode,
        description=item.description,
        usage_type=item.usage_type,
        purchase_price=item.purchase_price,
        sale_price=item.sale_price,
        unit=item.unit,
        min_stock_level=item.min_stock_level,
        manufacturer=item.manufacturer,
        images=normalize_images(item.images),
        is_active=item.is_active,
        is_available_for_sale=item.is_available_for_sale,
        quantity_in_pack=item.quantity_in_pack,
        order=item.order,
        is_default=item.is_default,
        created_at=item.created_at,
        updated_at=item.updated_at,
        current_stock=stock,
        total_stock=total_stock,
        is_low_stock=item.min_stock_level is not None and stock <= item.min_stock_level,
        category_name=item.category.name if item.category else None,
        brand_name=item.brand.name if item.brand else None,
        collection_name=item.collection.name if item.collection else None,
        attributes=[
            ItemAttributeResponse(
                id=ia.id,
                attribute_id=ia.attribute_id,
                attribute_name=ia.attribute.name,
                attribute_value=ia.attribute.value,
                group_name=ia.attribute.group.name,
                group_id=ia.attribute.group.id,
                custom_value=ia.custom_value,
            )
            for ia in item.attributes
        ],
        variants=variants_response,
        variants_count=len(variants_response),
        min_variant_price=min_price,
        max_variant_price=max_price,
    )


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(item_id: int, current_user: CurrentUser, db: DbSession):
    """Удалить товар (с историей движений)"""
    result = await db.execute(
        select(InventoryItem).where(
            InventoryItem.id == item_id,
            InventoryItem.company_id == current_user.company_id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    await db.delete(item)
    await db.commit()


@router.post("/items/{item_id}/attributes", response_model=InventoryItemResponse)
async def set_item_attributes(
    item_id: int,
    attributes: list[ItemAttributeCreate],
    current_user: CurrentUser,
    db: DbSession,
):
    """Установить атрибуты товара (заменяет все)"""
    result = await db.execute(
        select(InventoryItem)
        .options(selectinload(InventoryItem.attributes))
        .where(
            InventoryItem.id == item_id,
            InventoryItem.company_id == current_user.company_id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Удаляем старые атрибуты
    for attr in item.attributes:
        await db.delete(attr)

    # Добавляем новые
    for attr_data in attributes:
        item_attr = InventoryItemAttribute(
            item_id=item.id,
            attribute_id=attr_data.attribute_id,
            custom_value=attr_data.custom_value,
        )
        db.add(item_attr)

    await db.commit()

    # Перезагружаем
    return await get_item(item_id, current_user, db)


# === Stock Movements ===

@router.get("/items/{item_id}/movements", response_model=list[StockMovementResponse])
async def get_item_movements(
    item_id: int,
    current_user: CurrentUser,
    db: DbSession,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    include_variants: bool = Query(True, description="Включити рух варіантів для батьківського товару"),
):
    """Отримати історію руху товару (включаючи варіанти для батьківських товарів)"""
    # Перевіряємо що товар належить компанії та завантажуємо варіанти
    item_result = await db.execute(
        select(InventoryItem)
        .options(selectinload(InventoryItem.children))
        .where(
            InventoryItem.id == item_id,
            InventoryItem.company_id == current_user.company_id,
        )
    )
    item = item_result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Збираємо ID товарів для запиту (сам товар + варіанти якщо це батьківський товар)
    item_ids = [item_id]
    item_names = {item_id: item.name}

    if include_variants and item.children:
        for child in item.children:
            item_ids.append(child.id)
            item_names[child.id] = child.name

    result = await db.execute(
        select(StockMovement)
        .options(selectinload(StockMovement.performed_by_user))
        .where(StockMovement.item_id.in_(item_ids))
        .order_by(StockMovement.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    movements = result.scalars().all()

    return [
        StockMovementResponse(
            id=m.id,
            company_id=m.company_id,
            item_id=m.item_id,
            item_name=item_names.get(m.item_id, ""),
            movement_type=m.movement_type,
            quantity=m.quantity,
            unit_price=m.unit_price,
            appointment_id=m.appointment_id,
            performed_by=m.performed_by,
            performed_by_name=f"{m.performed_by_user.first_name} {m.performed_by_user.last_name}" if m.performed_by_user else None,
            notes=m.notes,
            batch_number=m.batch_number,
            expiry_date=m.expiry_date,
            created_at=m.created_at,
        )
        for m in movements
    ]


@router.post("/movements", response_model=StockMovementResponse, status_code=status.HTTP_201_CREATED)
async def create_movement(
    data: StockMovementCreate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Создать движение товара (приход/расход)"""
    # Проверяем, что товар принадлежит компании
    result = await db.execute(
        select(InventoryItem).where(
            InventoryItem.id == data.item_id,
            InventoryItem.company_id == current_user.company_id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    movement = StockMovement(
        company_id=current_user.company_id,
        item_id=data.item_id,
        movement_type=data.movement_type,
        quantity=data.quantity,
        unit_price=data.unit_price,
        appointment_id=data.appointment_id,
        performed_by=current_user.id,
        notes=data.notes,
        batch_number=data.batch_number,
        expiry_date=data.expiry_date,
    )
    db.add(movement)
    await db.commit()
    await db.refresh(movement)

    return StockMovementResponse(
        id=movement.id,
        company_id=movement.company_id,
        item_id=movement.item_id,
        item_name=item.name,
        movement_type=movement.movement_type,
        quantity=movement.quantity,
        unit_price=movement.unit_price,
        appointment_id=movement.appointment_id,
        performed_by=movement.performed_by,
        performed_by_name=f"{current_user.first_name} {current_user.last_name}",
        notes=movement.notes,
        batch_number=movement.batch_number,
        expiry_date=movement.expiry_date,
        created_at=movement.created_at,
    )


@router.get("/movements", response_model=list[StockMovementResponse])
async def get_all_movements(
    current_user: CurrentUser,
    db: DbSession,
    movement_type: Optional[str] = Query(None),
    item_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    """Получить все движения (журнал склада)"""
    query = (
        select(StockMovement)
        .options(
            selectinload(StockMovement.item),
            selectinload(StockMovement.performed_by_user),
        )
        .where(StockMovement.company_id == current_user.company_id)
    )

    if movement_type:
        query = query.where(StockMovement.movement_type == movement_type)
    if item_id:
        query = query.where(StockMovement.item_id == item_id)

    query = query.order_by(StockMovement.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    movements = result.scalars().all()

    return [
        StockMovementResponse(
            id=m.id,
            company_id=m.company_id,
            item_id=m.item_id,
            item_name=m.item.name if m.item else "",
            movement_type=m.movement_type,
            quantity=m.quantity,
            unit_price=m.unit_price,
            appointment_id=m.appointment_id,
            performed_by=m.performed_by,
            performed_by_name=f"{m.performed_by_user.first_name} {m.performed_by_user.last_name}" if m.performed_by_user else None,
            notes=m.notes,
            batch_number=m.batch_number,
            expiry_date=m.expiry_date,
            created_at=m.created_at,
        )
        for m in movements
    ]


# === Service Inventory Items ===

@router.get("/services/{service_id}/items", response_model=list[ServiceInventoryItemResponse])
async def get_service_inventory_items(
    service_id: int,
    current_user: CurrentUser,
    db: DbSession,
):
    """Получить товары для услуги (для автосписания)"""
    result = await db.execute(
        select(ServiceInventoryItem)
        .options(selectinload(ServiceInventoryItem.item))
        .where(ServiceInventoryItem.service_id == service_id)
    )
    items = result.scalars().all()

    response = []
    for si in items:
        stock = await calculate_stock(db, si.item_id)
        response.append(ServiceInventoryItemResponse(
            id=si.id,
            service_id=si.service_id,
            item_id=si.item_id,
            item_name=si.item.name if si.item else "",
            quantity=si.quantity,
            current_stock=stock,
            unit=si.item.unit if si.item else "шт",
            created_at=si.created_at,
        ))

    return response


@router.post("/services/{service_id}/items", response_model=ServiceInventoryItemResponse, status_code=status.HTTP_201_CREATED)
async def add_service_inventory_item(
    service_id: int,
    data: ServiceInventoryItemCreate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Добавить товар для услуги"""
    # Проверяем товар
    item_result = await db.execute(
        select(InventoryItem).where(
            InventoryItem.id == data.item_id,
            InventoryItem.company_id == current_user.company_id,
        )
    )
    item = item_result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    si = ServiceInventoryItem(
        service_id=service_id,
        item_id=data.item_id,
        quantity=data.quantity,
    )
    db.add(si)
    await db.commit()
    await db.refresh(si)

    stock = await calculate_stock(db, si.item_id)

    return ServiceInventoryItemResponse(
        id=si.id,
        service_id=si.service_id,
        item_id=si.item_id,
        item_name=item.name,
        quantity=si.quantity,
        current_stock=stock,
        unit=item.unit,
        created_at=si.created_at,
    )


@router.delete("/services/{service_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_service_inventory_item(
    service_id: int,
    item_id: int,
    current_user: CurrentUser,
    db: DbSession,
):
    """Удалить товар из услуги"""
    result = await db.execute(
        select(ServiceInventoryItem).where(
            ServiceInventoryItem.service_id == service_id,
            ServiceInventoryItem.item_id == item_id,
        )
    )
    si = result.scalar_one_or_none()
    if not si:
        raise HTTPException(status_code=404, detail="Service inventory item not found")

    await db.delete(si)
    await db.commit()


# === Stats ===

@router.get("/stats", response_model=InventoryStats)
async def get_inventory_stats(current_user: CurrentUser, db: DbSession):
    """Статистика склада"""
    # Всего позиций
    total_result = await db.execute(
        select(func.count(InventoryItem.id))
        .where(
            InventoryItem.company_id == current_user.company_id,
            InventoryItem.is_active == True,
        )
    )
    total_items = total_result.scalar() or 0

    # По типам
    sale_result = await db.execute(
        select(func.count(InventoryItem.id))
        .where(
            InventoryItem.company_id == current_user.company_id,
            InventoryItem.is_active == True,
            InventoryItem.usage_type.in_(["sale", "both"]),
        )
    )
    items_for_sale = sale_result.scalar() or 0

    internal_result = await db.execute(
        select(func.count(InventoryItem.id))
        .where(
            InventoryItem.company_id == current_user.company_id,
            InventoryItem.is_active == True,
            InventoryItem.usage_type.in_(["internal", "both"]),
        )
    )
    items_internal = internal_result.scalar() or 0

    # Товары с низким остатком и общая стоимость
    items_result = await db.execute(
        select(InventoryItem)
        .where(
            InventoryItem.company_id == current_user.company_id,
            InventoryItem.is_active == True,
        )
    )
    items = items_result.scalars().all()

    low_stock_count = 0
    total_value = Decimal("0")

    for item in items:
        stock = await calculate_stock(db, item.id)
        if item.min_stock_level is not None and stock <= item.min_stock_level:
            low_stock_count += 1
        if item.purchase_price and stock > 0:
            total_value += item.purchase_price * stock

    return InventoryStats(
        total_items=total_items,
        low_stock_items=low_stock_count,
        total_value=total_value,
        items_for_sale=items_for_sale,
        items_internal=items_internal,
    )


@router.get("/low-stock", response_model=list[InventoryItemListResponse])
async def get_low_stock_items(current_user: CurrentUser, db: DbSession):
    """Получить товары с низким остатком"""
    result = await db.execute(
        select(InventoryItem)
        .options(selectinload(InventoryItem.category))
        .where(
            InventoryItem.company_id == current_user.company_id,
            InventoryItem.is_active == True,
            InventoryItem.min_stock_level.isnot(None),
        )
    )
    items = result.scalars().all()

    response = []
    for item in items:
        stock = await calculate_stock(db, item.id)
        if stock <= item.min_stock_level:
            main_image = None
            if item.images:
                for img in item.images:
                    if isinstance(img, dict):
                        if img.get("is_main"):
                            main_image = img.get("url")
                            break
                    elif isinstance(img, str):
                        if not main_image:
                            main_image = img
                if not main_image and item.images:
                    first_img = item.images[0]
                    main_image = first_img.get("url") if isinstance(first_img, dict) else first_img

            response.append(InventoryItemListResponse(
                id=item.id,
                name=item.name,
                sku=item.sku,
                barcode=item.barcode,
                usage_type=item.usage_type,
                purchase_price=item.purchase_price,
                sale_price=item.sale_price,
                unit=item.unit,
                current_stock=stock,
                is_low_stock=True,
                main_image_url=main_image,
                category_name=item.category.name if item.category else None,
                category_id=item.category_id,
                is_active=item.is_active,
            ))

    return response
