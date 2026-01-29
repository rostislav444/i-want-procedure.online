'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowDownUp, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { inventoryApi, StockMovement, InventoryItemListItem } from '@/lib/api'

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

export default function InventoryMovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [items, setItems] = useState<InventoryItemListItem[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const [selectedType, setSelectedType] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [selectedItemId, selectedType])

  const loadData = async () => {
    setLoading(true)
    try {
      const [movementsData, itemsResponse] = await Promise.all([
        inventoryApi.getAllMovements({
          item_id: selectedItemId || undefined,
          movement_type: selectedType || undefined,
          limit: 100,
        }),
        inventoryApi.getItems({ page_size: 100 }),
      ])
      setMovements(movementsData)
      setItems(itemsResponse.items)
    } catch (error) {
      console.error('Error loading movements:', error)
    } finally {
      setLoading(false)
    }
  }

  // Group movements by date
  const groupedMovements = movements.reduce((groups, movement) => {
    const date = new Date(movement.created_at).toLocaleDateString('uk-UA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(movement)
    return groups
  }, {} as Record<string, StockMovement[]>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/inventory">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Рух товарів</h1>
            <p className="text-sm text-muted-foreground">
              Журнал всіх операцій на складі
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select
          value={selectedItemId?.toString() || 'all'}
          onValueChange={(v) => setSelectedItemId(v === 'all' ? null : parseInt(v))}
        >
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Всі товари" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Всі товари</SelectItem>
            {items.map(item => (
              <SelectItem key={item.id} value={item.id.toString()}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedType || 'all'}
          onValueChange={(v) => setSelectedType(v === 'all' ? null : v)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Всі типи" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Всі типи</SelectItem>
            <SelectItem value="incoming">Приход</SelectItem>
            <SelectItem value="outgoing">Витрата</SelectItem>
            <SelectItem value="sale">Продаж</SelectItem>
            <SelectItem value="adjustment">Коригування</SelectItem>
            <SelectItem value="write_off">Списання</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Movements List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowDownUp className="h-5 w-5" />
            Історія руху
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : movements.length > 0 ? (
            <div className="space-y-6">
              {Object.entries(groupedMovements).map(([date, dayMovements]) => (
                <div key={date}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3 capitalize">
                    {date}
                  </h3>
                  <div className="space-y-2">
                    {dayMovements.map(movement => (
                      <div
                        key={movement.id}
                        className="flex items-start gap-4 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className={`w-3 h-3 rounded-full mt-1.5 ${MOVEMENT_TYPE_COLORS[movement.movement_type]}`} />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">
                              {MOVEMENT_TYPE_LABELS[movement.movement_type]}
                            </Badge>
                            <span className={`font-bold ${movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                            </span>
                          </div>

                          <Link
                            href={`/admin/inventory/${movement.item_id}`}
                            className="font-medium hover:underline"
                          >
                            {movement.item_name}
                          </Link>

                          {movement.notes && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {movement.notes}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                            {movement.batch_number && (
                              <span>Партія: {movement.batch_number}</span>
                            )}
                            {movement.expiry_date && (
                              <span>
                                Придатний до: {new Date(movement.expiry_date).toLocaleDateString('uk-UA')}
                              </span>
                            )}
                            {movement.unit_price && (
                              <span>Ціна: {movement.unit_price} грн</span>
                            )}
                          </div>
                        </div>

                        <div className="text-right text-sm text-muted-foreground">
                          <div>{new Date(movement.created_at).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}</div>
                          {movement.performed_by_name && (
                            <div className="text-xs">{movement.performed_by_name}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Руху товарів ще не було</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
