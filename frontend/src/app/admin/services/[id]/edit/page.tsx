'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Folder, Briefcase, Save, X, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { servicesApi, globalCatalogApi, positionsApi, specialistsApi, Service, GlobalCategory, Position, SpecialistListItem } from '@/lib/api'
import { useCompany } from '@/contexts/CompanyContext'

export default function ServiceEditPage() {
  const params = useParams()
  const router = useRouter()
  const serviceId = Number(params.id)
  const { companyType, selectedCompanyId } = useCompany()

  const [service, setService] = useState<Service | null>(null)
  const [categories, setCategories] = useState<GlobalCategory[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [specialists, setSpecialists] = useState<SpecialistListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_minutes: 60,
    price: 0,
    global_category_id: null as number | null,
    position_id: null as number | null,
  })

  useEffect(() => {
    if (selectedCompanyId) {
      loadData()
    }
  }, [serviceId, companyType, selectedCompanyId])

  const loadData = async () => {
    try {
      setLoading(true)
      const promises: Promise<any>[] = [
        servicesApi.getById(serviceId),
        globalCatalogApi.getCategoriesTree(),
      ]

      if (companyType === 'clinic') {
        promises.push(positionsApi.getAll())
        if (selectedCompanyId) {
          promises.push(specialistsApi.getAll(selectedCompanyId))
        }
      }

      const results = await Promise.all(promises)
      const serviceData = results[0] as Service
      const categoriesData = results[1] as GlobalCategory[]
      const positionsData = results[2] as Position[] | undefined
      const specialistsData = results[3] as SpecialistListItem[] | undefined

      setService(serviceData)
      setCategories(categoriesData)
      if (positionsData) setPositions(positionsData)
      if (specialistsData) setSpecialists(specialistsData)

      setFormData({
        name: serviceData.name,
        description: serviceData.description || '',
        duration_minutes: serviceData.duration_minutes,
        price: serviceData.price,
        global_category_id: serviceData.global_category_id || null,
        position_id: serviceData.position_id || null,
      })
    } catch (error) {
      console.error('Error loading service:', error)
      router.push('/admin/services')
    } finally {
      setLoading(false)
    }
  }

  // Flatten categories tree for dropdown
  const getFlatCategories = (cats: GlobalCategory[], level = 0): { id: number; name: string; icon?: string; level: number }[] => {
    const result: { id: number; name: string; icon?: string; level: number }[] = []
    cats.forEach(c => {
      result.push({ id: c.id, name: c.name, icon: c.icon, level })
      if (c.children && c.children.length > 0) {
        result.push(...getFlatCategories(c.children, level + 1))
      }
    })
    return result
  }

  const handleSave = async () => {
    if (!formData.name.trim()) return

    setSaving(true)
    try {
      await servicesApi.update(serviceId, {
        name: formData.name,
        description: formData.description || undefined,
        duration_minutes: formData.duration_minutes,
        price: formData.price,
        global_category_id: formData.global_category_id || undefined,
        position_id: formData.position_id,
      })
      router.push(`/admin/services/${serviceId}`)
    } catch (error) {
      console.error('Error saving service:', error)
    } finally {
      setSaving(false)
    }
  }

  // Get specialists that have this position (if service has position)
  const getSpecialistsForPosition = () => {
    if (!formData.position_id) return []
    return specialists.filter(s => s.position_id === formData.position_id && s.is_active)
  }

  if (loading || !service) {
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

  const flatCategories = getFlatCategories(categories)
  const positionSpecialists = getSpecialistsForPosition()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/admin/services/${serviceId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">Редагування послуги</h1>
            <p className="text-muted-foreground">{service.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/services/${serviceId}`}>
            <Button variant="outline">
              <X className="h-4 w-4 mr-2" />
              Скасувати
            </Button>
          </Link>
          <Button onClick={handleSave} disabled={saving || !formData.name.trim()}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Збереження...' : 'Зберегти'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Основна інформація</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Назва послуги *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Введіть назву послуги"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Опис</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Детальний опис послуги..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Тривалість (хв)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
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
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    min={0}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Folder className="h-5 w-5" />
                Категорія
              </CardTitle>
              <CardDescription>
                Категорія допомагає клієнтам знаходити потрібні послуги
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <select
                value={formData.global_category_id || ''}
                onChange={(e) => setFormData({ ...formData, global_category_id: e.target.value ? Number(e.target.value) : null })}
                className="w-full h-10 px-3 border rounded-md bg-background text-sm"
              >
                <option value="">Без категорії</option>
                {flatCategories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.icon ? `${c.icon} ` : ''}{'—'.repeat(c.level)} {c.name}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>

          {/* Position (for clinics) */}
          {companyType === 'clinic' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Посада
                </CardTitle>
                <CardDescription>
                  Послуга буде доступна для спеціалістів з цією посадою
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <select
                  value={formData.position_id || ''}
                  onChange={(e) => setFormData({ ...formData, position_id: e.target.value ? Number(e.target.value) : null })}
                  className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                >
                  <option value="">Без посади</option>
                  {positions.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>

                {formData.position_id && positionSpecialists.length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">
                      Спеціалісти з цією посадою ({positionSpecialists.length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {positionSpecialists.map(s => (
                        <Link key={s.id} href={`/admin/team/${s.id}`}>
                          <Badge variant="secondary" className="cursor-pointer hover:bg-primary/20">
                            {s.first_name} {s.last_name}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {formData.position_id && positionSpecialists.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Немає активних спеціалістів з цією посадою
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Швидкі дії</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/admin/services/${serviceId}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  Переглянути послугу
                </Button>
              </Link>
              {companyType === 'clinic' && formData.position_id && (
                <Link href={`/admin/settings/positions/${formData.position_id}`} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Briefcase className="h-4 w-4 mr-2" />
                    Перейти до посади
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Інформація</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong>Створено:</strong>{' '}
                {new Date(service.created_at).toLocaleDateString('uk-UA')}
              </p>
              <p>
                <strong>Статус:</strong>{' '}
                {service.is_active ? 'Активна' : 'Неактивна'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  )
}
