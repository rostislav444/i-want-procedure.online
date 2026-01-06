'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Folder, FolderOpen, ChevronRight, ChevronDown, GripVertical, FolderPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { categoriesApi, servicesApi, ServiceCategory, Service } from '@/lib/api'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set())

  // Dialog state
  const [showDialog, setShowDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null)
  const [categoryName, setCategoryName] = useState('')
  const [categoryDescription, setCategoryDescription] = useState('')
  const [categoryParentId, setCategoryParentId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  // Delete confirmation
  const [deletingCategory, setDeletingCategory] = useState<ServiceCategory | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [categoriesData, servicesData] = await Promise.all([
        categoriesApi.getTree(),
        servicesApi.getAll(),
      ])
      setCategories(categoriesData)
      setServices(servicesData)
      // Expand all by default
      const allIds = new Set<number>()
      const collectIds = (cats: ServiceCategory[]) => {
        cats.forEach(c => {
          allIds.add(c.id)
          if (c.children) collectIds(c.children)
        })
      }
      collectIds(categoriesData)
      setExpandedCategories(allIds)
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

  const getServiceCount = (categoryId: number): number => {
    return services.filter(s => s.category_id === categoryId).length
  }

  const getTotalServiceCount = (category: ServiceCategory): number => {
    let count = getServiceCount(category.id)
    if (category.children) {
      category.children.forEach(child => {
        count += getTotalServiceCount(child)
      })
    }
    return count
  }

  const openDialog = (category?: ServiceCategory, parentId?: number) => {
    setEditingCategory(category || null)
    setCategoryName(category?.name || '')
    setCategoryDescription(category?.description || '')
    setCategoryParentId(category?.parent_id || parentId || null)
    setShowDialog(true)
  }

  const handleSave = async () => {
    if (!categoryName.trim()) return

    setSaving(true)
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
      setShowDialog(false)
    } catch (error) {
      console.error('Error saving category:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingCategory) return

    try {
      await categoriesApi.delete(deletingCategory.id)
      await loadData()
      setDeletingCategory(null)
    } catch (error) {
      console.error('Error deleting category:', error)
    }
  }

  // Get flat list of categories for parent selector
  const getFlatCategories = (cats: ServiceCategory[], level = 0, excludeId?: number): { id: number; name: string; level: number }[] => {
    const result: { id: number; name: string; level: number }[] = []
    cats.forEach(c => {
      if (c.id !== excludeId) {
        result.push({ id: c.id, name: c.name, level })
        if (c.children) {
          result.push(...getFlatCategories(c.children, level + 1, excludeId))
        }
      }
    })
    return result
  }

  // Render category item
  const renderCategory = (category: ServiceCategory, level = 0) => {
    const isExpanded = expandedCategories.has(category.id)
    const hasChildren = category.children && category.children.length > 0
    const serviceCount = getServiceCount(category.id)
    const totalServices = getTotalServiceCount(category)

    return (
      <div key={category.id}>
        <div
          className={`
            flex items-center gap-2 py-2 px-3 rounded-lg group
            ${level === 0 ? 'bg-white border shadow-sm mb-2' : 'hover:bg-muted/50'}
          `}
          style={{ marginLeft: level > 0 ? `${level * 24}px` : 0 }}
        >
          <button
            className="p-1 hover:bg-muted rounded"
            onClick={() => toggleCategory(category.id)}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )
            ) : (
              <span className="w-4" />
            )}
          </button>

          {isExpanded ? (
            <FolderOpen className="h-5 w-5 text-primary flex-shrink-0" />
          ) : (
            <Folder className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          )}

          <span className={`flex-1 ${level === 0 ? 'font-medium' : ''}`}>
            {category.name}
          </span>

          <span className="text-sm text-muted-foreground">
            {serviceCount > 0 && (
              <span className="mr-2">{serviceCount} послуг</span>
            )}
            {hasChildren && totalServices > serviceCount && (
              <span className="text-xs">({totalServices} всього)</span>
            )}
          </span>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => openDialog(undefined, category.id)}
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
              title="Додати підкатегорію"
            >
              <FolderPlus className="h-4 w-4" />
            </button>
            <button
              onClick={() => openDialog(category)}
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
              title="Редагувати"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDeletingCategory(category)}
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-red-500"
              title="Видалити"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div className="mt-1">
            {category.children!.map(child => renderCategory(child, level + 1))}
          </div>
        )}
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Категорії</h1>
          <p className="text-sm text-muted-foreground">
            {categories.length} категорій верхнього рівня
          </p>
        </div>

        <Button onClick={() => openDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Нова категорія
        </Button>
      </div>

      {/* Categories tree */}
      <div className="space-y-1">
        {categories.map(cat => renderCategory(cat))}

        {categories.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Folder className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Ви ще не створили жодної категорії.
              </p>
              <Button onClick={() => openDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Створити категорію
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
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
                placeholder="Короткий опис категорії"
              />
            </div>

            <div className="space-y-2">
              <Label>Батьківська категорія</Label>
              <select
                value={categoryParentId || ''}
                onChange={(e) => setCategoryParentId(e.target.value ? Number(e.target.value) : null)}
                className="w-full h-10 px-3 border rounded-md bg-background"
              >
                <option value="">Без батьківської категорії (верхній рівень)</option>
                {getFlatCategories(categories, 0, editingCategory?.id)
                  .map(c => (
                    <option key={c.id} value={c.id}>
                      {'—'.repeat(c.level)} {c.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Скасувати
            </Button>
            <Button onClick={handleSave} disabled={saving || !categoryName.trim()}>
              {saving ? '...' : 'Зберегти'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingCategory} onOpenChange={(open) => !open && setDeletingCategory(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Видалити категорію?</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-muted-foreground">
              Ви впевнені, що хочете видалити категорію <strong>{deletingCategory?.name}</strong>?
            </p>
            {deletingCategory && getTotalServiceCount(deletingCategory) > 0 && (
              <p className="mt-2 text-sm text-amber-600">
                Послуги з цієї категорії ({getTotalServiceCount(deletingCategory)}) залишаться без категорії.
              </p>
            )}
            {deletingCategory?.children && deletingCategory.children.length > 0 && (
              <p className="mt-2 text-sm text-amber-600">
                Підкатегорії ({deletingCategory.children.length}) також будуть видалені.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingCategory(null)}>
              Скасувати
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Видалити
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
