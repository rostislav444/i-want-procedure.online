'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Package, Search, AlertTriangle, ArrowDownUp, FolderTree, Tags, ChevronLeft, ChevronRight, ChevronDown, LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { inventoryApi, InventoryItemListItem, InventoryCategory, InventoryStats, Brand, getFileUrl } from '@/lib/api'

const USAGE_TYPE_LABELS: Record<string, string> = {
  internal: 'Внутрішній',
  sale: 'Продаж',
  both: 'Універсальний',
}

// Recursive category tree component
function CategoryTreeItem({
  category,
  selectedId,
  onSelect,
  level = 0,
  expandedIds,
  toggleExpanded,
}: {
  category: InventoryCategory
  selectedId: number | null
  onSelect: (id: number | null) => void
  level?: number
  expandedIds: Set<number>
  toggleExpanded: (id: number) => void
}) {
  // Don't render categories with 0 items
  if (!category.items_count || category.items_count === 0) {
    return null
  }

  // Filter children to only show those with items
  const childrenWithItems = category.children?.filter(c => c.items_count && c.items_count > 0) || []
  const hasChildren = childrenWithItems.length > 0
  const isExpanded = expandedIds.has(category.id)
  const isSelected = selectedId === category.id

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1 py-1.5 px-2 rounded cursor-pointer transition-colors text-sm',
          isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
        )}
        style={{ paddingLeft: `${8 + level * 12}px` }}
        onClick={() => onSelect(category.id)}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleExpanded(category.id)
            }}
            className="p-0.5 hover:bg-black/10 rounded"
          >
            <ChevronDown
              className={cn('h-3 w-3 transition-transform', !isExpanded && '-rotate-90')}
            />
          </button>
        )}
        {!hasChildren && <div className="w-4" />}
        <span className="flex-1 truncate">{category.name}</span>
        <span className={cn('text-xs', isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
          {category.items_count}
        </span>
      </div>
      {hasChildren && isExpanded && (
        <div>
          {childrenWithItems.map((child) => (
            <CategoryTreeItem
              key={child.id}
              category={child}
              selectedId={selectedId}
              onSelect={onSelect}
              level={level + 1}
              expandedIds={expandedIds}
              toggleExpanded={toggleExpanded}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItemListItem[]>([])
  const [categories, setCategories] = useState<InventoryCategory[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [stats, setStats] = useState<InventoryStats | null>(null)
  const [loading, setLoading] = useState(true)

  // Filters
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null)
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null)
  const [usageTypeFilter, setUsageTypeFilter] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showLowStock, setShowLowStock] = useState(false)

  // Category sidebar
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<number>>(new Set())
  const [expandedBrandIds, setExpandedBrandIds] = useState<Set<number>>(new Set())

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const pageSize = 20

  useEffect(() => {
    loadData()
  }, [selectedCategoryId, selectedBrandId, selectedCollectionId, usageTypeFilter, showLowStock, currentPage])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategoryId, selectedBrandId, selectedCollectionId, usageTypeFilter, showLowStock, searchQuery])

  // Expand parent categories and the selected category itself when selected
  useEffect(() => {
    if (selectedCategoryId && categories.length > 0) {
      const findParentIds = (cats: InventoryCategory[], targetId: number, path: number[] = []): number[] | null => {
        for (const cat of cats) {
          if (cat.id === targetId) {
            return path
          }
          if (cat.children && cat.children.length > 0) {
            const result = findParentIds(cat.children, targetId, [...path, cat.id])
            if (result) return result
          }
        }
        return null
      }
      const parentIds = findParentIds(categories, selectedCategoryId)
      if (parentIds) {
        // Expand parents AND the selected category itself
        setExpandedCategoryIds(prev => new Set([...Array.from(prev), ...parentIds, selectedCategoryId]))
      } else {
        // No parents found, just expand the selected category
        setExpandedCategoryIds(prev => new Set([...Array.from(prev), selectedCategoryId]))
      }
    }
  }, [selectedCategoryId, categories])

  const loadData = async () => {
    setLoading(true)
    try {
      const [itemsResponse, categoriesData, brandsData, statsData] = await Promise.all([
        inventoryApi.getItems({
          category_id: selectedCategoryId,
          brand_id: selectedBrandId,
          collection_id: selectedCollectionId,
          usage_type: usageTypeFilter,
          is_low_stock: showLowStock || undefined,
          page: currentPage,
          page_size: pageSize,
        }),
        inventoryApi.getCategoriesTree(),
        inventoryApi.getBrands(),
        inventoryApi.getStats(),
      ])
      setItems(itemsResponse.items)
      setTotalPages(itemsResponse.total_pages)
      setTotalItems(itemsResponse.total)
      setCategories(categoriesData)
      setBrands(brandsData)
      setStats(statsData)
    } catch (error) {
      console.error('Error loading inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = items.filter(item =>
    !searchQuery ||
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleCategoryExpanded = (id: number) => {
    setExpandedCategoryIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleCategorySelect = (id: number | null) => {
    setSelectedCategoryId(id)
  }

  const handleBrandSelect = (brandId: number | null, collectionId: number | null = null) => {
    setSelectedBrandId(brandId)
    setSelectedCollectionId(collectionId)
  }

  const toggleBrandExpanded = (id: number) => {
    setExpandedBrandIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Calculate total items in all categories
  const getTotalCategoryItems = (): number => {
    return categories.reduce((sum, cat) => sum + (cat.items_count || 0), 0)
  }

  // Calculate total items in all brands
  const getTotalBrandItems = (): number => {
    return brands.reduce((sum, brand) => sum + (brand.items_count || 0), 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Склад</h1>
          <p className="text-sm text-muted-foreground">
            {stats?.total_items || 0} позицій
            {stats?.low_stock_items ? ` (${stats.low_stock_items} закінчуються)` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/inventory/categories">
            <Button variant="outline" size="sm">
              <FolderTree className="mr-2 h-4 w-4" />
              Категорії
            </Button>
          </Link>
          <Link href="/admin/inventory/brands">
            <Button variant="outline" size="sm">
              <Tags className="mr-2 h-4 w-4" />
              Бренди
            </Button>
          </Link>
          <Link href="/admin/inventory/attributes">
            <Button variant="outline" size="sm">
              <LayoutGrid className="mr-2 h-4 w-4" />
              Атрибути
            </Button>
          </Link>
          <Link href="/admin/inventory/movements">
            <Button variant="outline" size="sm">
              <ArrowDownUp className="mr-2 h-4 w-4" />
              Рух товарів
            </Button>
          </Link>
          <Link href="/admin/inventory/new">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Додати товар
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total_items}</div>
              <div className="text-sm text-muted-foreground">Всього позицій</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-500">{stats.low_stock_items}</div>
              <div className="text-sm text-muted-foreground">Закінчуються</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.items_for_sale}</div>
              <div className="text-sm text-muted-foreground">Для продажу</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total_value.toLocaleString()} грн</div>
              <div className="text-sm text-muted-foreground">Вартість складу</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Layout with Sidebar */}
      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0 space-y-4">
          {/* Categories */}
          <Card>
            <CardContent className="p-3">
              <h3 className="font-medium mb-2 text-sm flex items-center gap-2">
                <FolderTree className="h-4 w-4" />
                Категорії
              </h3>
              <div className="space-y-0.5">
                {/* All categories option */}
                <div
                  className={cn(
                    'flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer transition-colors text-sm',
                    selectedCategoryId === null ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  )}
                  onClick={() => handleCategorySelect(null)}
                >
                  <LayoutGrid className="h-3 w-3" />
                  <span className="flex-1">Всі категорії</span>
                  <span className={cn('text-xs', selectedCategoryId === null ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                    {getTotalCategoryItems()}
                  </span>
                </div>

                {/* Category tree */}
                {categories.map((category) => (
                  <CategoryTreeItem
                    key={category.id}
                    category={category}
                    selectedId={selectedCategoryId}
                    onSelect={handleCategorySelect}
                    expandedIds={expandedCategoryIds}
                    toggleExpanded={toggleCategoryExpanded}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Brands */}
          <Card>
            <CardContent className="p-3">
              <h3 className="font-medium mb-2 text-sm flex items-center gap-2">
                <Tags className="h-4 w-4" />
                Бренди
              </h3>
              <div className="space-y-0.5">
                {/* All brands option */}
                <div
                  className={cn(
                    'flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer transition-colors text-sm',
                    selectedBrandId === null && selectedCollectionId === null ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  )}
                  onClick={() => handleBrandSelect(null)}
                >
                  <LayoutGrid className="h-3 w-3" />
                  <span className="flex-1">Всі бренди</span>
                  <span className={cn('text-xs', selectedBrandId === null ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                    {getTotalBrandItems()}
                  </span>
                </div>

                {/* Brands list */}
                {brands.map((brand) => (
                  <div key={brand.id}>
                    <div
                      className={cn(
                        'flex items-center gap-1 py-1.5 px-2 rounded cursor-pointer transition-colors text-sm',
                        selectedBrandId === brand.id && selectedCollectionId === null ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                      )}
                      onClick={() => handleBrandSelect(brand.id)}
                    >
                      {brand.collections && brand.collections.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleBrandExpanded(brand.id)
                          }}
                          className="p-0.5 hover:bg-black/10 rounded"
                        >
                          <ChevronDown
                            className={cn('h-3 w-3 transition-transform', !expandedBrandIds.has(brand.id) && '-rotate-90')}
                          />
                        </button>
                      )}
                      {(!brand.collections || brand.collections.length === 0) && <div className="w-4" />}
                      {brand.logo_url && (
                        <img src={getFileUrl(brand.logo_url)} alt={brand.name} className="h-4 w-4 object-contain rounded" />
                      )}
                      <span className="flex-1 truncate">{brand.name}</span>
                      <span className={cn('text-xs', selectedBrandId === brand.id && selectedCollectionId === null ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                        {brand.items_count || 0}
                      </span>
                    </div>

                    {/* Collections */}
                    {brand.collections && brand.collections.length > 0 && expandedBrandIds.has(brand.id) && (
                      <div className="ml-4">
                        {brand.collections.map((collection) => (
                          <div
                            key={collection.id}
                            className={cn(
                              'flex items-center gap-1 py-1.5 px-2 rounded cursor-pointer transition-colors text-sm',
                              selectedCollectionId === collection.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                            )}
                            onClick={() => handleBrandSelect(brand.id, collection.id)}
                          >
                            <div className="w-4" />
                            <span className="flex-1 truncate">{collection.name}</span>
                            <span className={cn('text-xs', selectedCollectionId === collection.id ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                              {collection.items_count || 0}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {brands.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Брендів ще немає
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Filters Bar */}
          <div className="flex flex-wrap gap-4 mb-6">
            {/* Search */}
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Пошук по назві, SKU, штрихкоду..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={usageTypeFilter || 'all'}
              onValueChange={(v) => setUsageTypeFilter(v === 'all' ? null : v)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Всі типи" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всі типи</SelectItem>
                <SelectItem value="internal">Для внутрішнього</SelectItem>
                <SelectItem value="sale">Для продажу</SelectItem>
                <SelectItem value="both">Універсальні</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={showLowStock ? 'default' : 'outline'}
              onClick={() => setShowLowStock(!showLowStock)}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Закінчуються
            </Button>
          </div>

          {/* Items Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Завантаження...</p>
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map(item => (
                <Link key={item.id} href={`/admin/inventory/${item.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col">
                    {/* Image */}
                    <div className="aspect-[4/3] bg-muted flex items-center justify-center overflow-hidden">
                      {item.main_image_url ? (
                        <img
                          src={getFileUrl(item.main_image_url)}
                          alt={item.name}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <Package className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>

                    <CardContent className="p-4 flex-1">
                      <h3 className="font-medium line-clamp-2">{item.name}</h3>
                      {item.sku && (
                        <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                      )}
                      {(item.category_name || item.brand_name) && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.brand_name && <span className="font-medium">{item.brand_name}</span>}
                          {item.brand_name && item.category_name && ' · '}
                          {item.category_name}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        <Badge variant={item.usage_type === 'sale' ? 'default' : 'secondary'} className="text-xs">
                          {USAGE_TYPE_LABELS[item.usage_type]}
                        </Badge>
                        {item.is_low_stock && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Мало
                          </Badge>
                        )}
                        {!item.is_active && (
                          <Badge variant="outline" className="text-xs">Неактивний</Badge>
                        )}
                      </div>

                      {/* Variants List */}
                      {item.variants && item.variants.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-muted-foreground mb-2">
                            {item.variants.length} варіант{item.variants.length === 1 ? '' : item.variants.length < 5 ? 'и' : 'ів'}:
                          </p>
                          <div className="space-y-1">
                            {item.variants.slice(0, 4).map(variant => (
                              <div key={variant.id} className="flex items-center justify-between text-xs">
                                <span className={cn(
                                  'truncate flex-1',
                                  variant.is_default && 'font-medium'
                                )}>
                                  {variant.name}
                                  {variant.is_default && ' *'}
                                </span>
                                <span className="text-muted-foreground ml-2">{variant.current_stock} шт</span>
                                {variant.sale_price && (
                                  <span className="text-primary font-medium ml-2">{variant.sale_price} грн</span>
                                )}
                              </div>
                            ))}
                            {item.variants.length > 4 && (
                              <p className="text-xs text-muted-foreground">
                                + ще {item.variants.length - 4}...
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>

                    <CardFooter className="px-4 py-3 border-t bg-muted/30 flex justify-between mt-auto">
                      <span className="text-sm">
                        Залишок: <strong>{item.total_stock} {item.unit}</strong>
                      </span>
                      {/* Show price range for items with variants, or single price */}
                      {item.min_variant_price && item.max_variant_price ? (
                        <span className="font-bold text-primary">
                          {item.min_variant_price === item.max_variant_price
                            ? `${item.min_variant_price} грн`
                            : `${item.min_variant_price} - ${item.max_variant_price} грн`}
                        </span>
                      ) : item.sale_price ? (
                        <span className="font-bold text-primary">
                          {item.sale_price} грн
                        </span>
                      ) : null}
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  {searchQuery || selectedCategoryId || selectedBrandId || usageTypeFilter || showLowStock
                    ? 'Товарів за вказаними фільтрами не знайдено'
                    : 'Товарів ще немає'}
                </p>
                <Link href="/admin/inventory/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Додати перший товар
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Показано {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalItems)} з {totalItems}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Назад
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        className="w-9"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Вперед
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
