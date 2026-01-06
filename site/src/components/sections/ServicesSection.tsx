'use client'

import { Clock, Sparkles } from 'lucide-react'
import { Company, Service, ServiceCategory } from '@/lib/api'
import { IndustryTheme } from '@/lib/themes'

interface ServicesContent {
  title?: string
  subtitle?: string
  display_mode?: 'grid' | 'list' | 'cards'
}

interface Props {
  content: ServicesContent
  theme: IndustryTheme
  company: Company
  services: Service[]
  categories: ServiceCategory[]
}

export function ServicesSection({ content, theme, company, services, categories }: Props) {
  const displayMode = content.display_mode || 'grid'
  const title = content.title || 'Наші послуги'
  const subtitle = content.subtitle

  // Group services by category
  const servicesByCategoryMap: Record<string, Service[]> = {}
  services.forEach((service) => {
    const catId = String(service.category_id ?? 'null')
    if (!servicesByCategoryMap[catId]) {
      servicesByCategoryMap[catId] = []
    }
    servicesByCategoryMap[catId].push(service)
  })

  // Helper to get category name
  const getCategoryName = (catId: string): string => {
    if (catId === 'null') return 'Інші послуги'
    const id = parseInt(catId, 10)
    const findCat = (cats: ServiceCategory[]): string | undefined => {
      for (const cat of cats) {
        if (cat.id === id) return cat.name
        if (cat.children) {
          const found = findCat(cat.children)
          if (found) return found
        }
      }
    }
    return findCat(categories) || 'Категорія'
  }

  return (
    <section className="py-16" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4"
            style={{
              backgroundColor: 'var(--color-primary-100)',
              color: 'var(--color-primary-700)',
            }}
          >
            <Sparkles className="w-4 h-4" />
            <span>Прайс-лист</span>
          </div>
          <h2
            className="text-3xl md:text-4xl font-bold"
            style={{ fontFamily: 'var(--font-accent)', color: 'var(--color-text)' }}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="mt-2 max-w-xl mx-auto" style={{ color: 'var(--color-text-muted)' }}>{subtitle}</p>
          )}
        </div>

        {/* Services */}
        {displayMode === 'grid' && (
          <ServicesGrid
            servicesByCategoryMap={servicesByCategoryMap}
            getCategoryName={getCategoryName}
            theme={theme}
          />
        )}

        {displayMode === 'list' && (
          <ServicesList
            servicesByCategoryMap={servicesByCategoryMap}
            getCategoryName={getCategoryName}
            theme={theme}
          />
        )}

        {displayMode === 'cards' && (
          <ServicesCards
            services={services}
            theme={theme}
          />
        )}

        {services.length === 0 && (
          <div
            className="text-center py-16 rounded-2xl border"
            style={{ borderColor: 'var(--color-primary-100)' }}
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: 'var(--color-primary-100)' }}
            >
              <Sparkles className="w-10 h-10" style={{ color: 'var(--color-primary-500)' }} />
            </div>
            <p className="text-lg" style={{ color: 'var(--color-text-muted)' }}>Послуги поки не додані</p>
          </div>
        )}
      </div>
    </section>
  )
}

