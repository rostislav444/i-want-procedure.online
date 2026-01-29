'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { positionsApi, servicesApi, categoriesApi, PositionDetail, Service, ServiceCategory } from '@/lib/api'
import { useCompany } from '@/contexts/CompanyContext'
import {
  ArrowLeft,
  Scissors,
  Users,
  Clock,
  Check,
  X,
  UserPlus,
  Plus,
  Search,
  Minus,
  Folder,
  Sparkles,
  FileText,
  Link2,
  Loader2,
} from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'

const POSITION_COLORS: Record<string, string> = {
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  green: 'bg-green-500',
  orange: 'bg-orange-500',
  pink: 'bg-pink-500',
  cyan: 'bg-cyan-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
}

export default function PositionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const positionId = Number(params.id)
  const { companyType, canManageTeam } = useCompany()

  const [position, setPosition] = useState<PositionDetail | null>(null)
  const [allServices, setAllServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [loading, setLoading] = useState(true)

  // Services modal
  const [servicesModalOpen, setServicesModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [savingService, setSavingService] = useState<number | null>(null)

  // Create service modal
  const [createServiceModalOpen, setCreateServiceModalOpen] = useState(false)
  const [newServiceData, setNewServiceData] = useState({
    name: '',
    duration_minutes: 60,
    price: 0,
    category_id: null as number | null,
  })
  const [creatingService, setCreatingService] = useState(false)

  // Create category modal
  const [createCategoryModalOpen, setCreateCategoryModalOpen] = useState(false)
  const [newCategoryData, setNewCategoryData] = useState({
    name: '',
    description: '',
    parent_id: null as number | null,
  })
  const [creatingCategory, setCreatingCategory] = useState(false)

  // AI Generation modal
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiSourceType, setAiSourceType] = useState<'text' | 'url'>('text')
  const [aiContent, setAiContent] = useState('')
  const [aiInstructions, setAiInstructions] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiResult, setAiResult] = useState<{
    services: Array<{
      name: string
      description: string
      duration_minutes: number
      price: number
      category_name: string
      selected: boolean
    }>
    categories: string[]
  } | null>(null)
  const [aiSaving, setAiSaving] = useState(false)

  useEffect(() => {
    if (companyType && companyType !== 'clinic') {
      router.push('/admin')
      return
    }
    loadData()
  }, [positionId, companyType])

  const loadData = async () => {
    try {
      setLoading(true)
      const [positionData, servicesData, categoriesData] = await Promise.all([
        positionsApi.getById(positionId),
        servicesApi.getAll(),
        categoriesApi.getTree(),
      ])
      setPosition(positionData)
      setAllServices(servicesData)
      setCategories(categoriesData)
    } catch (error) {
      console.error('Failed to load data:', error)
      router.push('/admin/team')
    } finally {
      setLoading(false)
    }
  }

  // Flatten categories tree for dropdown
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

  const getColorClass = (color: string | null) => {
    return POSITION_COLORS[color || ''] || 'bg-gray-500'
  }

  // Get services not assigned to this position
  const getAvailableServices = () => {
    const assignedIds = new Set(position?.services.map(s => s.id) || [])
    return allServices
      .filter(s => !assignedIds.has(s.id) && s.is_active)
      .filter(s =>
        searchQuery === '' ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
  }

  const handleAssignService = async (serviceId: number) => {
    try {
      setSavingService(serviceId)
      await servicesApi.update(serviceId, { position_id: positionId })
      await loadData()
    } catch (error) {
      console.error('Failed to assign service:', error)
    } finally {
      setSavingService(null)
    }
  }

  const handleRemoveService = async (serviceId: number) => {
    try {
      setSavingService(serviceId)
      await servicesApi.update(serviceId, { position_id: null })
      await loadData()
    } catch (error) {
      console.error('Failed to remove service:', error)
    } finally {
      setSavingService(null)
    }
  }

  const handleCreateService = async () => {
    if (!newServiceData.name.trim()) return

    try {
      setCreatingService(true)
      await servicesApi.create({
        name: newServiceData.name,
        duration_minutes: newServiceData.duration_minutes,
        price: newServiceData.price,
        category_id: newServiceData.category_id || undefined,
        position_id: positionId,
      })
      await loadData()
      setCreateServiceModalOpen(false)
      setNewServiceData({ name: '', duration_minutes: 60, price: 0, category_id: null })
    } catch (error) {
      console.error('Failed to create service:', error)
    } finally {
      setCreatingService(false)
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategoryData.name.trim()) return

    try {
      setCreatingCategory(true)
      const newCategory = await categoriesApi.create({
        name: newCategoryData.name,
        description: newCategoryData.description || undefined,
        parent_id: newCategoryData.parent_id || undefined,
      })

      // Reload categories and select the new one
      const updatedCategories = await categoriesApi.getTree()
      setCategories(updatedCategories)
      setNewServiceData({ ...newServiceData, category_id: newCategory.id })

      setCreateCategoryModalOpen(false)
      setNewCategoryData({ name: '', description: '', parent_id: null })
    } catch (error) {
      console.error('Failed to create category:', error)
    } finally {
      setCreatingCategory(false)
    }
  }

  const handleAiGenerate = async () => {
    if (!aiContent.trim() || !position) return

    try {
      setAiGenerating(true)
      setAiResult(null)

      const result = await servicesApi.generateFromAI({
        position_name: position.name,
        source_type: aiSourceType,
        content: aiContent,
        city: 'Київ',
        additional_instructions: aiInstructions || undefined,
      })

      setAiResult({
        services: result.services.map(s => ({ ...s, selected: true })),
        categories: result.categories,
      })
    } catch (error) {
      console.error('Failed to generate services:', error)
      alert('Помилка генерації послуг. Спробуйте ще раз.')
    } finally {
      setAiGenerating(false)
    }
  }

  const handleAiSaveSelected = async () => {
    if (!aiResult || !position) return

    const selectedServices = aiResult.services.filter(s => s.selected)
    if (selectedServices.length === 0) {
      alert('Оберіть хоча б одну послугу')
      return
    }

    try {
      setAiSaving(true)

      // First, create categories that don't exist
      const existingCategoryNames = new Set(
        categories.flatMap(c => [c.name, ...(c.children?.map(ch => ch.name) || [])])
      )
      const newCategoryNames = new Set(
        selectedServices.map(s => s.category_name).filter(name => !existingCategoryNames.has(name))
      )

      const categoryMap: Record<string, number> = {}

      // Map existing categories
      for (const cat of categories) {
        categoryMap[cat.name] = cat.id
        for (const child of cat.children || []) {
          categoryMap[child.name] = child.id
        }
      }

      // Create new categories
      for (const name of Array.from(newCategoryNames)) {
        const newCat = await categoriesApi.create({ name })
        categoryMap[name] = newCat.id
      }

      // Create services
      for (const service of selectedServices) {
        await servicesApi.create({
          name: service.name,
          description: service.description,
          duration_minutes: service.duration_minutes,
          price: service.price,
          category_id: categoryMap[service.category_name],
          position_id: positionId,
        })
      }

      // Reload data
      await loadData()

      // Close modal and reset
      setAiModalOpen(false)
      setAiResult(null)
      setAiContent('')
      setAiInstructions('')
    } catch (error) {
      console.error('Failed to save services:', error)
      alert('Помилка збереження послуг')
    } finally {
      setAiSaving(false)
    }
  }

  const toggleServiceSelection = (index: number) => {
    if (!aiResult) return
    const updated = [...aiResult.services]
    updated[index] = { ...updated[index], selected: !updated[index].selected }
    setAiResult({ ...aiResult, services: updated })
  }

  if (loading || !position) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const availableServices = getAvailableServices()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/team">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className={`w-5 h-5 rounded-full ${getColorClass(position.color)}`} />
          <div>
            <h1 className="text-2xl font-semibold">{position.name}</h1>
            {position.description && (
              <p className="text-muted-foreground">{position.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Scissors className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{position.services_count}</p>
                <p className="text-sm text-muted-foreground">Послуг</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{position.specialists_count}</p>
                <p className="text-sm text-muted-foreground">Спеціалістів</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Scissors className="h-5 w-5" />
              Послуги
            </CardTitle>
            <CardDescription>
              Послуги, які виконують спеціалісти цієї посади
            </CardDescription>
          </div>
          {canManageTeam && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setAiModalOpen(true)}>
                <Sparkles className="h-4 w-4 mr-1" />
                AI
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCreateServiceModalOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Створити
              </Button>
              <Button size="sm" onClick={() => setServicesModalOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Призначити
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {position.services.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Scissors className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>До цієї посади ще не прикріплено послуги</p>
              <div className="flex justify-center gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => setCreateServiceModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Створити нову
                </Button>
                <Button size="sm" onClick={() => setServicesModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Призначити існуючу
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {position.services.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                >
                  <Link href={`/admin/services/${service.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <Scissors className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium group-hover:text-primary transition-colors truncate">
                        {service.name}
                      </p>
                      {service.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {service.description}
                        </p>
                      )}
                    </div>
                  </Link>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {service.duration_minutes} хв
                    </div>
                    <span className="font-bold text-primary">{service.price} грн</span>
                    {service.is_active ? (
                      <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                        <Check className="h-3 w-3" />
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-red-500/10 text-red-600">
                        <X className="h-3 w-3" />
                      </Badge>
                    )}
                    {canManageTeam && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.preventDefault()
                          handleRemoveService(service.id)
                        }}
                        disabled={savingService === service.id}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Specialists */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Спеціалісти
            </CardTitle>
            <CardDescription>
              Спеціалісти, які працюють на цій посаді
            </CardDescription>
          </div>
          <Link href="/admin/team">
            <Button variant="outline" size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Призначити
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {position.specialists.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>На цій посаді ще немає спеціалістів</p>
              <p className="text-sm">
                Перейдіть на сторінку команди, щоб призначити посаду спеціалістам
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {position.specialists.map((specialist) => (
                <Link key={specialist.id} href={`/admin/team/${specialist.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                        {specialist.first_name[0]}{specialist.last_name[0]}
                      </div>
                      <div>
                        <p className="font-medium group-hover:text-primary transition-colors">
                          {specialist.first_name} {specialist.last_name}
                        </p>
                        {specialist.email && (
                          <p className="text-sm text-muted-foreground">{specialist.email}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {specialist.is_active ? (
                        <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                          <Check className="h-3 w-3 mr-1" />
                          Активний
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-red-500/10 text-red-600">
                          <X className="h-3 w-3 mr-1" />
                          Неактивний
                        </Badge>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign Services Modal */}
      <Dialog open={servicesModalOpen} onOpenChange={setServicesModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Призначити послуги</DialogTitle>
            <DialogDescription>
              Оберіть послуги для посади "{position.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Пошук послуг..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 -mx-6 px-6">
            {availableServices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Scissors className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {searchQuery ? 'Послуг не знайдено' : 'Всі послуги вже призначені'}
                </p>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    setServicesModalOpen(false)
                    setCreateServiceModalOpen(true)
                  }}
                >
                  Створити нову послугу
                </Button>
              </div>
            ) : (
              <div className="space-y-2 py-2">
                {availableServices.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{service.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {service.duration_minutes} хв • {service.price} грн
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAssignService(service.id)}
                      disabled={savingService === service.id}
                    >
                      {savingService === service.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-1" />
                          Додати
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter className="flex-row justify-between sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setServicesModalOpen(false)
                setCreateServiceModalOpen(true)
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Створити нову
            </Button>
            <Button variant="ghost" onClick={() => setServicesModalOpen(false)}>
              Закрити
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Service Modal */}
      <Dialog open={createServiceModalOpen} onOpenChange={setCreateServiceModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Нова послуга</DialogTitle>
            <DialogDescription>
              Послуга буде автоматично призначена до посади "{position.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="serviceName">Назва послуги *</Label>
              <Input
                id="serviceName"
                value={newServiceData.name}
                onChange={(e) => setNewServiceData({ ...newServiceData, name: e.target.value })}
                placeholder="Наприклад: Чистка обличчя"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceCategory" className="flex items-center gap-1">
                <Folder className="h-4 w-4" />
                Категорія
              </Label>
              <div className="flex gap-2">
                <select
                  id="serviceCategory"
                  value={newServiceData.category_id || ''}
                  onChange={(e) => setNewServiceData({ ...newServiceData, category_id: e.target.value ? Number(e.target.value) : null })}
                  className="flex-1 h-10 px-3 border rounded-md bg-background text-sm"
                >
                  <option value="">Без категорії</option>
                  {getFlatCategories(categories).map(c => (
                    <option key={c.id} value={c.id}>
                      {'—'.repeat(c.level)} {c.name}
                    </option>
                  ))}
                </select>
                <Button variant="outline" type="button" onClick={() => setCreateCategoryModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Нова
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Тривалість (хв)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={newServiceData.duration_minutes}
                  onChange={(e) => setNewServiceData({ ...newServiceData, duration_minutes: parseInt(e.target.value) || 0 })}
                  min={15}
                  step={15}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Ціна (грн)</Label>
                <Input
                  id="price"
                  type="number"
                  value={newServiceData.price}
                  onChange={(e) => setNewServiceData({ ...newServiceData, price: parseFloat(e.target.value) || 0 })}
                  min={0}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateServiceModalOpen(false)}>
              Скасувати
            </Button>
            <Button
              onClick={handleCreateService}
              disabled={!newServiceData.name.trim() || creatingService}
            >
              {creatingService ? 'Створення...' : 'Створити'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Category Modal */}
      <Dialog open={createCategoryModalOpen} onOpenChange={setCreateCategoryModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Нова категорія</DialogTitle>
            <DialogDescription>
              Створіть нову категорію для організації послуг
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Назва категорії *</Label>
              <Input
                id="categoryName"
                value={newCategoryData.name}
                onChange={(e) => setNewCategoryData({ ...newCategoryData, name: e.target.value })}
                placeholder="Наприклад: Косметологія"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryDescription">Опис</Label>
              <Input
                id="categoryDescription"
                value={newCategoryData.description}
                onChange={(e) => setNewCategoryData({ ...newCategoryData, description: e.target.value })}
                placeholder="Короткий опис категорії..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parentCategory">Батьківська категорія</Label>
              <select
                id="parentCategory"
                value={newCategoryData.parent_id || ''}
                onChange={(e) => setNewCategoryData({ ...newCategoryData, parent_id: e.target.value ? Number(e.target.value) : null })}
                className="w-full h-10 px-3 border rounded-md bg-background text-sm"
              >
                <option value="">Без батьківської (верхній рівень)</option>
                {getFlatCategories(categories).map(c => (
                  <option key={c.id} value={c.id}>
                    {'—'.repeat(c.level)} {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateCategoryModalOpen(false)}>
              Скасувати
            </Button>
            <Button
              onClick={handleCreateCategory}
              disabled={!newCategoryData.name.trim() || creatingCategory}
            >
              {creatingCategory ? 'Створення...' : 'Створити'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Generation Modal */}
      <Dialog open={aiModalOpen} onOpenChange={(open) => {
        setAiModalOpen(open)
        if (!open) {
          setAiResult(null)
          setAiContent('')
          setAiInstructions('')
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Генерація послуг з AI
            </DialogTitle>
            <DialogDescription>
              Опишіть послуги текстом або вставте посилання на сайт - AI створить список послуг автоматично
            </DialogDescription>
          </DialogHeader>

          {!aiResult ? (
            <div className="space-y-4 py-4">
              {/* Source Type Selector */}
              <div className="flex gap-2">
                <Button
                  variant={aiSourceType === 'text' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAiSourceType('text')}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Текст
                </Button>
                <Button
                  variant={aiSourceType === 'url' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAiSourceType('url')}
                >
                  <Link2 className="h-4 w-4 mr-1" />
                  Посилання
                </Button>
              </div>

              {/* Content Input */}
              <div className="space-y-2">
                <Label>
                  {aiSourceType === 'text' ? 'Опис послуг' : 'URL сайту'}
                </Label>
                {aiSourceType === 'text' ? (
                  <Textarea
                    value={aiContent}
                    onChange={(e) => setAiContent(e.target.value)}
                    placeholder="Опишіть послуги, які надає спеціаліст. Наприклад: чистки обличчя, пілінги, масажі, ін'єкційні процедури..."
                    rows={6}
                  />
                ) : (
                  <Input
                    value={aiContent}
                    onChange={(e) => setAiContent(e.target.value)}
                    placeholder="https://example.com/services"
                  />
                )}
              </div>

              {/* Additional Instructions */}
              <div className="space-y-2">
                <Label>Додаткові вимоги (опціонально)</Label>
                <Input
                  value={aiInstructions}
                  onChange={(e) => setAiInstructions(e.target.value)}
                  placeholder="Наприклад: ціни вище середнього, тільки апаратні процедури..."
                />
              </div>

              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <p><strong>Посада:</strong> {position?.name}</p>
                <p><strong>Місто:</strong> Київ (для орієнтовних цін)</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Знайдено {aiResult.services.length} послуг. Оберіть ті, які хочете додати:
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAiResult({
                      ...aiResult,
                      services: aiResult.services.map(s => ({ ...s, selected: true }))
                    })}
                  >
                    Вибрати всі
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAiResult({
                      ...aiResult,
                      services: aiResult.services.map(s => ({ ...s, selected: false }))
                    })}
                  >
                    Зняти всі
                  </Button>
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {aiResult.services.map((service, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      service.selected ? 'bg-primary/5 border-primary/30' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => toggleServiceSelection(index)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        service.selected ? 'bg-primary border-primary' : 'border-gray-300'
                      }`}>
                        {service.selected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-medium">{service.name}</h4>
                          <Badge variant="secondary">{service.category_name}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                        <div className="flex gap-4 mt-2 text-sm">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {service.duration_minutes} хв
                          </span>
                          <span className="font-medium text-primary">
                            {service.price} грн
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setAiResult(null)}
              >
                Згенерувати знову
              </Button>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setAiModalOpen(false)}>
              Скасувати
            </Button>
            {!aiResult ? (
              <Button
                onClick={handleAiGenerate}
                disabled={!aiContent.trim() || aiGenerating}
              >
                {aiGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Генерація...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Згенерувати
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleAiSaveSelected}
                disabled={aiSaving || aiResult.services.filter(s => s.selected).length === 0}
              >
                {aiSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Збереження...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Додати {aiResult.services.filter(s => s.selected).length} послуг
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
