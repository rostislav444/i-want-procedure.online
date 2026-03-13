'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, Clock, ChevronRight, ChevronDown, X, ArrowRight } from 'lucide-react'
import type { PublicCompany, PublicService, PublicServiceCategory } from '@/lib/public-api'

interface Props {
  company: PublicCompany
  services: PublicService[]
  categories: PublicServiceCategory[]
}

function formatPrice(service: PublicService): string {
  if (service.price_options && service.price_options.length > 0) {
    const minPrice = Math.min(...service.price_options.map(o => Number(o.price)))
    return `від ${minPrice.toLocaleString('uk-UA')} ₴`
  }
  return `${Number(service.price).toLocaleString('uk-UA')} ₴`
}

function flattenCategories(cats: PublicServiceCategory[]): PublicServiceCategory[] {
  const result: PublicServiceCategory[] = []
  for (const cat of cats) {
    result.push(cat)
    if (cat.children) result.push(...flattenCategories(cat.children))
  }
  return result
}

function collectCategoryIds(cat: PublicServiceCategory): number[] {
  const ids = [cat.id]
  if (cat.children) {
    for (const child of cat.children) ids.push(...collectCategoryIds(child))
  }
  return ids
}

function countServicesInTree(cat: PublicServiceCategory, services: PublicService[]): number {
  const ids = new Set(collectCategoryIds(cat))
  return services.filter(s => s.global_category_id != null && ids.has(s.global_category_id)).length
}

