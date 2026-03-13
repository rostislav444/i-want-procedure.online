'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Search, ChevronRight, ChevronDown, Check, Plus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { globalCatalogApi, GlobalCategory, GlobalTemplate, servicesApi } from '@/lib/api'

type Mode = 'catalog' | 'custom'

export default function NewServicePage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('catalog')

  // Global catalog state
  const [catalog, setCatalog] = useState<GlobalCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set())
  const [selectedTemplates, setSelectedTemplates] = useState<Set<number>>(new Set())
  const [adopting, setAdopting] = useState(false)

  // Custom service state
  const [saving, setSaving] = useState(false)
  const [customForm, setCustomForm] = useState({
    name: '',
    description: '',
    duration_minutes: 60,
    price: 0,
    global_category_id: null as number | null,
  })

  useEffect(() => {
    globalCatalogApi.getCategoriesTree()
      .then(setCatalog)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Flatten global categories for dropdown
  const flatGlobalCategories = useMemo(() => {
    const result: { id: number; name: string; icon?: string; level: number }[] = []
    const walk = (cats: GlobalCategory[], level = 0) => {
      for (const c of cats) {
        result.push({ id: c.id, name: c.name, icon: c.icon, level })
        if (c.children?.length) walk(c.children, level + 1)
      }
    }
    walk(catalog)
    return result
  }, [catalog])

  // Flatten all templates for search
  const allTemplates = useMemo(() => {
    const result: (GlobalTemplate & { categoryName: string; parentCategoryName?: string })[] = []
    const walk = (cats: GlobalCategory[], parentName?: string) => {
      for (const cat of cats) {
        for (const t of cat.templates || []) {
          result.push({ ...t, categoryName: cat.name, parentCategoryName: parentName })
        }
        if (cat.children) walk(cat.children, cat.name)
      }
    }
    walk(catalog)
    return result
  }, [catalog])

  // Filter templates by search
  const filteredTemplates = useMemo(() => {
    if (!search.trim()) return null
    const q = search.toLowerCase()
    return allTemplates.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.categoryName.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q)
    )
  }, [search, allTemplates])

  const toggleCategory = (id: number) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleTemplate = (id: number) => {
    setSelectedTemplates(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAllInCategory = (cat: GlobalCategory) => {
    setSelectedTemplates(prev => {
      const next = new Set(prev)
      const templates = cat.templates || []
      const allSelected = templates.every(t => next.has(t.id))
      templates.forEach(t => {
        if (allSelected) next.delete(t.id)
        else next.add(t.id)
      })
      return next
    })
  }

  const handleAdopt = async () => {
    if (selectedTemplates.size === 0) return
    setAdopting(true)
    try {
      const result = await globalCatalogApi.adopt(Array.from(selectedTemplates))
      router.push('/admin/services')
    } catch (error) {
      console.error('Error adopting services:', error)
    } finally {
      setAdopting(false)
    }
  }

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const service = await servicesApi.create({
        ...customForm,
        global_category_id: customForm.global_category_id || undefined,
        is_custom: true,
      })
      router.push(`/admin/services/${service.id}`)
    } catch (error) {
      console.error('Error creating service:', error)
    } finally {
      setSaving(false)
    }
  }

  const renderTemplate = (template: GlobalTemplate & { categoryName?: string; parentCategoryName?: string }, showCategory = false) => {
    const isSelected = selectedTemplates.has(template.id)
    return (
      <div
        key={template.id}
        onClick={() => toggleTemplate(template.id)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
          isSelected
            ? 'bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800'
            : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
        }`}
      >
        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
          isSelected
            ? 'bg-blue-500 border-blue-500 text-white'
            : 'border-gray-300 dark:border-gray-600'
        }`}>
          {isSelected && <Check className="w-3.5 h-3.5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{template.name}</div>
          {template.description && (
            <div className="text-xs text-gray-500 truncate mt-0.5">{template.description}</div>
          )}
          {showCategory && template.categoryName && (
            <div className="text-xs text-blue-500 mt-0.5">
              {template.parentCategoryName && `${template.parentCategoryName} → `}{template.categoryName}
            </div>
          )}
        </div>
        <Badge variant="secondary" className="text-xs flex-shrink-0">
          {template.default_duration_minutes} хв
        </Badge>
      </div>
    )
  }

  const renderCategory = (cat: GlobalCategory, depth = 0) => {
    const isExpanded = expandedCategories.has(cat.id)
    const templates = cat.templates || []
    const children = cat.children || []
    const hasContent = templates.length > 0 || children.length > 0
    const selectedCount = templates.filter(t => selectedTemplates.has(t.id)).length
    const allSelected = templates.length > 0 && selectedCount === templates.length

    return (
      <div key={cat.id}>
        <div
          className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${depth === 0 ? 'mt-1' : ''}`}
          onClick={() => hasContent && toggleCategory(cat.id)}
        >
          {hasContent ? (
            isExpanded
              ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
              : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          ) : (
            <div className="w-4" />
          )}
          <span className="text-sm mr-1">{cat.icon}</span>
          <span className={`text-sm flex-1 ${depth === 0 ? 'font-semibold' : 'font-medium'}`}>
            {cat.name}
          </span>
          {templates.length > 0 && (
            <Badge
              variant={selectedCount > 0 ? 'default' : 'secondary'}
              className="text-xs cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                selectAllInCategory(cat)
              }}
            >
              {selectedCount > 0 ? `${selectedCount}/` : ''}{templates.length}
              {allSelected && ' ✓'}
            </Badge>
          )}
        </div>
        {isExpanded && (
          <div className={`${depth === 0 ? 'ml-4' : 'ml-6'}`}>
            {children.map(child => renderCategory(child, depth + 1))}
            {templates.length > 0 && (
              <div className="space-y-1 py-1">
                {templates.map(t => renderTemplate(t))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/services">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Додати послуги</h1>
      </div>

      {/* Mode switcher */}
      <div className="flex gap-2">
        <Button
          variant={mode === 'catalog' ? 'default' : 'outline'}
          onClick={() => setMode('catalog')}
          className="gap-2"
        >
          <Sparkles className="w-4 h-4" />
          З каталогу
        </Button>
        <Button
          variant={mode === 'custom' ? 'default' : 'outline'}
          onClick={() => setMode('custom')}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Своя послуга
        </Button>
      </div>

      {mode === 'catalog' ? (
        <>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Пошук послуги..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Selected count + adopt button */}
          {selectedTemplates.size > 0 && (
            <div className="sticky top-0 z-10 flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <span className="text-sm font-medium">
                Обрано: <span className="text-blue-600 font-bold">{selectedTemplates.size}</span> послуг
              </span>
              <Button onClick={handleAdopt} disabled={adopting} size="sm">
                {adopting ? 'Додаємо...' : 'Додати обрані послуги'}
              </Button>
            </div>
          )}

          {/* Catalog tree or search results */}
          <Card>
            <CardContent className="p-3">
              {loading ? (
                <div className="space-y-3 p-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : filteredTemplates ? (
                // Search results
                filteredTemplates.length > 0 ? (
                  <div className="space-y-1">
                    <div className="text-xs text-gray-500 px-3 py-1">
                      Знайдено: {filteredTemplates.length} послуг
                    </div>
                    {filteredTemplates.map(t => renderTemplate(t, true))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    Нічого не знайдено за запитом &laquo;{search}&raquo;
                  </div>
                )
              ) : (
                // Category tree
                <div className="space-y-0.5">
                  {catalog.map(cat => renderCategory(cat))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        /* Custom service form */
        <Card>
          <CardHeader>
            <CardTitle>Своя послуга</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCustomSubmit} className="space-y-4">
              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Категорія</Label>
                <select
                  id="category"
                  value={customForm.global_category_id || ''}
                  onChange={(e) => setCustomForm({ ...customForm, global_category_id: e.target.value ? Number(e.target.value) : null })}
                  className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                >
                  <option value="">Без категорії</option>
                  {flatGlobalCategories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.icon ? `${c.icon} ` : ''}{'—'.repeat(c.level)} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Назва *</Label>
                <Input
                  id="name"
                  value={customForm.name}
                  onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                  placeholder="Назва послуги"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Опис</Label>
                <textarea
                  id="description"
                  className="w-full min-h-[120px] px-3 py-2 border rounded-md text-sm"
                  value={customForm.description}
                  onChange={(e) => setCustomForm({ ...customForm, description: e.target.value })}
                  placeholder="Детальний опис процедури..."
                />
              </div>

              {/* Duration + Price */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Тривалість (хв) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={customForm.duration_minutes}
                    onChange={(e) => setCustomForm({ ...customForm, duration_minutes: parseInt(e.target.value) })}
                    min={15}
                    step={15}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Ціна (грн) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={customForm.price}
                    onChange={(e) => setCustomForm({ ...customForm, price: parseFloat(e.target.value) })}
                    min={0}
                    step={0.01}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Збереження...' : 'Створити послугу'}
                </Button>
                <Link href="/admin/services">
                  <Button type="button" variant="outline">
                    Скасувати
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
