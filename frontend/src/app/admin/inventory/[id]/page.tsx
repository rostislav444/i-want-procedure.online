'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit2, Trash2, Package, ArrowDownUp, ChevronRight, TrendingUp, TrendingDown, Boxes, Tag, Barcode, Save, X, AlertTriangle, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { inventoryApi, InventoryItem, StockMovement, StockBatch, InventoryCategory, getFileUrl } from '@/lib/api'
import { cn } from '@/lib/utils'

const USAGE_TYPE_LABELS: Record<string, string> = {
  internal: 'Внутрішній',
  sale: 'Продаж',
  both: 'Універсальний',
}

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  incoming: 'Приход',
  outgoing: 'Витрата',
  sale: 'Продаж',
  adjustment: 'Коригування',
  write_off: 'Списання',
}

const MOVEMENT_TYPE_COLORS: Record<string, string> = {
  incoming: 'bg-green-500',
  outgoing: 'bg-orange-500',
  sale: 'bg-blue-500',
  adjustment: 'bg-gray-500',
  write_off: 'bg-red-500',
}

export default function InventoryItemPage() {
  const params = useParams()
  const router = useRouter()
  const itemId = parseInt(params.id as string)

  const [item, setItem] = useState<InventoryItem | null>(null)
  const [parentItem, setParentItem] = useState<InventoryItem | null>(null)
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [batches, setBatches] = useState<StockBatch[]>([])
  const [loading, setLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showMovementDialog, setShowMovementDialog] = useState(false)
  const [showAllBatches, setShowAllBatches] = useState(false)

  // Edit mode
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    manufacturer: '',
    purchase_price: '',
    sale_price: '',
    unit: 'шт',
    min_stock_level: '',
    description: '',
  })
  const [editLoading, setEditLoading] = useState(false)

  // Movement form
  const [movementType, setMovementType] = useState('incoming')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')
  const [batchNumber, setBatchNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [supplier, setSupplier] = useState('')
  const [movementLoading, setMovementLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [itemId])

  const loadData = async () => {
    setLoading(true)
    try {
      const itemData = await inventoryApi.getItem(itemId)
      setItem(itemData)

      // Load batches
      const batchesData = await inventoryApi.getItemBatches(itemId, true)
      setBatches(batchesData)

      // If this is a variant (has parent_id), load the parent to get siblings and parent movements
      if (itemData.parent_id) {
        const [parentData, variantMovements] = await Promise.all([
          inventoryApi.getItem(itemData.parent_id),
          inventoryApi.getItemMovements(itemId, false),
        ])
        setParentItem(parentData)
        setMovements(variantMovements)
      } else {
        const parentMovements = await inventoryApi.getItemMovements(itemId, true)
        setParentItem(null)
        setMovements(parentMovements)
      }
    } catch (error) {
      console.error('Error loading item:', error)
    } finally {
      setLoading(false)
    }
  }

  const startEditing = () => {
    if (!item) return
    const p = item.parent_id ? item : item
    setEditForm({
      name: p.name || '',
      manufacturer: p.manufacturer || '',
      purchase_price: p.purchase_price?.toString() || '',
      sale_price: p.sale_price?.toString() || '',
      unit: p.unit || 'шт',
      min_stock_level: p.min_stock_level?.toString() || '',
      description: p.description || '',
    })
    setIsEditing(true)
  }

  const handleSaveEdit = async () => {
    if (!item) return
    setEditLoading(true)
    try {
      await inventoryApi.updateItem(itemId, {
        name: editForm.name,
        manufacturer: editForm.manufacturer || undefined,
        purchase_price: editForm.purchase_price ? parseFloat(editForm.purchase_price) : undefined,
        sale_price: editForm.sale_price ? parseFloat(editForm.sale_price) : undefined,
        unit: editForm.unit,
        min_stock_level: editForm.min_stock_level ? parseInt(editForm.min_stock_level) : undefined,
        description: editForm.description || undefined,
      })
      toast.success('Товар оновлено')
      setIsEditing(false)
      loadData()
    } catch (error) {
      console.error('Error updating item:', error)
      toast.error('Помилка при оновленні товару')
    } finally {
      setEditLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      await inventoryApi.deleteItem(itemId)
      router.push('/admin/inventory')
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error('Помилка при видаленні товару')
    }
  }

  const handleCreateMovement = async () => {
    if (!quantity) return

    setMovementLoading(true)
    try {
      const qty = parseInt(quantity)
      const finalQty = ['outgoing', 'sale', 'write_off'].includes(movementType) ? -Math.abs(qty) : Math.abs(qty)

      await inventoryApi.createMovement({
        item_id: itemId,
        movement_type: movementType,
        quantity: finalQty,
        unit_price: unitPrice ? parseFloat(unitPrice) : undefined,
        notes: notes || undefined,
        batch_number: batchNumber || undefined,
        expiry_date: expiryDate || undefined,
      })

      toast.success(movementType === 'incoming' ? 'Товар прийнято' : 'Рух збережено')
      setShowMovementDialog(false)
      setMovementType('incoming')
      setQuantity('')
      setNotes('')
      setBatchNumber('')
      setExpiryDate('')
      setUnitPrice('')
      setSupplier('')
      loadData()
    } catch (error) {
      console.error('Error creating movement:', error)
      toast.error('Помилка при створенні руху')
    } finally {
      setMovementLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
              <div className="animate-pulse space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 bg-muted rounded" style={{ opacity: 1 - i * 0.15 }} />
                ))}
              </div>
            </div>
    )
  }

  if (!item) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">Товар не знайдено</p>
        <Link href="/admin/inventory">
          <Button variant="outline">Повернутися до списку</Button>
        </Link>
      </div>
    )
  }

  const isVariant = !!item.parent_id
  const parentProduct = isVariant && parentItem ? parentItem : item
  const currentVariant = isVariant ? item : null
  const selectedVariantId = isVariant ? itemId : null

  const mainImage = (currentVariant?.images?.find(img => img.is_main) || currentVariant?.images?.[0])
    || parentProduct.images?.find(img => img.is_main) || parentProduct.images?.[0]
  const hasVariants = parentProduct.variants && parentProduct.variants.length > 0
  const displayStock = hasVariants ? (parentProduct.total_stock || parentProduct.current_stock) : parentProduct.current_stock

  const displayName = currentVariant ? currentVariant.name : parentProduct.name
  const displaySku = currentVariant?.sku || parentProduct.sku
  const displayBarcode = currentVariant?.barcode || parentProduct.barcode

  // Filter batches
  const activeBatches = batches.filter(b => b.quantity_remaining > 0)
  const displayBatches = showAllBatches ? batches : activeBatches

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href="/admin/inventory">
            <Button variant="ghost" size="icon" className="mt-1">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
              <Link href="/admin/inventory" className="hover:text-foreground">Склад</Link>
              {parentProduct.category_name && (
                <>
                  <ChevronRight className="h-3 w-3" />
                  <span>{parentProduct.category_name}</span>
                </>
              )}
              {isVariant && parentItem && (
                <>
                  <ChevronRight className="h-3 w-3" />
                  <Link href={`/admin/inventory/${parentItem.id}`} className="hover:text-foreground">
                    {parentItem.name}
                  </Link>
                </>
              )}
            </div>
            {/* Title */}
            <h1 className="text-2xl font-bold">{displayName}</h1>
            {/* Meta */}
            <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
              {displaySku && (
                <span className="flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" />
                  {displaySku}
                </span>
              )}
              {displayBarcode && (
                <span className="flex items-center gap-1">
                  <Barcode className="h-3.5 w-3.5" />
                  {displayBarcode}
                </span>
              )}
              <Badge variant={parentProduct.usage_type === 'sale' ? 'default' : 'secondary'} className="ml-1">
                {USAGE_TYPE_LABELS[parentProduct.usage_type]}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={startEditing}>
            <Edit2 className="mr-2 h-4 w-4" />
            Редагувати
          </Button>
          <Button variant="outline" onClick={() => setShowMovementDialog(true)}>
            <ArrowDownUp className="mr-2 h-4 w-4" />
            Рух товару
          </Button>
          <Button variant="outline" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Image & Stock */}
        <div className="lg:col-span-3 space-y-4">
          {/* Image */}
          <Card>
            <CardContent className="p-3">
              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                {mainImage ? (
                  <img
                    src={getFileUrl(mainImage.url)}
                    alt={displayName}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <Package className="h-12 w-12 text-muted-foreground/50" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stock Card */}
          <Card className={cn(
            displayStock === 0
              ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30'
              : parentProduct.is_low_stock
                ? 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30'
                : ''
          )}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {hasVariants ? 'Загальний залишок' : 'Залишок'}
                  </p>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-3xl font-bold">{displayStock}</span>
                    <span className="text-muted-foreground">{parentProduct.unit}</span>
                  </div>
                </div>
                <Boxes className={cn(
                  'h-8 w-8',
                  displayStock === 0 ? 'text-red-500' : parentProduct.is_low_stock ? 'text-amber-500' : 'text-muted-foreground/30'
                )} />
              </div>
              {displayStock === 0 && (
                <Badge variant="destructive" className="mt-2">Немає на складі</Badge>
              )}
              {parentProduct.is_low_stock && displayStock > 0 && (
                <Badge className="mt-2 bg-amber-500">Закінчується</Badge>
              )}
              {parentProduct.min_stock_level && (
                <p className="text-xs text-muted-foreground mt-2">
                  Мін. залишок: {parentProduct.min_stock_level} {parentProduct.unit}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Price Card */}
          {(currentVariant?.sale_price || currentVariant?.purchase_price ||
            (!currentVariant && (parentProduct.sale_price || parentProduct.purchase_price || parentProduct.min_variant_price))) && (
            <Card>
              <CardContent className="p-4 space-y-3">
                {currentVariant && currentVariant.sale_price && (
                  <div>
                    <p className="text-xs text-muted-foreground">Ціна продажу</p>
                    <p className="text-2xl font-bold text-primary">{currentVariant.sale_price} грн</p>
                  </div>
                )}
                {currentVariant && currentVariant.purchase_price && (
                  <div>
                    <p className="text-xs text-muted-foreground">Ціна закупки</p>
                    <p className="text-lg font-medium">{currentVariant.purchase_price} грн</p>
                  </div>
                )}
                {!currentVariant && (
                  <>
                    {parentProduct.min_variant_price && parentProduct.max_variant_price ? (
                      <div>
                        <p className="text-xs text-muted-foreground">Ціна варіантів</p>
                        <p className="text-2xl font-bold text-primary">
                          {parentProduct.min_variant_price === parentProduct.max_variant_price
                            ? `${parentProduct.min_variant_price} грн`
                            : `${parentProduct.min_variant_price} — ${parentProduct.max_variant_price} грн`
                          }
                        </p>
                      </div>
                    ) : parentProduct.sale_price && (
                      <div>
                        <p className="text-xs text-muted-foreground">Ціна продажу</p>
                        <p className="text-2xl font-bold text-primary">{parentProduct.sale_price} грн</p>
                      </div>
                    )}
                    {parentProduct.purchase_price && (
                      <div>
                        <p className="text-xs text-muted-foreground">Ціна закупки</p>
                        <p className="text-lg font-medium">{parentProduct.purchase_price} грн</p>
                      </div>
                    )}
                  </>
                )}
                {currentVariant && currentVariant.purchase_price && currentVariant.sale_price && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">Маржа</p>
                    <p className="text-lg font-medium text-green-600">
                      {((currentVariant.sale_price - currentVariant.purchase_price) / currentVariant.sale_price * 100).toFixed(1)}%
                    </p>
                  </div>
                )}
                {!currentVariant && parentProduct.purchase_price && parentProduct.sale_price && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">Маржа</p>
                    <p className="text-lg font-medium text-green-600">
                      {((parentProduct.sale_price - parentProduct.purchase_price) / parentProduct.sale_price * 100).toFixed(1)}%
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Middle Column - Details & Variants & Batches */}
        <div className="lg:col-span-5 space-y-4">
          {/* Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Деталі</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {parentProduct.brand_name && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Бренд</span>
                  <span className="font-medium">{parentProduct.brand_name}</span>
                </div>
              )}
              {parentProduct.collection_name && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Колекція</span>
                  <span>{parentProduct.collection_name}</span>
                </div>
              )}
              {parentProduct.manufacturer && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Виробник</span>
                  <span>{parentProduct.manufacturer}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Статус</span>
                <Badge variant={parentProduct.is_active ? 'default' : 'secondary'} className="text-xs">
                  {parentProduct.is_active ? 'Активний' : 'Неактивний'}
                </Badge>
              </div>
              {(parentProduct.usage_type === 'sale' || parentProduct.usage_type === 'both') && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Публічний каталог</span>
                  <Badge variant={parentProduct.is_available_for_sale ? 'default' : 'outline'} className="text-xs">
                    {parentProduct.is_available_for_sale ? 'Так' : 'Ні'}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Variants */}
          {hasVariants && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Різні об&#39;єми / фасовки</CardTitle>
                  <Badge variant="outline">{parentProduct.variants!.length}</Badge>
                </div>
                {parentProduct.min_variant_price && parentProduct.max_variant_price && parentProduct.min_variant_price !== parentProduct.max_variant_price && (
                  <p className="text-sm text-muted-foreground">
                    {parentProduct.min_variant_price} — {parentProduct.max_variant_price} грн
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {parentProduct.variants!.map(variant => {
                    const isSelected = selectedVariantId === variant.id
                    return (
                      <Link key={variant.id} href={`/admin/inventory/${variant.id}`}>
                        <div className={cn(
                          'flex items-center justify-between p-4 rounded-lg border transition-colors hover:bg-muted/50',
                          isSelected && 'border-primary bg-primary/10 ring-2 ring-primary'
                        )}>
                          <div className="flex items-center gap-3">
                            <div className="text-sm">
                              <span className="font-medium">{variant.name}</span>
                              {variant.sku && (
                                <p className="text-xs text-muted-foreground">{variant.sku}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right text-sm">
                            <div className="font-medium">
                              {variant.sale_price ? `${variant.sale_price} грн` : '—'}
                            </div>
                            <span className={cn(
                              'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium',
                              variant.current_stock === 0
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                : variant.is_low_stock
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                  : 'text-muted-foreground'
                            )}>
                              {(variant.current_stock === 0 || variant.is_low_stock) && <AlertTriangle className="h-2.5 w-2.5" />}
                              {variant.current_stock} {parentProduct.unit}
                            </span>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Batches */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Партії на складі</CardTitle>
                {batches.length > activeBatches.length && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => setShowAllBatches(!showAllBatches)}
                  >
                    {showAllBatches ? 'Тільки з залишком' : `Показати всі (${batches.length})`}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {displayBatches.length > 0 ? (
                <div className="space-y-2">
                  {displayBatches.map(batch => {
                    const isExpired = batch.expiry_date && new Date(batch.expiry_date) < new Date()
                    const isExpiringSoon = batch.expiry_date && !isExpired &&
                      new Date(batch.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                    const isEmpty = batch.quantity_remaining === 0

                    return (
                      <div key={batch.id} className={cn(
                        'p-3 rounded-lg border text-sm',
                        isEmpty ? 'opacity-50 bg-muted/30' :
                        isExpired ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20' :
                        isExpiringSoon ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20' : ''
                      )}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {batch.batch_number || `Партія #${batch.id}`}
                            </span>
                            {isExpired && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Прострочено</Badge>}
                            {isExpiringSoon && <Badge className="text-[10px] px-1.5 py-0 bg-amber-500">Скоро закінчиться</Badge>}
                          </div>
                          <span className={cn(
                            'font-semibold',
                            isEmpty ? 'text-muted-foreground' : 'text-green-600'
                          )}>
                            {batch.quantity_remaining} / {batch.quantity_received}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            {new Date(batch.received_at).toLocaleDateString('uk-UA')}
                          </span>
                          {batch.purchase_price && (
                            <span>{batch.purchase_price} грн/шт</span>
                          )}
                          {batch.expiry_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              до {new Date(batch.expiry_date).toLocaleDateString('uk-UA')}
                            </span>
                          )}
                          {batch.supplier && (
                            <span>{batch.supplier}</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Партій ще не створено</p>
                  <p className="text-xs mt-1">Партія створюється автоматично при прийомі товару</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attributes */}
          {parentProduct.attributes && parentProduct.attributes.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Характеристики</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {parentProduct.attributes.map(attr => (
                    <div key={attr.id} className="text-sm">
                      <p className="text-muted-foreground text-xs">{attr.group_name}</p>
                      <p className="font-medium">{attr.attribute_name}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {parentProduct.description && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Опис</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{parentProduct.description}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Movements */}
        <div className="lg:col-span-4">
          <Card className="sticky top-4">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Історія руху</CardTitle>
                {hasVariants && !currentVariant && (
                  <Badge variant="outline" className="text-xs">Всі варіанти</Badge>
                )}
                {currentVariant && (
                  <Badge variant="secondary" className="text-xs">{currentVariant.name}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {movements.length > 0 ? (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {movements.slice(0, 20).map(movement => (
                    <div key={movement.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 text-sm">
                      <div className={cn('w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0', MOVEMENT_TYPE_COLORS[movement.movement_type])} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium truncate">
                            {MOVEMENT_TYPE_LABELS[movement.movement_type]}
                          </span>
                          <span className={cn(
                            'font-bold flex-shrink-0',
                            movement.quantity > 0 ? 'text-green-600' : 'text-red-600'
                          )}>
                            {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                          </span>
                        </div>
                        {!currentVariant && movement.item_name && movement.item_name !== parentProduct.name && (
                          <p className="text-xs text-primary truncate">{movement.item_name}</p>
                        )}
                        {movement.batch_number && (
                          <p className="text-xs text-muted-foreground truncate">Партія: {movement.batch_number}</p>
                        )}
                        {movement.notes && (
                          <p className="text-xs text-muted-foreground truncate">{movement.notes}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(movement.created_at).toLocaleDateString('uk-UA')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ArrowDownUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Руху товару ще не було</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Редагувати товар</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Назва *</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Виробник</Label>
              <Input
                value={editForm.manufacturer}
                onChange={(e) => setEditForm({ ...editForm, manufacturer: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Ціна закупки</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editForm.purchase_price}
                  onChange={(e) => setEditForm({ ...editForm, purchase_price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Ціна продажу</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editForm.sale_price}
                  onChange={(e) => setEditForm({ ...editForm, sale_price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Одиниця виміру</Label>
                <Select
                  value={editForm.unit}
                  onValueChange={(v) => setEditForm({ ...editForm, unit: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="шт">шт</SelectItem>
                    <SelectItem value="мл">мл</SelectItem>
                    <SelectItem value="г">г</SelectItem>
                    <SelectItem value="упак">упак</SelectItem>
                    <SelectItem value="л">л</SelectItem>
                    <SelectItem value="кг">кг</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Мін. залишок</Label>
                <Input
                  type="number"
                  value={editForm.min_stock_level}
                  onChange={(e) => setEditForm({ ...editForm, min_stock_level: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Опис</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Скасувати
            </Button>
            <Button onClick={handleSaveEdit} disabled={!editForm.name || editLoading}>
              {editLoading ? 'Збереження...' : 'Зберегти'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Movement Dialog */}
      <Dialog open={showMovementDialog} onOpenChange={setShowMovementDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {movementType === 'incoming' ? 'Прийняти товар' :
               movementType === 'write_off' ? 'Списати товар' :
               movementType === 'sale' ? 'Продаж товару' :
               'Рух товару'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Тип операції</Label>
              <Select value={movementType} onValueChange={setMovementType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="incoming">Прийняти товар (закупка)</SelectItem>
                  <SelectItem value="outgoing">Витратити (використання)</SelectItem>
                  <SelectItem value="sale">Продати</SelectItem>
                  <SelectItem value="adjustment">Коригування (інвентаризація)</SelectItem>
                  <SelectItem value="write_off">Списати (зіпсовано, прострочено)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{movementType === 'incoming' ? 'Скільки прийшло *' : 'Кількість *'}</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={movementType === 'incoming' ? 'Скільки одиниць прийшло' : 'Введіть кількість'}
              />
            </div>

            {movementType === 'incoming' && (
              <>
                <div className="space-y-2">
                  <Label>За якою ціною купили (за одиницю)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    placeholder="0.00 грн"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Номер партії</Label>
                    <Input
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                      placeholder="напр. LOT-2024-03"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Термін придатності</Label>
                    <Input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>
                {movementType === 'write_off' ? 'Причина списання' :
                 movementType === 'outgoing' ? 'На що витрачено' :
                 'Примітка'}
              </Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  movementType === 'write_off' ? 'Прострочено, зіпсовано...' :
                  movementType === 'outgoing' ? 'Використано для процедури...' :
                  'Додаткова інформація'
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMovementDialog(false)}>
              Скасувати
            </Button>
            <Button onClick={handleCreateMovement} disabled={!quantity || movementLoading}>
              {movementLoading ? 'Збереження...' :
               movementType === 'incoming' ? 'Прийняти' :
               movementType === 'write_off' ? 'Списати' :
               'Зберегти'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити товар?</AlertDialogTitle>
            <AlertDialogDescription>
              Ця дія незворотна. Товар та вся історія руху буде видалена.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Видалити
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
