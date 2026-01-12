'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Plus, Clock, ChevronRight, ChevronDown, FolderPlus, Pencil, Trash2, Folder, FolderOpen, PanelLeftClose, PanelLeft, X, Settings, ChevronsUpDown, ChevronsDownUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

  // Refs for scrolling
  const categoryRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  // Category dialog state
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null)
  const [categoryName, setCategoryName] = useState('')
  const [categoryDescription, setCategoryDescription] = useState('')
  const [categoryParentId, setCategoryParentId] = useState<number | null>(null)
  const [savingCategory, setSavingCategory] = useState(false)

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
      // Expand all categories by default
      const allIds = getAllCategoryIds(categoriesData)
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

  // Render service card
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
          className={`
            flex items-center gap-2 py-3 px-4 rounded-lg cursor-pointer group
            ${level === 0 ? 'bg-card border shadow-sm' : 'hover:bg-muted/50'}
          `}
          onClick={() => toggleCategory(category.id)}
        >
          <button className="p-0.5">
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            )}
          </button>

          {isExpanded ? (
            <FolderOpen className="h-5 w-5 text-primary" />
          ) : (
            <Folder className="h-5 w-5 text-muted-foreground" />
          )}

          <span className={`flex-1 font-medium ${level === 0 ? 'text-lg' : ''}`}>
            {category.name}
          </span>

          <span className="text-sm text-muted-foreground">
            {getTotalServicesInCategory(category)} послуг
          </span>

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
            {/* Services grid - no side padding for top level */}
            {hasServices && (
              <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 ${level > 0 ? 'px-4' : ''}`}>
                {categoryServices.map(renderServiceCard)}
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
                  className="flex items-center gap-2 py-3 px-4 rounded-lg cursor-pointer group bg-card border shadow-sm"
                  onClick={() => toggleCategory(-1)}
                >
                  <button className="p-0.5">
                    {expandedCategories.has(-1) ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>

                  <Folder className="h-5 w-5 text-muted-foreground" />

                  <span className="flex-1 font-medium text-lg text-muted-foreground">
                    Без категорії
                  </span>

                  <span className="text-sm text-muted-foreground">
                    {uncategorizedServices.length} послуг
                  </span>
                </div>

                {expandedCategories.has(-1) && (
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                    {uncategorizedServices.map(renderServiceCard)}
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
    </div>
  )
}
