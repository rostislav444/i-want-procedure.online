'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit2, Trash2, Package, ArrowDownUp, ChevronRight, TrendingUp, TrendingDown, Boxes, Tag, Barcode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { inventoryApi, InventoryItem, StockMovement, getFileUrl } from '@/lib/api'
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
  const [loading, setLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showMovementDialog, setShowMovementDialog] = useState(false)

  // Movement form
  const [movementType, setMovementType] = useState('incoming')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')
  const [batchNumber, setBatchNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [movementLoading, setMovementLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [itemId])

  const loadData = async () => {
    setLoading(true)
    try {
      const itemData = await inventoryApi.getItem(itemId)
      setItem(itemData)

      // If this is a variant (has parent_id), load the parent to get siblings and parent movements
      if (itemData.parent_id) {
        const [parentData, variantMovements] = await Promise.all([
          inventoryApi.getItem(itemData.parent_id),
          inventoryApi.getItemMovements(itemId, false), // Only this variant's movements
        ])
        setParentItem(parentData)
        setMovements(variantMovements)
      } else {
        // Parent item - get movements including all variants
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

  const handleDelete = async () => {
    try {
      await inventoryApi.deleteItem(itemId)
      router.push('/admin/inventory')
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Помилка при видаленні товару')
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
        notes: notes || undefined,
        batch_number: batchNumber || undefined,
        expiry_date: expiryDate || undefined,
      })

      setShowMovementDialog(false)
      setMovementType('incoming')
      setQuantity('')
      setNotes('')
      setBatchNumber('')
      setExpiryDate('')
      loadData()
    } catch (error) {
      console.error('Error creating movement:', error)
      alert('Помилка при створенні руху')
    } finally {
      setMovementLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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

  // Determine display logic:
  // - isVariant: viewing a specific variant
  // - parentProduct: parent item (either current item or loaded parent)
  // - currentVariant: selected variant data (from item when isVariant, null otherwise)
  const isVariant = !!item.parent_id
  const parentProduct = isVariant && parentItem ? parentItem : item
  const currentVariant = isVariant ? item : null
  const selectedVariantId = isVariant ? itemId : null

  // Display uses parent for layout/context, current item for specific data
  const mainImage = (currentVariant?.images?.find(img => img.is_main) || currentVariant?.images?.[0])
    || parentProduct.images?.find(img => img.is_main) || parentProduct.images?.[0]
  const hasVariants = parentProduct.variants && parentProduct.variants.length > 0
  const displayStock = hasVariants ? (parentProduct.total_stock || parentProduct.current_stock) : parentProduct.current_stock

  // For title/meta: use variant if viewing variant, parent otherwise
  const displayName = currentVariant ? currentVariant.name : parentProduct.name
  const displaySku = currentVariant?.sku || parentProduct.sku
  const displayBarcode = currentVariant?.barcode || parentProduct.barcode

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
          <Card className={cn(parentProduct.is_low_stock && 'border-red-300 bg-red-50')}>
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
                <Boxes className={cn('h-8 w-8', parentProduct.is_low_stock ? 'text-red-500' : 'text-muted-foreground/30')} />
              </div>
              {parentProduct.is_low_stock && (
                <Badge variant="destructive" className="mt-2">Мало на складі</Badge>
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
                {/* Variant price (specific) */}
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
                {/* Parent price (range or single) */}
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
                {/* Margin calculation: (sale - purchase) / sale * 100 */}
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

        {/* Middle Column - Details & Variants */}
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
                  <CardTitle className="text-base">Варіанти</CardTitle>
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
                            <div className={cn(
                              'text-xs',
                              variant.is_low_stock ? 'text-red-600' : 'text-muted-foreground'
                            )}>
                              {variant.current_stock} {parentProduct.unit}
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

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

      {/* Movement Dialog */}
      <Dialog open={showMovementDialog} onOpenChange={setShowMovementDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Рух товару</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Тип руху</Label>
              <Select value={movementType} onValueChange={setMovementType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="incoming">Приход (закупка)</SelectItem>
                  <SelectItem value="outgoing">Витрата (використання)</SelectItem>
                  <SelectItem value="sale">Продаж</SelectItem>
                  <SelectItem value="adjustment">Коригування (інвентаризація)</SelectItem>
                  <SelectItem value="write_off">Списання</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Кількість *</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Введіть кількість"
              />
            </div>

            {movementType === 'incoming' && (
              <>
                <div className="space-y-2">
                  <Label>Номер партії</Label>
                  <Input
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    placeholder="ABC-2024-001"
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
              </>
            )}

            <div className="space-y-2">
              <Label>Примітка</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Додаткова інформація"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMovementDialog(false)}>
              Скасувати
            </Button>
            <Button onClick={handleCreateMovement} disabled={!quantity || movementLoading}>
              {movementLoading ? 'Збереження...' : 'Зберегти'}
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