// Grid layout - 2 columns with category headers
function ServicesGrid({
  servicesByCategoryMap,
  getCategoryName,
  theme,
}: {
  servicesByCategoryMap: Record<string, Service[]>
  getCategoryName: (catId: string) => string
  theme: IndustryTheme
}) {
  return (
    <div className="space-y-12">
      {Object.entries(servicesByCategoryMap).map(([catId, catServices]) => (
        <div key={catId}>
          {/* Category header */}
          <div className="flex items-center gap-3 mb-6">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: 'var(--color-primary-500)' }}
            />
            <h3
              className="text-xl font-semibold"
              style={{ color: 'var(--color-primary-500)' }}
            >
              {getCategoryName(catId)}
            </h3>
          </div>

          {/* Services grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {catServices.map((service) => (
              <div
                key={service.id}
                className="p-5 transition-all hover:scale-[1.02]"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderRadius: theme.borderRadius.card,
                  boxShadow: theme.shadow.card,
                  borderLeft: '4px solid var(--color-primary-500)',
                }}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-lg" style={{ color: 'var(--color-text)' }}>{service.name}</h4>
                    {service.description && (
                      <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>
                        {service.description}
                      </p>
                    )}
                    <div className="flex items-center gap-1 mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      <Clock className="w-4 h-4" />
                      <span>{service.duration_minutes} хв</span>
                    </div>
                  </div>
                  <div
                    className="text-2xl font-bold whitespace-nowrap"
                    style={{ color: 'var(--color-primary-500)' }}
                  >
                    {Number(service.price).toLocaleString('uk-UA')} ₴
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// List layout - Simple rows grouped by category
function ServicesList({
  servicesByCategoryMap,
  getCategoryName,
  theme,
}: {
  servicesByCategoryMap: Record<string, Service[]>
  getCategoryName: (catId: string) => string
  theme: IndustryTheme
}) {
  return (
    <div className="space-y-8">
      {Object.entries(servicesByCategoryMap).map(([catId, catServices]) => (
        <div
          key={catId}
          className="rounded-2xl border overflow-hidden"
          style={{ borderColor: 'var(--color-primary-100)' }}
        >
          {/* Category header */}
          <div
            className="px-6 py-4 border-b flex items-center gap-3"
            style={{
              borderColor: 'var(--color-primary-100)',
              backgroundColor: 'var(--color-primary-50)',
            }}
          >
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: 'var(--color-primary-500)' }}
            />
            <h3 className="text-lg font-semibold" style={{ color: 'var(--color-primary-500)' }}>
              {getCategoryName(catId)}
            </h3>
            <span className="text-sm ml-auto" style={{ color: 'var(--color-text-muted)' }}>
              {catServices.length} послуг
            </span>
          </div>

          {/* Services list */}
          <div className="divide-y" style={{ borderColor: 'var(--color-primary-50)' }}>
            {catServices.map((service) => (
              <div
                key={service.id}
                className="px-6 py-4 flex items-center justify-between gap-4 transition-colors"
                style={{ backgroundColor: 'var(--color-surface)' }}
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium" style={{ color: 'var(--color-text)' }}>{service.name}</h4>
                  {service.description && (
                    <p className="text-sm mt-0.5 line-clamp-1" style={{ color: 'var(--color-text-muted)' }}>
                      {service.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className="text-sm flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                    <Clock className="w-4 h-4" />
                    {service.duration_minutes} хв
                  </span>
                  <span
                    className="text-xl font-bold"
                    style={{ color: 'var(--color-primary-500)' }}
                  >
                    {Number(service.price).toLocaleString('uk-UA')} ₴
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// Cards layout - Individual service cards
function ServicesCards({
  services,
  theme,
}: {
  services: Service[]
  theme: IndustryTheme
}) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {services.map((service) => (
        <div
          key={service.id}
          className="p-6 transition-all hover:scale-[1.02]"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: theme.borderRadius.card,
            boxShadow: theme.shadow.card,
          }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
            style={{ backgroundColor: 'var(--color-primary-100)' }}
          >
            <Sparkles className="w-6 h-6" style={{ color: 'var(--color-primary-500)' }} />
          </div>

          <h4 className="font-semibold text-lg mb-2" style={{ color: 'var(--color-text)' }}>{service.name}</h4>

          {service.description && (
            <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>
              {service.description}
            </p>
          )}

          <div className="flex items-center justify-between mt-auto pt-4 border-t" style={{ borderColor: 'var(--color-primary-100)' }}>
            <span className="text-sm flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
              <Clock className="w-4 h-4" />
              {service.duration_minutes} хв
            </span>
            <span
              className="text-xl font-bold"
              style={{ color: 'var(--color-primary-500)' }}
            >
              {Number(service.price).toLocaleString('uk-UA')} ₴
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
