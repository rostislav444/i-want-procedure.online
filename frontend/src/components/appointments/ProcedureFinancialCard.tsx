'use client'

import { useState, useEffect } from 'react'
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  TrendingUp,
  Package,
  Check,
  X,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  appointmentsApi,
  inventoryApi,
  AppointmentFinancials,
  ConsumptionItem,
} from '@/lib/api'

interface ProcedureFinancialCardProps {
  appointmentId: number
}

interface InventoryItemOption {
  id: number
  name: string
  purchase_price?: number | null
  unit: string
  current_stock?: number
}

export function ProcedureFinancialCard({ appointmentId }: ProcedureFinancialCardProps) {
  const [financials, setFinancials] = useState<AppointmentFinancials | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Add material state
  const [showAddForm, setShowAddForm] = useState(false)
  const [inventoryItems, setInventoryItems] = useState<InventoryItemOption[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const [addQuantity, setAddQuantity] = useState(1)
  const [addPrice, setAddPrice] = useState<string>('')
  const [adding, setAdding] = useState(false)

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editQuantity, setEditQuantity] = useState(1)
  const [editPrice, setEditPrice] = useState<string>('')
  const [saving, setSaving] = useState(false)

  const loadFinancials = async () => {
    try {
      setLoading(true)
      const data = await appointmentsApi.getFinancials(appointmentId)
      setFinancials(data)
      setError(null)
    } catch (err) {
      setError('Не вдалося завантажити дані')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFinancials()
  }, [appointmentId])

  const loadInventoryItems = async () => {
    try {
      const response = await inventoryApi.getItems({ page_size: 200 })
      setInventoryItems(response.items || [])
    } catch (err) {
      console.error('Error loading inventory items:', err)
    }
  }

  const handleShowAddForm = () => {
    if (inventoryItems.length === 0) {
      loadInventoryItems()
    }
    setShowAddForm(true)
    setSelectedItemId(null)
    setAddQuantity(1)
    setAddPrice('')
    setSearchQuery('')
  }

  const handleAddConsumption = async () => {
    if (!selectedItemId) return

    setAdding(true)
    try {
      await appointmentsApi.addConsumption(appointmentId, {
        item_id: selectedItemId,
        quantity: addQuantity,
        unit_price: addPrice ? parseFloat(addPrice) : undefined,
      })
      setShowAddForm(false)
      await loadFinancials()
    } catch (err) {
      console.error('Error adding consumption:', err)
    } finally {
      setAdding(false)
    }
  }

  const handleStartEdit = (item: ConsumptionItem) => {
    setEditingId(item.movement_id)
    setEditQuantity(item.quantity)
    setEditPrice(item.unit_price?.toString() || '')
  }

  const handleSaveEdit = async (movementId: number) => {
    setSaving(true)
    try {
      await appointmentsApi.updateConsumption(appointmentId, movementId, {
        quantity: editQuantity,
        unit_price: editPrice ? parseFloat(editPrice) : undefined,
      })
      setEditingId(null)
      await loadFinancials()
    } catch (err) {
      console.error('Error updating consumption:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (movementId: number) => {
    try {
      await appointmentsApi.deleteConsumption(appointmentId, movementId)
      await loadFinancials()
    } catch (err) {
      console.error('Error deleting consumption:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">{error}</div>
    )
  }

  if (!financials) return null

  const filteredItems = inventoryItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !financials.consumption.some(c => c.item_id === item.id)
  )

  const selectedItem = inventoryItems.find(i => i.id === selectedItemId)

  return (
    <div className="border rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          Витрати матеріалів
        </h3>
        <Button variant="outline" size="sm" onClick={handleShowAddForm} className="gap-1">
          <Plus className="h-3.5 w-3.5" />
          Додати
        </Button>
      </div>

      {/* Consumption Table */}
      {financials.consumption.length > 0 ? (
        <div className="space-y-1">
          {financials.consumption.map((item) => (
            <div key={item.movement_id} className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-muted/50 text-sm">
              {editingId === item.movement_id ? (
                // Edit mode
                <>
                  <span className="flex-1 truncate">{item.item_name}</span>
                  <Input
                    type="number"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(parseInt(e.target.value) || 1)}
                    className="w-16 h-7 text-xs"
                    min={1}
                  />
                  <span className="text-muted-foreground text-xs">{item.unit} x</span>
                  <Input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-20 h-7 text-xs"
                    placeholder="Ціна"
                    step="0.01"
                  />
                  <span className="text-muted-foreground text-xs">грн</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => handleSaveEdit(item.movement_id)}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5 text-emerald-600" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setEditingId(null)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </>
              ) : (
                // View mode
                <>
                  <div className="flex-1 min-w-0">
                    <span className="truncate block">{item.item_name}</span>
                    {item.batch_number && (
                      <span className="text-[10px] text-muted-foreground/60">#{item.batch_number}</span>
                    )}
                  </div>
                  <span className="text-muted-foreground tabular-nums">
                    {item.quantity} {item.unit}
                  </span>
                  <span className="text-muted-foreground mx-1">x</span>
                  <span className="tabular-nums">
                    {item.unit_price != null ? `${Number(item.unit_price).toLocaleString('uk-UA')} грн` : '—'}
                  </span>
                  <span className="text-muted-foreground mx-1">=</span>
                  <span className="font-medium tabular-nums min-w-[70px] text-right">
                    {item.total_cost != null ? `${Number(item.total_cost).toLocaleString('uk-UA')} грн` : '—'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
                    onClick={() => handleStartEdit(item)}
                  >
                    <Pencil className="h-3 w-3 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
                    onClick={() => handleDelete(item.movement_id)}
                  >
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-2">
          Матеріали не використовувались
        </p>
      )}

      {/* Add Material Form */}
      {showAddForm && (
        <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Пошук товару..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          {searchQuery && filteredItems.length > 0 && !selectedItemId && (
            <div className="max-h-40 overflow-y-auto border rounded-md bg-background">
              {filteredItems.slice(0, 10).map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedItemId(item.id)
                    setSearchQuery(item.name)
                    if (item.purchase_price) {
                      setAddPrice(item.purchase_price.toString())
                    }
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center justify-between"
                >
                  <span>{item.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {item.purchase_price ? `${Number(item.purchase_price).toLocaleString('uk-UA')} грн` : ''}
                  </span>
                </button>
              ))}
            </div>
          )}
          {selectedItem && (
            <div className="flex items-center gap-2">
              <span className="text-sm flex-1 truncate">{selectedItem.name}</span>
              <Input
                type="number"
                value={addQuantity}
                onChange={(e) => setAddQuantity(parseInt(e.target.value) || 1)}
                className="w-16 h-8 text-xs"
                min={1}
                placeholder="К-сть"
              />
              <span className="text-xs text-muted-foreground">{selectedItem.unit} x</span>
              <Input
                type="number"
                value={addPrice}
                onChange={(e) => setAddPrice(e.target.value)}
                className="w-24 h-8 text-xs"
                placeholder="Ціна"
                step="0.01"
              />
              <span className="text-xs text-muted-foreground">грн</span>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
              Скасувати
            </Button>
            <Button
              size="sm"
              onClick={handleAddConsumption}
              disabled={!selectedItemId || adding}
            >
              {adding ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Додати
            </Button>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="border-t pt-3 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Витрати матеріалів</span>
          <span className="font-medium tabular-nums">
            {Number(financials.material_cost).toLocaleString('uk-UA')} грн
          </span>
        </div>
        {financials.revenue != null && (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Виручка</span>
              <span className="font-medium tabular-nums">
                {Number(financials.revenue).toLocaleString('uk-UA')} грн
              </span>
            </div>
            <div className="flex justify-between text-sm font-semibold">
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                Прибуток
              </span>
              <span className={`tabular-nums ${(financials.profit ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {Number(financials.profit ?? 0).toLocaleString('uk-UA')} грн
                {financials.margin_pct != null && (
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    ({financials.margin_pct}%)
                  </span>
                )}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
