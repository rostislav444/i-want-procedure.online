'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Plus, Clock, ChevronRight, ChevronDown, FolderPlus, Pencil, Trash2, Folder, FolderOpen, PanelLeftClose, PanelLeft, X, Settings, ChevronsUpDown, ChevronsDownUp, Sparkles, FileText, Link2, Loader2, Check, LayoutGrid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { servicesApi, categoriesApi, positionsApi, Service, ServiceCategory, Position } from '@/lib/api'
import { useCompany } from '@/contexts/CompanyContext'
import { Briefcase } from 'lucide-react'

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

export default function ServicesPage() {
  const { companyType } = useCompany()
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [selectedPositionId, setSelectedPositionId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set())
  const [categoryPanelOpen, setCategoryPanelOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Refs for scrolling
  const categoryRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  // Category dialog state
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null)
  const [categoryName, setCategoryName] = useState('')
  const [categoryDescription, setCategoryDescription] = useState('')
  const [categoryParentId, setCategoryParentId] = useState<number | null>(null)
  const [savingCategory, setSavingCategory] = useState(false)

  // AI Generation modal
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiSourceType, setAiSourceType] = useState<'text' | 'url'>('text')
  const [aiContent, setAiContent] = useState('')
  const [aiInstructions, setAiInstructions] = useState('')
  const [aiPositionName, setAiPositionName] = useState('')
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

  // Sync sidebar state from localStorage
  useEffect(() => {
    const checkSidebar = () => {
      const saved = localStorage.getItem('sidebarCollapsed')
      setSidebarCollapsed(saved === 'true')
    }
    checkSidebar()
    // Listen for storage changes (when sidebar is toggled)
    window.addEventListener('storage', checkSidebar)
    // Also check periodically in case of same-tab changes
    const interval = setInterval(checkSidebar, 100)
    return () => {
      window.removeEventListener('storage', checkSidebar)
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [])

  // Collect all category IDs recursively
  const getAllCategoryIds = (cats: ServiceCategory[]): number[] => {
    const ids: number[] = []
    cats.forEach(cat => {
      ids.push(cat.id)
      if (cat.children && cat.children.length > 0) {
        ids.push(...getAllCategoryIds(cat.children))
      }
    })
    return ids
  }

  const loadData = async () => {
    try {
      const [servicesData, categoriesData, positionsData] = await Promise.all([
        servicesApi.getAll(),
        categoriesApi.getTree(),
        companyType === 'clinic' ? positionsApi.getAll() : Promise.resolve([]),
      ])
      setServices(servicesData)
      setCategories(categoriesData)
      setPositions(positionsData)
      // Expand all categories by default (including uncategorized)
      const allIds = getAllCategoryIds(categoriesData)
      allIds.push(-1) // Include uncategorized section
      setExpandedCategories(new Set(allIds))
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleCategory = (id: number) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const expandAll = () => {
    const allIds = getAllCategoryIds(categories)
    allIds.push(-1) // Include uncategorized
    setExpandedCategories(new Set(allIds))
  }

  const collapseAll = () => {
    setExpandedCategories(new Set())
  }

  // Get all ancestor IDs for a category (for expanding parent chain)
  const getCategoryAncestorIds = (categoryId: number, cats: ServiceCategory[] = categories): number[] => {
    for (const cat of cats) {
      if (cat.id === categoryId) {
        return [categoryId]
      }
      if (cat.children && cat.children.length > 0) {
        const found = getCategoryAncestorIds(categoryId, cat.children)
        if (found.length > 0) {
          return [cat.id, ...found]
        }
      }
    }
    return []
  }

  const selectCategoryFromPanel = (categoryId: number) => {
    // Get all ancestor IDs (to expand parent chain for nested categories)
    const ancestorIds = getCategoryAncestorIds(categoryId)

    // Check if category is visible (all ancestors are expanded)
    const isVisible = ancestorIds.every(id => expandedCategories.has(id))

    if (!isVisible) {
      // Expand this category and its ancestors
      setExpandedCategories(prev => {
        const next = new Set(prev)
        ancestorIds.forEach(id => next.add(id))
        return next
      })
    }

    // Scroll to category after a short delay for DOM update
    setTimeout(() => {
      const element = categoryRefs.current.get(categoryId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  const openCategoryDialog = (category?: ServiceCategory, parentId?: number) => {
    setEditingCategory(category || null)
    setCategoryName(category?.name || '')
    setCategoryDescription(category?.description || '')
    setCategoryParentId(category?.parent_id || parentId || null)
    setShowCategoryDialog(true)
  }

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) return

    setSavingCategory(true)
    try {
      const data = {
        name: categoryName.trim(),
        description: categoryDescription.trim() || undefined,
        parent_id: categoryParentId || undefined,
      }

      if (editingCategory) {
        await categoriesApi.update(editingCategory.id, data)
      } else {
        await categoriesApi.create(data)
      }

      await loadData()
      setShowCategoryDialog(false)
    } catch (error) {
      console.error('Error saving category:', error)
    } finally {
      setSavingCategory(false)
    }
  }

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Видалити категорію? Послуги з цієї категорії залишаться без категорії.')) return

    try {
      await categoriesApi.delete(id)
      await loadData()
    } catch (error) {
      console.error('Error deleting category:', error)
    }
  }

  // AI Generation handlers
  const handleAiGenerate = async () => {
    if (!aiContent.trim() || !aiPositionName.trim()) return

    try {
      setAiGenerating(true)
      setAiResult(null)

      const result = await servicesApi.generateFromAI({
        position_name: aiPositionName,
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
    if (!aiResult) return

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

      // Get position ID if selected
      const selectedPosition = positions.find(p => p.name === aiPositionName)

      // Create services
      for (const service of selectedServices) {
        await servicesApi.create({
          name: service.name,
          description: service.description,
          duration_minutes: service.duration_minutes,
          price: service.price,
          category_id: categoryMap[service.category_name],
          position_id: selectedPosition?.id,
        })
      }

      // Reload data
      await loadData()

      // Close modal and reset
      setAiModalOpen(false)
      setAiResult(null)
      setAiContent('')
      setAiInstructions('')
      setAiPositionName('')
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

  // Filter services by selected position
  const filteredServices = selectedPositionId === null
    ? services
    : selectedPositionId === -1
      ? services.filter(s => !s.position_id) // "Without position" filter
      : services.filter(s => s.position_id === selectedPositionId)

  // Group services by category
  const getServicesByCategory = (categoryId: number): Service[] => {
    return filteredServices.filter(s => s.category_id === categoryId)
  }

  // Services without category
  const uncategorizedServices = filteredServices.filter(s => !s.category_id)

  // Get color class for position
  const getPositionColorClass = (color: string | null) => {
    return POSITION_COLORS[color || ''] || 'bg-gray-500'
  }

  // Get flat list of categories for parent selector
  const getFlatCategories = (cats: ServiceCategory[], level = 0): { id: number; name: string; level: number }[] => {
    const result: { id: number; name: string; level: number }[] = []
    cats.forEach(c => {
      result.push({ id: c.id, name: c.name, level })
      if (c.children) {
        result.push(...getFlatCategories(c.children, level + 1))
      }
    })
    return result
  }

  // Count total services in category including children recursively (uses filtered services)
  const getTotalServicesInCategory = (category: ServiceCategory): number => {
    let count = getServicesByCategory(category.id).length
    if (category.children) {
      category.children.forEach(child => {
        count += getTotalServicesInCategory(child)
      })
    }
    return count
  }

  // Count services without position
  const servicesWithoutPosition = services.filter(s => !s.position_id).length

  // Render service card (grid view)
  const renderServiceCard = (service: Service) => (
    <Link key={service.id} href={`/admin/services/${service.id}`}>
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-1">
              {service.name}
            </h3>
            {!service.is_active && (
              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded flex-shrink-0">
                Неактивна
              </span>
            )}
          </div>
          {service.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {service.description}
            </p>
          )}
        </CardContent>
        <CardFooter className="px-4 py-3 border-t bg-muted/30">
          <div className="flex items-center justify-between w-full">
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {service.duration_minutes} хв
            </span>
            <span className="font-bold text-primary">
              {service.price} грн
            </span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )

  // Render service list item (list view)
  const renderServiceListItem = (service: Service) => (
    <Link key={service.id} href={`/admin/services/${service.id}`}>
      <div className="flex items-center gap-4 py-2 px-3 hover:bg-muted/50 rounded-md cursor-pointer group">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium group-hover:text-primary transition-colors truncate">
              {service.name}
            </span>
            {!service.is_active && (
              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded flex-shrink-0">
                Неактивна
              </span>
            )}
          </div>
        </div>
        <span className="flex items-center gap-1 text-sm text-muted-foreground flex-shrink-0">
          <Clock className="h-3.5 w-3.5" />
          {service.duration_minutes} хв
        </span>
        <span className="font-semibold text-primary flex-shrink-0 w-24 text-right">
          {service.price} грн
        </span>
      </div>
    </Link>
  )

  // Render services based on view mode
  const renderServices = (servicesList: Service[]) => {
    if (viewMode === 'list') {
      return (
        <div className="space-y-1">
          {servicesList.map(renderServiceListItem)}
        </div>
      )
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
        {servicesList.map(renderServiceCard)}
      </div>
    )
  }

  // Render category with its services (accordion style)
  const renderCategorySection = (category: ServiceCategory, level = 0) => {
    const categoryServices = getServicesByCategory(category.id)
    const isExpanded = expandedCategories.has(category.id)
    const hasChildren = category.children && category.children.length > 0
    const hasServices = categoryServices.length > 0
    const totalServices = getTotalServicesInCategory(category)

    if (totalServices === 0 && !hasChildren) return null

    return (
      <div
        key={category.id}
        className={level > 0 ? 'ml-4 border-l pl-4' : ''}
        ref={(el) => {
          if (el) categoryRefs.current.set(category.id, el)
        }}
      >
        <div
          className="flex items-center gap-2 py-2 px-1 cursor-pointer group hover:bg-muted/30 rounded-md"
          onClick={() => toggleCategory(category.id)}
        >
          {isExpanded ? (
            <FolderOpen className="h-5 w-5 text-primary" />
          ) : (
            <Folder className="h-5 w-5 text-muted-foreground" />
          )}

          <span className="flex-1 font-medium">
            {category.name}
          </span>

          <span className="text-sm text-muted-foreground">
            {getTotalServicesInCategory(category)} послуг
          </span>

          <button className="p-0.5">
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            )}
          </button>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => openCategoryDialog(undefined, category.id)}
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
              title="Додати підкатегорію"
            >
              <FolderPlus className="h-4 w-4" />
            </button>
            <button
              onClick={() => openCategoryDialog(category)}
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
              title="Редагувати"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDeleteCategory(category.id)}
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-red-500"
              title="Видалити"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-2 space-y-2">
            {/* Services */}
            {hasServices && (
              <div className={level > 0 ? 'px-4' : ''}>
                {renderServices(categoryServices)}
              </div>
            )}

            {/* Children categories */}
            {hasChildren && (
              <div className="space-y-2">
                {category.children!.map(child => renderCategorySection(child, level + 1))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Render category tree item in panel
  const renderCategoryPanelItem = (category: ServiceCategory, level = 0) => {
    const totalServices = getTotalServicesInCategory(category)

    // Skip empty categories
    if (totalServices === 0) return null

    const hasChildren = category.children && category.children.length > 0

    return (
      <div key={category.id}>
        <button
          onClick={() => selectCategoryFromPanel(category.id)}
          className="w-full flex items-center gap-2 py-2 px-3 rounded-md text-left text-sm hover:bg-muted transition-colors"
          style={{ paddingLeft: `${level * 16 + 12}px` }}
        >
          <Folder className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1 truncate">{category.name}</span>
          <span className="text-xs text-muted-foreground">{totalServices}</span>
        </button>
        {hasChildren && category.children!.map(child => renderCategoryPanelItem(child, level + 1))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Category Panel - fixed full height */}
      {categoryPanelOpen && (
        <div
          className={`fixed top-0 h-screen w-64 bg-card border-r flex flex-col z-40 transition-all duration-300 ${sidebarCollapsed ? 'lg:left-16' : 'lg:left-64'} left-0`}
        >
          <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
            <h2 className="font-semibold">Категорії</h2>
            <button
              onClick={() => setCategoryPanelOpen(false)}
              className="p-1 rounded hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            <div>
              {categories.map(cat => renderCategoryPanelItem(cat))}
            </div>

            {uncategorizedServices.length > 0 && (
              <button
                onClick={() => selectCategoryFromPanel(-1)}
                className="w-full flex items-center gap-2 py-2 px-3 rounded-md text-left text-sm mt-2 hover:bg-muted transition-colors text-muted-foreground"
              >
                <Folder className="h-4 w-4" />
                <span className="flex-1">Без категорії</span>
                <span className="text-xs">{uncategorizedServices.length}</span>
              </button>
            )}
          </div>

        </div>
      )}

      {/* Main content */}
      <div className={`flex-1 min-w-0 transition-all duration-300 ${categoryPanelOpen ? 'lg:ml-72' : ''}`}>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="cursor-pointer relative z-10"
                onClick={() => setCategoryPanelOpen(!categoryPanelOpen)}
                title="Категорії"
              >
                {categoryPanelOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
              </Button>

              <div>
                <h1 className="text-2xl font-bold">Послуги</h1>
                <p className="text-sm text-muted-foreground">
                  {selectedPositionId !== null ? `${filteredServices.length} з ${services.length}` : services.length} послуг у {categories.length} категоріях
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* View mode toggle */}
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="rounded-r-none"
                  onClick={() => setViewMode('grid')}
                  title="Сітка"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="rounded-l-none"
                  onClick={() => setViewMode('list')}
                  title="Список"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={expandAll}
                title="Розгорнути всі"
              >
                <ChevronsUpDown className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={collapseAll}
                title="Згорнути всі"
              >
                <ChevronsDownUp className="h-5 w-5" />
              </Button>
              <Link href="/admin/categories">
                <Button variant="outline" size="icon" title="Керування категоріями">
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>
              <Button variant="outline" onClick={() => setAiModalOpen(true)}>
                <Sparkles className="mr-2 h-4 w-4" />
                AI
              </Button>
              <Link href="/admin/services/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Додати послугу
                </Button>
              </Link>
            </div>
          </div>

          {/* Position filter buttons (only for clinics) */}
          {companyType === 'clinic' && positions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground mr-1">
                <Briefcase className="h-4 w-4 inline mr-1" />
                Посади:
              </span>
              <Button
                variant={selectedPositionId === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPositionId(null)}
                className="h-8"
              >
                Всі
                <span className="ml-1 text-xs opacity-70">({services.length})</span>
              </Button>
              {positions.map((pos) => {
                const count = services.filter(s => s.position_id === pos.id).length
                return (
                  <Button
                    key={pos.id}
                    variant={selectedPositionId === pos.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedPositionId(pos.id)}
                    className="h-8"
                  >
                    <div className={`w-2.5 h-2.5 rounded-full mr-1.5 ${getPositionColorClass(pos.color)}`} />
                    {pos.name}
                    <span className="ml-1 text-xs opacity-70">({count})</span>
                  </Button>
                )
              })}
              {servicesWithoutPosition > 0 && (
                <Button
                  variant={selectedPositionId === -1 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPositionId(-1)}
                  className="h-8 text-muted-foreground"
                >
                  Без посади
                  <span className="ml-1 text-xs opacity-70">({servicesWithoutPosition})</span>
                </Button>
              )}
            </div>
          )}

          {/* Categories with services (accordion) */}
          <div className="space-y-3">
            {categories.map(cat => renderCategorySection(cat))}

            {/* Uncategorized services */}
            {uncategorizedServices.length > 0 && (
              <div
                ref={(el) => {
                  if (el) categoryRefs.current.set(-1, el)
                }}
              >
                <div
                  className="flex items-center gap-2 py-2 px-1 cursor-pointer group hover:bg-muted/30 rounded-md"
                  onClick={() => toggleCategory(-1)}
                >
                  <Folder className="h-5 w-5 text-muted-foreground" />

                  <span className="flex-1 font-medium text-muted-foreground">
                    Без категорії
                  </span>

                  <span className="text-sm text-muted-foreground">
                    {uncategorizedServices.length} послуг
                  </span>

                  <button className="p-0.5">
                    {expandedCategories.has(-1) ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                </div>

                {expandedCategories.has(-1) && (
                  <div className="mt-2">
                    {renderServices(uncategorizedServices)}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Empty state */}
          {services.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Folder className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  Ви ще не додали жодної послуги.
                </p>
                <Link href="/admin/services/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Додати послугу
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Редагувати категорію' : 'Нова категорія'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Назва</Label>
              <Input
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Назва категорії"
              />
            </div>

            <div className="space-y-2">
              <Label>Опис (необов'язково)</Label>
              <Input
                value={categoryDescription}
                onChange={(e) => setCategoryDescription(e.target.value)}
                placeholder="Короткий опис"
              />
            </div>

            <div className="space-y-2">
              <Label>Батьківська категорія</Label>
              <select
                value={categoryParentId || ''}
                onChange={(e) => setCategoryParentId(e.target.value ? Number(e.target.value) : null)}
                className="w-full h-10 px-3 border rounded-md bg-background"
              >
                <option value="">Без батьківської категорії</option>
                {getFlatCategories(categories)
                  .filter(c => c.id !== editingCategory?.id)
                  .map(c => (
                    <option key={c.id} value={c.id}>
                      {'—'.repeat(c.level)} {c.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
              Скасувати
            </Button>
            <Button onClick={handleSaveCategory} disabled={savingCategory || !categoryName.trim()}>
              {savingCategory ? '...' : 'Зберегти'}
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
          setAiPositionName('')
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Генерація послуг з AI
            </DialogTitle>
          </DialogHeader>

          {!aiResult ? (
            <div className="space-y-4 py-4">
              {/* Position Name */}
              <div className="space-y-2">
                <Label>Спеціальність / Посада *</Label>
                {companyType === 'clinic' && positions.length > 0 ? (
                  <select
                    value={aiPositionName}
                    onChange={(e) => setAiPositionName(e.target.value)}
                    className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                  >
                    <option value="">Оберіть посаду</option>
                    {positions.map(pos => (
                      <option key={pos.id} value={pos.name}>{pos.name}</option>
                    ))}
                  </select>
                ) : (
                  <Input
                    value={aiPositionName}
                    onChange={(e) => setAiPositionName(e.target.value)}
                    placeholder="Наприклад: Косметолог, Масажист, Перукар..."
                  />
                )}
              </div>

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
                <p><strong>Місто:</strong> Київ (для орієнтовних цін)</p>
                <p className="mt-1">AI створить категорії та послуги автоматично. Ви зможете переглянути та обрати потрібні перед збереженням.</p>
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
                disabled={!aiContent.trim() || !aiPositionName.trim() || aiGenerating}
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
