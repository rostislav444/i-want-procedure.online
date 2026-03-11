'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Package, Search, AlertTriangle, ArrowDownUp, FolderTree, Tags, ChevronLeft, ChevronRight, ChevronDown, LayoutGrid, List, ArrowUp, ArrowDown, PackagePlus, PackageMinus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { TableSkeleton, CardsSkeleton, FadeIn } from '@/components/ui/loader'
import { toast } from 'sonner'
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

  // View mode
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table')

  // Sorting (for table view)
  type SortField = 'name' | 'total_stock' | 'purchase_price' | 'sale_price'
  const [sortBy, setSortBy] = useState<SortField>('total_stock')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  // Expanded variants in table
  const [expandedItemIds, setExpandedItemIds] = useState<Set<number>>(new Set())

  // Category sidebar
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<number>>(new Set())
  const [expandedBrandIds, setExpandedBrandIds] = useState<Set<number>>(new Set())

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const pageSize = 20

  // Quick action dialogs
  const [showReceiveDialog, setShowReceiveDialog] = useState(false)
  const [showWriteOffDialog, setShowWriteOffDialog] = useState(false)
  const [quickSearchQuery, setQuickSearchQuery] = useState('')
  const [quickSearchResults, setQuickSearchResults] = useState<InventoryItemListItem[]>([])
  const [quickSelectedItemId, setQuickSelectedItemId] = useState<number | null>(null)
  const [quickQuantity, setQuickQuantity] = useState('')
  const [quickUnitPrice, setQuickUnitPrice] = useState('')
  const [quickBatchNumber, setQuickBatchNumber] = useState('')
  const [quickExpiryDate, setQuickExpiryDate] = useState('')
  const [quickNotes, setQuickNotes] = useState('')
  const [quickLoading, setQuickLoading] = useState(false)

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    loadData()
  }, [selectedCategoryId, selectedBrandId, selectedCollectionId, usageTypeFilter, showLowStock, currentPage, debouncedSearch, sortBy, sortDir])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategoryId, selectedBrandId, selectedCollectionId, usageTypeFilter, showLowStock])

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
          search: debouncedSearch || undefined,
          sort_by: sortBy || undefined,
          sort_dir: sortDir || undefined,
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

  // Items are already filtered and sorted server-side
  const sortedItems = items

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortDir(field === 'name' ? 'asc' : 'asc')
    }
  }

  const toggleItemExpanded = (id: number) => {
    setExpandedItemIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

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

  // Quick action: search items for receive/write-off dialogs
  useEffect(() => {
    if (!quickSearchQuery || quickSearchQuery.length < 2) {
      setQuickSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await inventoryApi.getItems({ search: quickSearchQuery, page_size: 10 })
        setQuickSearchResults(res.items)
      } catch (e) {
        console.error(e)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [quickSearchQuery])

  const resetQuickForm = () => {
    setQuickSearchQuery('')
    setQuickSearchResults([])
    setQuickSelectedItemId(null)
    setQuickQuantity('')
    setQuickUnitPrice('')
    setQuickBatchNumber('')
    setQuickExpiryDate('')
    setQuickNotes('')
  }

  const handleQuickReceive = async () => {
    if (!quickSelectedItemId || !quickQuantity) return
    setQuickLoading(true)
    try {
      await inventoryApi.createMovement({
        item_id: quickSelectedItemId,
        movement_type: 'incoming',
        quantity: Math.abs(parseInt(quickQuantity)),
        unit_price: quickUnitPrice ? parseFloat(quickUnitPrice) : undefined,
        batch_number: quickBatchNumber || undefined,
        expiry_date: quickExpiryDate || undefined,
        notes: quickNotes || undefined,
      })
      toast.success('Товар прийнято на склад')
      setShowReceiveDialog(false)
      resetQuickForm()
      loadData()
    } catch (error) {
      console.error(error)
      toast.error('Помилка при прийомі товару')
    } finally {
      setQuickLoading(false)
    }
  }

  const handleQuickWriteOff = async () => {
    if (!quickSelectedItemId || !quickQuantity) return
    setQuickLoading(true)
    try {
      await inventoryApi.createMovement({
        item_id: quickSelectedItemId,
        movement_type: 'write_off',
        quantity: -Math.abs(parseInt(quickQuantity)),
        notes: quickNotes || undefined,
      })
      toast.success('Товар списано')
      setShowWriteOffDialog(false)
      resetQuickForm()
      loadData()
    } catch (error) {
      console.error(error)
      toast.error('Помилка при списанні товару')
    } finally {
      setQuickLoading(false)
    }
  }

  const selectedQuickItem = quickSearchResults.find(i => i.id === quickSelectedItemId) ||
    items.find(i => i.id === quickSelectedItemId)

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
          <Button variant="outline" size="sm" onClick={() => { resetQuickForm(); setShowReceiveDialog(true) }}>
            <PackagePlus className="mr-2 h-4 w-4" />
            Прийняти товар
          </Button>
          <Button variant="outline" size="sm" onClick={() => { resetQuickForm(); setShowWriteOffDialog(true) }}>
            <PackageMinus className="mr-2 h-4 w-4" />
            Списати
          </Button>
          <Link href="/admin/inventory/new">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Додати товар
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {loading && !stats && <CardsSkeleton />}
      {stats && (
        <FadeIn className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        </FadeIn>
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

            {/* View mode toggle */}
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-r-none px-2.5"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-l-none px-2.5"
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Items */}
          {loading ? (
            <Card>
              <TableSkeleton rows={10} cols={6} />
            </Card>
          ) : sortedItems.length > 0 ? (
            viewMode === 'table' ? (
              /* ===== TABLE VIEW ===== */
              <FadeIn><Card>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 w-8"></th>
                        <th
                          className="text-left p-3 cursor-pointer hover:bg-muted/80 select-none"
                          onClick={() => handleSort('name')}
                        >
                          <div className="flex items-center gap-1">
                            Назва
                            {sortBy === 'name' && (sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                          </div>
                        </th>
                        <th className="text-left p-3">Категорія</th>
                        <th className="text-left p-3">Бренд</th>
                        <th
                          className="text-right p-3 cursor-pointer hover:bg-muted/80 select-none"
                          onClick={() => handleSort('total_stock')}
                        >
                          <div className="flex items-center justify-end gap-1">
                            Залишок
                            {sortBy === 'total_stock' && (sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                          </div>
                        </th>
                        <th
                          className="text-right p-3 cursor-pointer hover:bg-muted/80 select-none"
                          onClick={() => handleSort('purchase_price')}
                        >
                          <div className="flex items-center justify-end gap-1">
                            Закупівля
                            {sortBy === 'purchase_price' && (sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                          </div>
                        </th>
                        <th
                          className="text-right p-3 cursor-pointer hover:bg-muted/80 select-none"
                          onClick={() => handleSort('sale_price')}
                        >
                          <div className="flex items-center justify-end gap-1">
                            Продаж
                            {sortBy === 'sale_price' && (sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                          </div>
                        </th>
                        <th className="text-center p-3">Тип</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedItems.map(item => {
                        const hasVariants = item.variants && item.variants.length > 0
                        const isExpanded = expandedItemIds.has(item.id)

                        return (
                          <React.Fragment key={item.id}>
                            {/* Main item row */}
                            <tr className={cn(
                              'border-b hover:bg-muted/30 transition-colors',
                              item.is_low_stock && 'bg-red-50 dark:bg-red-950/20'
                            )}>
                              <td className="p-3">
                                {hasVariants ? (
                                  <button
                                    onClick={() => toggleItemExpanded(item.id)}
                                    className="p-0.5 hover:bg-muted rounded"
                                  >
                                    <ChevronDown className={cn('h-4 w-4 transition-transform', !isExpanded && '-rotate-90')} />
                                  </button>
                                ) : null}
                              </td>
                              <td className="p-3">
                                <Link href={`/admin/inventory/${item.id}`} className="hover:underline">
                                  <div className="font-medium">{item.name}</div>
                                  {item.sku && <div className="text-xs text-muted-foreground">SKU: {item.sku}</div>}
                                </Link>
                              </td>
                              <td className="p-3 text-muted-foreground">{item.category_name || '—'}</td>
                              <td className="p-3 text-muted-foreground">{item.brand_name || '—'}</td>
                              <td className="p-3 text-right">
                                <span className={cn(
                                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
                                  item.total_stock === 0
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                    : item.is_low_stock
                                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                      : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                )}>
                                  {item.total_stock === 0 && <AlertTriangle className="h-3 w-3" />}
                                  {item.is_low_stock && item.total_stock > 0 && <AlertTriangle className="h-3 w-3" />}
                                  {item.total_stock} {item.unit}
                                </span>
                              </td>
                              <td className="p-3 text-right text-muted-foreground">
                                {hasVariants
                                  ? '—'
                                  : item.purchase_price ? `${item.purchase_price} грн` : '—'}
                              </td>
                              <td className="p-3 text-right">
                                {hasVariants ? (
                                  item.min_variant_price && item.max_variant_price ? (
                                    <span className="text-primary font-medium">
                                      {item.min_variant_price === item.max_variant_price
                                        ? `${item.min_variant_price}`
                                        : `${item.min_variant_price}–${item.max_variant_price}`}
                                      <span className="text-xs ml-0.5">грн</span>
                                    </span>
                                  ) : '—'
                                ) : item.sale_price ? (
                                  <span className="text-primary font-medium">{item.sale_price} <span className="text-xs">грн</span></span>
                                ) : '—'}
                              </td>
                              <td className="p-3 text-center">
                                <Badge variant={item.usage_type === 'sale' ? 'default' : 'secondary'} className="text-xs">
                                  {USAGE_TYPE_LABELS[item.usage_type]}
                                </Badge>
                              </td>
                            </tr>

                            {/* Variant sub-rows */}
                            {hasVariants && isExpanded && item.variants?.map(variant => (
                              <tr key={variant.id} className={cn(
                                'border-b bg-muted/10',
                                variant.is_low_stock && 'bg-red-50/50 dark:bg-red-950/10'
                              )}>
                                <td className="p-3"></td>
                                <td className="p-3 pl-8">
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">↳</span>
                                    <span className={cn(variant.is_default && 'font-medium')}>
                                      {variant.name}
                                      {variant.is_default && <span className="text-xs text-muted-foreground ml-1">(осн.)</span>}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-3"></td>
                                <td className="p-3"></td>
                                <td className="p-3 text-right">
                                  <span className={cn(
                                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
                                    variant.current_stock === 0
                                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                      : variant.is_low_stock
                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  )}>
                                    {(variant.current_stock === 0 || variant.is_low_stock) && <AlertTriangle className="h-3 w-3" />}
                                    {variant.current_stock}
                                  </span>
                                </td>
                                <td className="p-3 text-right text-muted-foreground">
                                  {variant.purchase_price ? `${variant.purchase_price} грн` : '—'}
                                </td>
                                <td className="p-3 text-right">
                                  {variant.sale_price ? (
                                    <span className="text-primary font-medium">{variant.sale_price} <span className="text-xs">грн</span></span>
                                  ) : '—'}
                                </td>
                                <td className="p-3"></td>
                              </tr>
                            ))}
                          </React.Fragment>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </Card></FadeIn>
            ) : (
              /* ===== GRID VIEW ===== */
              <FadeIn className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedItems.map(item => (
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

                      <CardFooter className="px-4 py-3 border-t bg-muted/30 flex justify-between items-center mt-auto">
                        <span className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
                          item.total_stock === 0
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : item.is_low_stock
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        )}>
                          {(item.total_stock === 0 || item.is_low_stock) && <AlertTriangle className="h-3 w-3" />}
                          {item.total_stock} {item.unit}
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
              </FadeIn>
            )
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

      {/* Quick Receive Dialog */}
      <Dialog open={showReceiveDialog} onOpenChange={setShowReceiveDialog}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Прийняти товар</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!quickSelectedItemId ? (
              <div className="space-y-2">
                <Label>Знайти товар</Label>
                <Input
                  value={quickSearchQuery}
                  onChange={(e) => setQuickSearchQuery(e.target.value)}
                  placeholder="Введіть назву товару..."
                  autoFocus
                />
                {quickSearchResults.length > 0 && (
                  <div className="border rounded-lg max-h-48 overflow-y-auto">
                    {quickSearchResults.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 hover:bg-muted cursor-pointer text-sm"
                        onClick={() => setQuickSelectedItemId(item.id)}
                      >
                        <span className="font-medium">{item.name}</span>
                        <span className="text-muted-foreground">{item.total_stock} {item.unit}</span>
                      </div>
                    ))}
                  </div>
                )}
                {quickSearchQuery.length >= 2 && quickSearchResults.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-3">Товар не знайдено</p>
                )}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{selectedQuickItem?.name}</p>
                    <p className="text-xs text-muted-foreground">На складі: {selectedQuickItem?.total_stock} {selectedQuickItem?.unit}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setQuickSelectedItemId(null)}>
                    Змінити
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Скільки прийшло *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={quickQuantity}
                      onChange={(e) => setQuickQuantity(e.target.value)}
                      placeholder="10"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ціна за одиницю</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={quickUnitPrice}
                      onChange={(e) => setQuickUnitPrice(e.target.value)}
                      placeholder="0.00 грн"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Номер партії</Label>
                    <Input
                      value={quickBatchNumber}
                      onChange={(e) => setQuickBatchNumber(e.target.value)}
                      placeholder="LOT-2024-03"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Термін придатності</Label>
                    <Input
                      type="date"
                      value={quickExpiryDate}
                      onChange={(e) => setQuickExpiryDate(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReceiveDialog(false)}>Скасувати</Button>
            <Button onClick={handleQuickReceive} disabled={!quickSelectedItemId || !quickQuantity || quickLoading}>
              {quickLoading ? 'Збереження...' : 'Прийняти'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Write-Off Dialog */}
      <Dialog open={showWriteOffDialog} onOpenChange={setShowWriteOffDialog}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Списати товар</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!quickSelectedItemId ? (
              <div className="space-y-2">
                <Label>Знайти товар</Label>
                <Input
                  value={quickSearchQuery}
                  onChange={(e) => setQuickSearchQuery(e.target.value)}
                  placeholder="Введіть назву товару..."
                  autoFocus
                />
                {quickSearchResults.length > 0 && (
                  <div className="border rounded-lg max-h-48 overflow-y-auto">
                    {quickSearchResults.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 hover:bg-muted cursor-pointer text-sm"
                        onClick={() => setQuickSelectedItemId(item.id)}
                      >
                        <span className="font-medium">{item.name}</span>
                        <span className="text-muted-foreground">{item.total_stock} {item.unit}</span>
                      </div>
                    ))}
                  </div>
                )}
                {quickSearchQuery.length >= 2 && quickSearchResults.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-3">Товар не знайдено</p>
                )}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{selectedQuickItem?.name}</p>
                    <p className="text-xs text-muted-foreground">На складі: {selectedQuickItem?.total_stock} {selectedQuickItem?.unit}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setQuickSelectedItemId(null)}>
                    Змінити
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Скільки списати *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={quickQuantity}
                    onChange={(e) => setQuickQuantity(e.target.value)}
                    placeholder="Кількість"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label>Причина списання</Label>
                  <Input
                    value={quickNotes}
                    onChange={(e) => setQuickNotes(e.target.value)}
                    placeholder="Прострочено, зіпсовано, використано..."
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWriteOffDialog(false)}>Скасувати</Button>
            <Button
              variant="destructive"
              onClick={handleQuickWriteOff}
              disabled={!quickSelectedItemId || !quickQuantity || quickLoading}
            >
              {quickLoading ? 'Списання...' : 'Списати'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
