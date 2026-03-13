'use client'

import { useEffect, useState } from 'react'
import { Folder, FolderOpen, ChevronRight, ChevronDown, Bot } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { globalCatalogApi, servicesApi, GlobalCategory, Service } from '@/lib/api'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<GlobalCategory[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set())

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [categoriesData, servicesData] = await Promise.all([
        globalCatalogApi.getCategoriesTree(),
        servicesApi.getAll(),
      ])
      setCategories(categoriesData)
      setServices(servicesData)
      const allIds = new Set<number>()
      const collectIds = (cats: GlobalCategory[]) => {
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
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const getServiceCount = (categoryId: number): number => {
    return services.filter(s => s.global_category_id === categoryId).length
  }

  const getTotalServiceCount = (category: GlobalCategory): number => {
    let count = getServiceCount(category.id)
    if (category.children) {
      category.children.forEach(child => {
        count += getTotalServiceCount(child)
      })
    }
    return count
  }

  const renderCategory = (category: GlobalCategory, level = 0) => {
    const isExpanded = expandedCategories.has(category.id)
    const hasChildren = category.children && category.children.length > 0
    const serviceCount = getServiceCount(category.id)
    const totalServices = getTotalServiceCount(category)

    return (
      <div key={category.id}>
        <div
          className={`
            flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer hover:bg-muted/50
            ${level === 0 ? 'bg-white dark:bg-card border shadow-sm mb-2' : ''}
          `}
          style={{ marginLeft: level > 0 ? `${level * 24}px` : 0 }}
          onClick={() => toggleCategory(category.id)}
        >
          <button className="p-1">
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

          {category.icon ? (
            <span className="text-lg flex-shrink-0">{category.icon}</span>
          ) : isExpanded ? (
            <FolderOpen className="h-5 w-5 text-primary flex-shrink-0" />
          ) : (
            <Folder className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          )}

          <span className={`flex-1 ${level === 0 ? 'font-medium' : ''}`}>
            {category.name}
          </span>

          {category.is_ai_created && (
            <Badge variant="outline" className="text-xs gap-1 text-purple-600 border-purple-300">
              <Bot className="h-3 w-3" />
              AI
            </Badge>
          )}

          {serviceCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {serviceCount} послуг
            </Badge>
          )}
          {hasChildren && totalServices > serviceCount && (
            <span className="text-xs text-muted-foreground">({totalServices} всього)</span>
          )}
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
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-muted rounded" style={{ opacity: 1 - i * 0.15 }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Каталог категорій</h1>
        <p className="text-sm text-muted-foreground">
          Глобальний каталог категорій послуг
        </p>
      </div>

      <div className="space-y-1">
        {categories.map(cat => renderCategory(cat))}
      </div>
    </div>
  )
}