export function ServicesCatalog({ company, services, categories }: Props) {
  const [search, setSearch] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [expandedParents, setExpandedParents] = useState<Set<number>>(new Set())
  const [sortBy, setSortBy] = useState<'name' | 'price_asc' | 'price_desc' | 'duration'>('name')

  const accentColor = company.primary_color || '#C9837A'

  const allCategories = useMemo(() => flattenCategories(categories), [categories])

  const selectedCategoryIds = useMemo(() => {
    if (!selectedCategoryId) return null
    const cat = allCategories.find(c => c.id === selectedCategoryId)
    if (!cat) return null
    return new Set(collectCategoryIds(cat))
  }, [selectedCategoryId, allCategories])

  const filteredServices = useMemo(() => {
    let result = [...services]
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)
      )
    }
    if (selectedCategoryIds) {
      result = result.filter(s => s.global_category_id != null && selectedCategoryIds.has(s.global_category_id))
    }
    switch (sortBy) {
      case 'name': result.sort((a, b) => a.name.localeCompare(b.name, 'uk')); break
      case 'price_asc': result.sort((a, b) => Number(a.price) - Number(b.price)); break
      case 'price_desc': result.sort((a, b) => Number(b.price) - Number(a.price)); break
      case 'duration': result.sort((a, b) => a.duration_minutes - b.duration_minutes); break
    }
    return result
  }, [services, search, selectedCategoryIds, sortBy])

  const servicesByCategory = useMemo(() => {
    if (selectedCategoryId || search) return null
    const map: Record<string, { name: string; icon?: string; services: PublicService[] }> = {}
    filteredServices.forEach((s) => {
      const catId = String(s.global_category_id ?? 'other')
      if (!map[catId]) {
        const cat = allCategories.find(c => c.id === s.global_category_id)
        map[catId] = { name: cat?.name || 'Інші послуги', icon: cat?.icon, services: [] }
      }
      map[catId].services.push(s)
    })
    return map
  }, [filteredServices, selectedCategoryId, search, allCategories])

  const displayCategories = useMemo(() => {
    const nonEmpty = categories.filter(c => countServicesInTree(c, services) > 0)
    if (nonEmpty.length === 1 && nonEmpty[0].children && nonEmpty[0].children.length > 0) {
      return nonEmpty[0].children
    }
    return categories
  }, [categories, services])

  const toggleParent = (catId: number) => {
    setExpandedParents(prev => {
      const next = new Set(prev)
      if (next.has(catId)) { next.delete(catId) } else { next.add(catId) }
      return next
    })
  }

  const hasFilters = search || selectedCategoryId

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs tracking-widest uppercase text-neutral-400 dark:text-neutral-500 mb-1.5 font-medium">Каталог</p>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Послуги</h1>
        <p className="mt-1.5 text-neutral-500 dark:text-neutral-400 text-sm">{services.length} послуг у каталозі</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Знайти послугу..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-white/15 bg-white dark:bg-white/5 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 outline-none focus:border-neutral-300 dark:focus:border-white/30 transition-colors shadow-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-white/15 bg-white dark:bg-white/5 text-sm text-neutral-700 dark:text-neutral-300 outline-none focus:border-neutral-300 dark:focus:border-white/30 transition-colors shadow-sm"
        >
          <option value="name">За назвою</option>
          <option value="price_asc">Ціна ↑</option>
          <option value="price_desc">Ціна ↓</option>
          <option value="duration">За тривалістю</option>
        </select>
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        {displayCategories.length > 0 && (
          <aside className="hidden lg:block w-52 flex-shrink-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-3">Категорії</p>
            <nav className="space-y-0.5">
              <button
                onClick={() => setSelectedCategoryId(null)}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  !selectedCategoryId ? 'text-white' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/10'
                }`}
                style={!selectedCategoryId ? { backgroundColor: accentColor } : {}}
              >
                Усі послуги
              </button>
              {displayCategories.map((parent) => {
                const totalCount = countServicesInTree(parent, services)
                if (totalCount === 0) return null
                const hasChildren = parent.children && parent.children.length > 0
                const isExpanded = expandedParents.has(parent.id)
                const isSelected = selectedCategoryId === parent.id
                const childIds = hasChildren ? new Set(collectCategoryIds(parent)) : new Set<number>()
                const isChildSelected = selectedCategoryId != null && selectedCategoryId !== parent.id && childIds.has(selectedCategoryId)

                return (
                  <div key={parent.id}>
                    <div className="flex items-center">
                      {hasChildren && (
                        <button
                          onClick={() => toggleParent(parent.id)}
                          className="p-1 rounded text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 flex-shrink-0"
                        >
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedCategoryId(isSelected ? null : parent.id)}
                        className={`flex-1 text-left px-2 py-2 rounded-xl text-sm transition-colors flex items-center justify-between ${!hasChildren ? 'ml-5' : ''} ${
                          isSelected
                            ? 'font-semibold text-white'
                            : isChildSelected
                              ? 'text-neutral-900 dark:text-white font-semibold'
                              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/10'
                        }`}
                        style={isSelected ? { backgroundColor: accentColor } : {}}
                      >
                        <span className="truncate">{parent.icon ? `${parent.icon} ` : ''}{parent.name}</span>
                        <span className="text-xs ml-2 flex-shrink-0 opacity-60">{totalCount}</span>
                      </button>
                    </div>
                    {hasChildren && isExpanded && (
                      <div className="ml-5 border-l border-neutral-200 dark:border-white/15 pl-2 space-y-0.5">
                        {parent.children!.map((child) => {
                          const childCount = countServicesInTree(child, services)
                          if (childCount === 0) return null
                          const isChildSel = selectedCategoryId === child.id
                          return (
                            <button
                              key={child.id}
                              onClick={() => setSelectedCategoryId(isChildSel ? null : child.id)}
                              className={`w-full text-left px-2 py-1.5 rounded-xl text-sm transition-colors flex items-center justify-between ${
                                isChildSel ? 'font-semibold text-white' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/10'
                              }`}
                              style={isChildSel ? { backgroundColor: accentColor } : {}}
                            >
                              <span className="truncate">{child.icon ? `${child.icon} ` : ''}{child.name}</span>
                              <span className="text-xs ml-2 flex-shrink-0 opacity-60">{childCount}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </nav>
          </aside>
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Mobile category pills */}
          {displayCategories.length > 0 && (
            <div className="lg:hidden flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
              <button
                onClick={() => setSelectedCategoryId(null)}
                className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors border text-white"
                style={!selectedCategoryId ? { backgroundColor: accentColor, borderColor: accentColor } : { color: '#6b7280', borderColor: '#e5e7eb' }}
              >
                Усі
              </button>
              {displayCategories.map((cat) => {
                const count = countServicesInTree(cat, services)
                if (count === 0) return null
                const isActive = selectedCategoryId != null && collectCategoryIds(cat).includes(selectedCategoryId)
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(isActive ? null : cat.id)}
                    className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors border"
                    style={isActive ? { backgroundColor: accentColor, borderColor: accentColor, color: 'white' } : { color: '#6b7280', borderColor: '#e5e7eb' }}
                  >
                    {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                  </button>
                )
              })}
            </div>
          )}

          {/* Filter status */}
          {hasFilters && (
            <div className="flex items-center gap-2 mb-5">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">Знайдено: {filteredServices.length}</span>
              <button
                onClick={() => { setSearch(''); setSelectedCategoryId(null) }}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-white/10 hover:bg-neutral-200 dark:hover:bg-white/15 transition-colors"
              >
                <X className="w-3 h-3" /> Скинути
              </button>
            </div>
          )}

          {/* Services */}
          {filteredServices.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-14 h-14 rounded-full bg-neutral-100 dark:bg-white/10 flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 text-neutral-400" />
              </div>
              <p className="font-medium text-neutral-900 dark:text-white">Нічого не знайдено</p>
              <p className="text-sm mt-1 text-neutral-500 dark:text-neutral-400">Спробуйте змінити пошуковий запит або фільтри</p>
            </div>
          ) : servicesByCategory ? (
            <div className="space-y-12">
              {Object.entries(servicesByCategory).map(([catId, { name, icon, services: catServices }]) => (
                <div key={catId}>
                  <div className="flex items-center gap-2 mb-5">
                    {icon && <span className="text-xl">{icon}</span>}
                    <h2 className="text-lg font-bold text-neutral-900 dark:text-white">{name}</h2>
                    <span className="text-sm text-neutral-400 dark:text-neutral-500 font-normal">({catServices.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {catServices.map((service) => (
                      <ServiceTile key={service.id} service={service} slug={`${company.id}-${company.slug}`} accentColor={accentColor} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredServices.map((service) => (
                <ServiceTile key={service.id} service={service} slug={`${company.id}-${company.slug}`} accentColor={accentColor} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ServiceTile({ service, slug, accentColor }: { service: PublicService; slug: string; accentColor: string }) {
  return (
    <Link
      href={`/marketplace/${slug}/services/${service.id}`}
      className="group bg-white dark:bg-white/5 border border-rose-50 dark:border-white/10 rounded-2xl p-5 flex flex-col hover:-translate-y-0.5 hover:shadow-md hover:border-rose-100 dark:hover:border-white/20 transition-all duration-200"
    >
      {/* Icon + category */}
      <div className="flex items-start justify-between mb-3">
        {service.global_category?.icon ? (
          <span className="text-2xl">{service.global_category.icon}</span>
        ) : (
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accentColor}22` }}>
            <span className="text-xs font-bold" style={{ color: accentColor }}>
              {service.name.charAt(0)}
            </span>
          </div>
        )}
        <ArrowRight className="w-4 h-4 text-neutral-300 dark:text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
      </div>

      {/* Name + description */}
      <h3 className="font-semibold text-neutral-900 dark:text-white text-sm leading-snug">
        {service.name}
      </h3>
      {service.description && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 line-clamp-2 leading-relaxed flex-grow">
          {service.description}
        </p>
      )}

      {/* Price options */}
      {service.price_options && service.price_options.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {service.price_options.slice(0, 2).map((opt) => (
            <span key={opt.id} className="text-xs px-2 py-0.5 rounded-full border border-neutral-100 dark:border-white/10 text-neutral-500 dark:text-neutral-400">
              {opt.name}
            </span>
          ))}
          {service.price_options.length > 2 && (
            <span className="text-xs text-neutral-400 dark:text-neutral-500">+{service.price_options.length - 2}</span>
          )}
        </div>
      )}

      {/* Footer: duration + price */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-50 dark:border-white/10">
        <span className="flex items-center gap-1 text-xs text-neutral-400 dark:text-neutral-500">
          <Clock className="w-3 h-3" />
          {service.duration_minutes} хв
        </span>
        <span className="font-bold text-sm" style={{ color: accentColor }}>
          {formatPrice(service)}
        </span>
      </div>
    </Link>
  )
}
