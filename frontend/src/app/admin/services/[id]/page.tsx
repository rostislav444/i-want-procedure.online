'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, Trash2, Clock, Plus, GripVertical, X, Package, ListOrdered, Folder } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { servicesApi, categoriesApi, Service, ServiceStep, ServiceProduct, ServiceCategory } from '@/lib/api'

export default function ServiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const serviceId = Number(params.id)

  const [service, setService] = useState<Service | null>(null)
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // Edit form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_minutes: 60,
    price: 0,
    category_id: null as number | null,
  })

  // New step/product forms
  const [showNewStep, setShowNewStep] = useState(false)
  const [newStep, setNewStep] = useState({ title: '', description: '', duration_minutes: 0 })
  const [showNewProduct, setShowNewProduct] = useState(false)
  const [newProduct, setNewProduct] = useState({ name: '', description: '', manufacturer: '' })

  useEffect(() => {
    loadData()
  }, [serviceId])

  const loadData = async () => {
    try {
      const [serviceData, categoriesData] = await Promise.all([
        servicesApi.getById(serviceId),
        categoriesApi.getTree(),
      ])
      setService(serviceData)
      setCategories(categoriesData)
      setFormData({
        name: serviceData.name,
        description: serviceData.description || '',
        duration_minutes: serviceData.duration_minutes,
        price: serviceData.price,
        category_id: serviceData.category_id || null,
      })
    } catch (error) {
      console.error('Error loading service:', error)
      router.push('/admin/services')
    } finally {
      setLoading(false)
    }
  }

  // Flatten categories tree for dropdown with indentation levels
  const getFlatCategories = (cats: ServiceCategory[], level = 0): { id: number; name: string; level: number }[] => {
    const result: { id: number; name: string; level: number }[] = []
    cats.forEach(c => {
      result.push({ id: c.id, name: c.name, level })
      if (c.children && c.children.length > 0) {
        result.push(...getFlatCategories(c.children, level + 1))
      }
    })
    return result
  }

  // Get category name by id
  const getCategoryName = (id: number | null): string => {
    if (!id) return ''
    const flat = getFlatCategories(categories)
    return flat.find(c => c.id === id)?.name || ''
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await servicesApi.update(serviceId, {
        ...formData,
        category_id: formData.category_id || undefined,
      })
      await loadData()
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving service:', error)
    } finally {
      setSaving(false)
    }
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/services">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{service.name}</h1>
            <p className="text-muted-foreground">
              {service.duration_minutes} хв • {service.price} грн
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Скасувати
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Збереження...' : 'Зберегти'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Редагувати
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Видалити
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main Info */}
      <Card>
        <CardHeader>
          <CardTitle>Основна інформація</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Категорія</Label>
                <select
                  id="category"
                  value={formData.category_id || ''}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value ? Number(e.target.value) : null })}
                  className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                >
                  <option value="">Без категорії</option>
                  {getFlatCategories(categories).map(c => (
                    <option key={c.id} value={c.id}>
                      {'—'.repeat(c.level)} {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Назва</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Опис</Label>
                <textarea
                  id="description"
                  className="w-full min-h-[100px] px-3 py-2 border rounded-md text-sm bg-background"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Детальний опис процедури..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Тривалість (хв)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                    min={15}
                    step={15}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Ціна (грн)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    min={0}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {service.description ? (
                <p className="text-foreground whitespace-pre-wrap">{service.description}</p>
              ) : (
                <p className="text-muted-foreground italic">Опис не вказано</p>
              )}
              <div className="flex flex-wrap gap-6 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Категорія</p>
                  <p className="font-medium flex items-center gap-1">
                    <Folder className="h-4 w-4" />
                    {service.category?.name || <span className="text-muted-foreground italic">Без категорії</span>}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Тривалість</p>
                  <p className="font-medium flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {service.duration_minutes} хв
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ціна</p>
                  <p className="font-semibold text-lg text-primary">{service.price} грн</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
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
    </div>
  )
}
