'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, Trash2, Clock, Plus, X, Package, ListOrdered, Folder, Briefcase, Banknote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ProtocolTemplateEditor } from '@/components/protocols/ProtocolTemplateEditor'
import { servicesApi, positionsApi, inventoryApi, Service, ServiceStep, ServiceProduct, Position, ServiceInventoryItem, InventoryItemListItem } from '@/lib/api'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCompany } from '@/contexts/CompanyContext'

export default function ServiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const serviceId = Number(params.id)
  const { companyType } = useCompany()

  const [service, setService] = useState<Service | null>(null)
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)

  // Inventory items for auto-deduction
  const [serviceInventoryItems, setServiceInventoryItems] = useState<ServiceInventoryItem[]>([])
  const [availableInventoryItems, setAvailableInventoryItems] = useState<InventoryItemListItem[]>([])
  const [showNewInventoryItem, setShowNewInventoryItem] = useState(false)
  const [newInventoryItem, setNewInventoryItem] = useState({ item_id: 0, quantity: 1 })

  // New step/product forms
  const [showNewStep, setShowNewStep] = useState(false)
  const [newStep, setNewStep] = useState({ title: '', description: '', duration_minutes: 0 })
  const [showNewProduct, setShowNewProduct] = useState(false)
  const [newProduct, setNewProduct] = useState({ name: '', description: '', manufacturer: '' })

  useEffect(() => {
    loadData()
  }, [serviceId, companyType])

  const loadData = async () => {
    try {
      const promises: Promise<any>[] = [
        servicesApi.getById(serviceId),
        inventoryApi.getServiceItems(serviceId),
        inventoryApi.getItems({ page_size: 200 }),
      ]
      // Only load positions for clinics
      if (companyType === 'clinic') {
        promises.push(positionsApi.getAll())
      }

      const results = await Promise.all(promises)
      const serviceData = results[0] as Service
      const inventoryItemsData = results[1] as ServiceInventoryItem[]
      const availableItemsResponse = results[2] as { items: InventoryItemListItem[] }
      const positionsData = results[3] as Position[] | undefined

      setService(serviceData)
      setServiceInventoryItems(inventoryItemsData)
      setAvailableInventoryItems(availableItemsResponse.items)
      if (positionsData) {
        setPositions(positionsData)
      }
    } catch (error) {
      console.error('Error loading service:', error)
      router.push('/admin/services')
    } finally {
      setLoading(false)
    }
  }

  // Get position name by id
  const getPositionName = (id: number | null): string | null => {
    if (!id) return null
    return positions.find(p => p.id === id)?.name || null
  }

  const handleDelete = async () => {
    if (confirm('Ви впевнені, що хочете видалити цю послугу?')) {
      try {
        await servicesApi.delete(serviceId)
        router.push('/admin/services')
      } catch (error) {
        console.error('Error deleting service:', error)
      }
    }
  }

  const handleAddStep = async () => {
    if (!newStep.title) return
    try {
      const order = (service?.steps?.length || 0) + 1
      await servicesApi.addStep(serviceId, { ...newStep, order })
      await loadData()
      setNewStep({ title: '', description: '', duration_minutes: 0 })
      setShowNewStep(false)
    } catch (error) {
      console.error('Error adding step:', error)
    }
  }

  const handleDeleteStep = async (stepId: number) => {
    try {
      await servicesApi.deleteStep(serviceId, stepId)
      await loadData()
    } catch (error) {
      console.error('Error deleting step:', error)
    }
  }

  const handleAddProduct = async () => {
    if (!newProduct.name) return
    try {
      await servicesApi.addProduct(serviceId, newProduct)
      await loadData()
      setNewProduct({ name: '', description: '', manufacturer: '' })
      setShowNewProduct(false)
    } catch (error) {
      console.error('Error adding product:', error)
    }
  }

  const handleDeleteProduct = async (productId: number) => {
    try {
      await servicesApi.deleteProduct(serviceId, productId)
      await loadData()
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  const handleAddInventoryItem = async () => {
    if (!newInventoryItem.item_id) return
    try {
      await inventoryApi.addServiceItem(serviceId, newInventoryItem)
      await loadData()
      setNewInventoryItem({ item_id: 0, quantity: 1 })
      setShowNewInventoryItem(false)
    } catch (error) {
      console.error('Error adding inventory item:', error)
    }
  }

  const handleRemoveInventoryItem = async (itemId: number) => {
    try {
      await inventoryApi.removeServiceItem(serviceId, itemId)
      await loadData()
    } catch (error) {
      console.error('Error removing inventory item:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!service) return null

  return (
    <div className="space-y-6">
      {/* Service Header Card */}
      <Card className="overflow-hidden">
        <div className="p-6 pb-0">
          {/* Top row: back button + actions */}
          <div className="flex items-center justify-between mb-4">
            <Link href="/admin/services">
              <Button variant="ghost" size="sm" className="gap-2 -ml-2">
                <ArrowLeft className="h-4 w-4" />
                Послуги
              </Button>
            </Link>
            <div className="flex gap-2">
              <Link href={`/admin/services/${serviceId}/edit`}>
                <Button variant="outline" size="sm">
                  <Pencil className="mr-2 h-4 w-4" />
                  Редагувати
                </Button>
              </Link>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Service title and description */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold">{service.name}</h1>
            {service.description ? (
              <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
            ) : (
              <p className="text-sm text-muted-foreground/60 italic mt-1">Опис не вказано</p>
            )}
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-4 border-t border-border">
          <div className="flex items-center gap-2.5 px-6 py-3 border-r border-border">
            <Folder className="h-5 w-5 text-amber-500" />
            <span>{service.category?.name || 'Без категорії'}</span>
          </div>
          <div className="flex items-center gap-2.5 px-6 py-3 border-r border-border">
            <Briefcase className="h-5 w-5 text-blue-500" />
            <span>{getPositionName(service.position_id || null) || 'Без посади'}</span>
          </div>
          <div className="flex items-center gap-2.5 px-6 py-3 border-r border-border">
            <Clock className="h-5 w-5 text-emerald-500" />
            <span>{service.duration_minutes} хв</span>
          </div>
          <div className="flex items-center gap-2.5 px-6 py-3">
            <Banknote className="h-5 w-5 text-pink-500" />
            <span>{service.price} грн</span>
          </div>
        </div>
      </Card>

      {/* Steps */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ListOrdered className="h-5 w-5" />
            Етапи процедури
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setShowNewStep(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Додати етап
          </Button>
        </CardHeader>
        <CardContent>
          {showNewStep && (
            <div className="mb-4 p-4 border rounded-lg bg-muted/50">
              <div className="grid gap-3">
                <Input
                  placeholder="Назва етапу"
                  value={newStep.title}
                  onChange={(e) => setNewStep({ ...newStep, title: e.target.value })}
                />
                <textarea
                  className="w-full px-3 py-2 border rounded-md text-sm bg-background"
                  placeholder="Опис етапу (необов'язково)"
                  value={newStep.description}
                  onChange={(e) => setNewStep({ ...newStep, description: e.target.value })}
                />
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Тривалість (хв)"
                    className="w-32"
                    value={newStep.duration_minutes || ''}
                    onChange={(e) => setNewStep({ ...newStep, duration_minutes: parseInt(e.target.value) || 0 })}
                  />
                  <span className="text-sm text-muted-foreground">хв</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddStep}>Додати</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowNewStep(false)}>Скасувати</Button>
                </div>
              </div>
            </div>
          )}

          {service.steps && service.steps.length > 0 ? (
            <div className="space-y-3">
              {service.steps.map((step, index) => (
                <div key={step.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{step.title}</h4>
                    {step.description && (
                      <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                    )}
                    {step.duration_minutes && (
                      <p className="text-xs text-muted-foreground/70 mt-1">{step.duration_minutes} хв</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-red-500"
                    onClick={() => step.id && handleDeleteStep(step.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">Етапи не додано</p>
          )}
        </CardContent>
      </Card>

      {/* Products */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Препарати та продукти
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setShowNewProduct(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Додати препарат
          </Button>
        </CardHeader>
        <CardContent>
          {showNewProduct && (
            <div className="mb-4 p-4 border rounded-lg bg-muted/50">
              <div className="grid gap-3">
                <Input
                  placeholder="Назва препарату"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                />
                <Input
                  placeholder="Виробник (необов'язково)"
                  value={newProduct.manufacturer}
                  onChange={(e) => setNewProduct({ ...newProduct, manufacturer: e.target.value })}
                />
                <textarea
                  className="w-full px-3 py-2 border rounded-md text-sm bg-background"
                  placeholder="Опис (необов'язково)"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddProduct}>Додати</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowNewProduct(false)}>Скасувати</Button>
                </div>
              </div>
            </div>
          )}

          {service.products && service.products.length > 0 ? (
            <div className="grid gap-3">
              {service.products.map((product) => (
                <div key={product.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-500/10 text-violet-500 dark:bg-violet-400/20 dark:text-violet-400">
                    <Package className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{product.name}</h4>
                    {product.manufacturer && (
                      <p className="text-sm text-muted-foreground">{product.manufacturer}</p>
                    )}
                    {product.description && (
                      <p className="text-sm text-muted-foreground/70 mt-1">{product.description}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-red-500"
                    onClick={() => product.id && handleDeleteProduct(product.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">Препарати не додано</p>
          )}
        </CardContent>
      </Card>

      {/* Inventory Items for Auto-Deduction */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-lime-500" />
            Товари зі складу
            <span className="text-xs font-normal text-muted-foreground">(автосписання)</span>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setShowNewInventoryItem(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Додати товар
          </Button>
        </CardHeader>
        <CardContent>
          {showNewInventoryItem && (
            <div className="mb-4 p-4 border rounded-lg bg-muted/50">
              <div className="grid gap-3">
                <Select
                  value={newInventoryItem.item_id ? newInventoryItem.item_id.toString() : ''}
                  onValueChange={(v) => setNewInventoryItem({ ...newInventoryItem, item_id: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть товар зі складу" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableInventoryItems
                      .filter(item => !serviceInventoryItems.some(si => si.item_id === item.id))
                      .map(item => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                          {item.name} ({item.current_stock} {item.unit})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    placeholder="Кількість"
                    className="w-24"
                    value={newInventoryItem.quantity}
                    onChange={(e) => setNewInventoryItem({ ...newInventoryItem, quantity: parseInt(e.target.value) || 1 })}
                  />
                  <span className="text-sm text-muted-foreground">на процедуру</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddInventoryItem}>Додати</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowNewInventoryItem(false)}>Скасувати</Button>
                </div>
              </div>
            </div>
          )}

          {serviceInventoryItems.length > 0 ? (
            <div className="grid gap-3">
              {serviceInventoryItems.map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-lime-500/10 text-lime-500 dark:bg-lime-400/20 dark:text-lime-400">
                    <Package className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{item.item_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} {item.unit} на процедуру
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      На складі: {item.current_stock} {item.unit}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-red-500"
                    onClick={() => handleRemoveInventoryItem(item.item_id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Товари не прив'язані</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Додайте товари зі складу, які будуть автоматично списуватися при завершенні процедури
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Protocol Template */}
      <ProtocolTemplateEditor
        serviceId={serviceId}
        serviceName={service.name}
        categoryName={service.category?.name}
      />
    </div>
  )
}
