'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { inventoryApi, InventoryCategory } from '@/lib/api'

export default function NewInventoryItemPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<InventoryCategory[]>([])

  // Form state
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [barcode, setBarcode] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState<number | undefined>()
  const [usageType, setUsageType] = useState('internal')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [unit, setUnit] = useState('шт')
  const [minStockLevel, setMinStockLevel] = useState('')
  const [manufacturer, setManufacturer] = useState('')
  const [initialStock, setInitialStock] = useState('')
  const [isAvailableForSale, setIsAvailableForSale] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const data = await inventoryApi.getCategoriesTree()
      setCategories(data)
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  // Flatten categories for select
  const flattenCategories = (cats: InventoryCategory[], level = 0): Array<InventoryCategory & { level: number }> => {
    let result: Array<InventoryCategory & { level: number }> = []
    for (const cat of cats) {
      result.push({ ...cat, level })
      if (cat.children && cat.children.length > 0) {
        result = result.concat(flattenCategories(cat.children, level + 1))
      }
    }
    return result
  }

  const flatCategories = flattenCategories(categories)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      await inventoryApi.createItem({
        name: name.trim(),
        sku: sku.trim() || undefined,
        barcode: barcode.trim() || undefined,
        description: description.trim() || undefined,
        category_id: categoryId,
        usage_type: usageType,
        purchase_price: purchasePrice ? parseFloat(purchasePrice) : undefined,
        sale_price: salePrice ? parseFloat(salePrice) : undefined,
        unit,
        min_stock_level: minStockLevel ? parseInt(minStockLevel) : undefined,
        manufacturer: manufacturer.trim() || undefined,
        is_available_for_sale: isAvailableForSale,
        initial_stock: initialStock ? parseInt(initialStock) : undefined,
      })
      router.push('/admin/inventory')
    } catch (error) {
      console.error('Error creating item:', error)
      alert('Помилка при створенні товару')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/inventory">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Новий товар</h1>
          <p className="text-sm text-muted-foreground">Додайте новий товар на склад</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Основна інформація</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Назва товару *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Введіть назву товару"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">Артикул (SKU)</Label>
                  <Input
                    id="sku"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="ABC-123"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barcode">Штрихкод</Label>
                  <Input
                    id="barcode"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="4820000000000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Опис</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Опис товару"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manufacturer">Виробник</Label>
                <Input
                  id="manufacturer"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  placeholder="Назва виробника"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Категорія</Label>
                <Select
                  value={categoryId?.toString() || 'none'}
                  onValueChange={(v) => setCategoryId(v === 'none' ? undefined : parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть категорію" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Без категорії</SelectItem>
                    {flatCategories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {'  '.repeat(cat.level)}{cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Stock */}
          <Card>
            <CardHeader>
              <CardTitle>Ціни та залишки</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="usageType">Тип використання</Label>
                <Select value={usageType} onValueChange={setUsageType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Для внутрішнього використання</SelectItem>
                    <SelectItem value="sale">Для продажу</SelectItem>
                    <SelectItem value="both">Універсальний</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(usageType === 'sale' || usageType === 'both') && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isAvailableForSale"
                    checked={isAvailableForSale}
                    onCheckedChange={(checked) => setIsAvailableForSale(checked === true)}
                  />
                  <Label htmlFor="isAvailableForSale" className="text-sm font-normal">
                    Показувати у публічному каталозі
                  </Label>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchasePrice">Ціна закупки (грн)</Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salePrice">Ціна продажу (грн)</Label>
                  <Input
                    id="salePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit">Одиниця виміру</Label>
                  <Select value={unit} onValueChange={setUnit}>
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
                  <Label htmlFor="minStockLevel">Мінімальний залишок</Label>
                  <Input
                    id="minStockLevel"
                    type="number"
                    min="0"
                    value={minStockLevel}
                    onChange={(e) => setMinStockLevel(e.target.value)}
                    placeholder="5"
                  />
                  <p className="text-xs text-muted-foreground">
                    Сповіщення коли залишок нижче цього рівня
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="initialStock">Початковий залишок</Label>
                <Input
                  id="initialStock"
                  type="number"
                  min="0"
                  value={initialStock}
                  onChange={(e) => setInitialStock(e.target.value)}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Буде створено початковий приход
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/admin/inventory">
            <Button variant="outline" type="button">
              Скасувати
            </Button>
          </Link>
          <Button type="submit" disabled={loading || !name.trim()}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Збереження...' : 'Зберегти'}
          </Button>
        </div>
      </form>
    </div>
  )
}
