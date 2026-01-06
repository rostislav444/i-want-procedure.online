'use client'

import { Clock, ArrowRight, Sparkles, MessageCircle } from 'lucide-react'
import { Company, Service, ServiceCategory } from '@/lib/api'
import { IndustryTheme } from '@/lib/themes'

interface ServicesContent {
  title?: string
  subtitle?: string
  display_mode?: 'grid' | 'list' | 'cards' | 'bento'
}

interface Props {
  content: ServicesContent
  theme: IndustryTheme
  company: Company
  services: Service[]
  categories: ServiceCategory[]
}

export function ServicesSection({ content, theme, company, services, categories }: Props) {
  const displayMode = content.display_mode || 'bento'
  const title = content.title || 'Наші послуги'
  const subtitle = content.subtitle || 'Професійний догляд для вашої краси та здоров\'я'

  // Generate Telegram bot link
  const telegramBotLink = `https://t.me/i_want_procedure_bot?start=${company.slug || company.id}`

  // Group services by category
  const servicesByCategoryMap: Record<string, Service[]> = {}
  services.forEach((service) => {
    const catId = String(service.category_id ?? 'null')
    if (!servicesByCategoryMap[catId]) {
      servicesByCategoryMap[catId] = []
    }
    servicesByCategoryMap[catId].push(service)
  })

  // Get category name
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
    <section
      className="py-20 lg:py-32"
      style={{ backgroundColor: 'var(--color-background-alt)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6"
            style={{
              backgroundColor: 'var(--color-primary-100)',
              color: 'var(--color-primary-700)',
            }}
          >
            <Sparkles className="w-4 h-4" />
            <span>Прайс-лист</span>
          </div>
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
            style={{
              fontFamily: 'var(--font-accent)',
              color: 'var(--color-text-on-alt)',
            }}
          >
            {title}
          </h2>
          <p
            className="text-lg lg:text-xl"
            style={{ color: 'var(--color-text-muted-on-alt)' }}
          >
            {subtitle}
          </p>
        </div>

        {/* Services display */}
        {displayMode === 'bento' && (
          <BentoLayout
            services={services}
            servicesByCategoryMap={servicesByCategoryMap}
            getCategoryName={getCategoryName}
            theme={theme}
            telegramBotLink={telegramBotLink}
          />
        )}

        {displayMode === 'grid' && (
          <GridLayout
            services={services}
            theme={theme}
            telegramBotLink={telegramBotLink}
          />
        )}

        {displayMode === 'cards' && (
          <CardsLayout
            services={services}
            theme={theme}
            telegramBotLink={telegramBotLink}
          />
        )}

        {displayMode === 'list' && (
          <ListLayout
            services={services}
            servicesByCategoryMap={servicesByCategoryMap}
            getCategoryName={getCategoryName}
            theme={theme}
            telegramBotLink={telegramBotLink}
          />
        )}

        {services.length === 0 && (
          <EmptyState theme={theme} />
        )}

        {/* CTA Button */}
        {services.length > 0 && (
          <div className="text-center mt-12">
            <a
              href={telegramBotLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 font-semibold transition-all hover:scale-105"
              style={{
                backgroundColor: 'var(--color-primary-500)',
                color: 'var(--color-primary-contrast)',
                borderRadius: theme.borderRadius.button,
                boxShadow: '0 10px 40px -10px var(--color-primary-500)',
              }}
            >
              <MessageCircle className="w-5 h-5" />
              Записатися онлайн
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    </section>
  )
}

interface LayoutProps {
  services: Service[]
  servicesByCategoryMap?: Record<string, Service[]>
  getCategoryName?: (catId: string) => string
  theme: IndustryTheme
  telegramBotLink: string
}

// Bento Grid Layout - Modern asymmetric grid
function BentoLayout({ services, servicesByCategoryMap, getCategoryName, theme, telegramBotLink }: LayoutProps) {
  if (!servicesByCategoryMap || !getCategoryName) return null

  return (
    <div className="space-y-12">
      {Object.entries(servicesByCategoryMap).map(([catId, catServices], categoryIndex) => (
        <div key={catId}>
          {/* Category header */}
          <div className="flex items-center gap-4 mb-6">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-primary-100)' }}
            >
              <Sparkles className="w-6 h-6" style={{ color: 'var(--color-primary-500)' }} />
            </div>
            <div>
              <h3
                className="text-xl font-bold"
                style={{ color: 'var(--color-text-on-alt)' }}
              >
                {getCategoryName(catId)}
              </h3>
              <p className="text-sm" style={{ color: 'var(--color-text-muted-on-alt)' }}>
                {catServices.length} послуг
              </p>
            </div>
          </div>

          {/* Bento grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {catServices.map((service, index) => {
              // First item in each category is featured (larger)
              const isFeatured = index === 0 && catServices.length > 2

              return (
                <a
                  key={service.id}
                  href={telegramBotLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group relative overflow-hidden transition-all hover:scale-[1.02] ${
                    isFeatured ? 'md:col-span-2 md:row-span-2' : ''
                  }`}
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    borderRadius: theme.borderRadius.card,
                    boxShadow: 'var(--shadow-card)',
                  }}
                >
                  <div className={`p-6 ${isFeatured ? 'p-8' : ''} h-full flex flex-col`}>
                    {/* Service icon */}
                    <div
                      className={`${isFeatured ? 'w-16 h-16' : 'w-12 h-12'} rounded-2xl flex items-center justify-center mb-4`}
                      style={{ backgroundColor: 'var(--color-primary-100)' }}
                    >
                      <Sparkles
                        className={isFeatured ? 'w-8 h-8' : 'w-6 h-6'}
                        style={{ color: 'var(--color-primary-500)' }}
                      />
                    </div>

                    {/* Service name */}
                    <h4
                      className={`font-bold mb-2 ${isFeatured ? 'text-2xl' : 'text-lg'}`}
                      style={{ color: 'var(--color-text)' }}
                    >
                      {service.name}
                    </h4>

                    {/* Description */}
                    {service.description && (
                      <p
                        className={`mb-4 flex-grow ${isFeatured ? 'text-base' : 'text-sm'} line-clamp-3`}
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        {service.description}
                      </p>
                    )}

                    {/* Footer with price and duration */}
                    <div className="flex items-center justify-between mt-auto pt-4 border-t" style={{ borderColor: 'var(--color-surface-border)' }}>
                      <div className="flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{service.duration_minutes} хв</span>
                      </div>
                      <div
                        className={`font-bold ${isFeatured ? 'text-2xl' : 'text-xl'}`}
                        style={{ color: 'var(--color-primary-500)' }}
                      >
                        {Number(service.price).toLocaleString('uk-UA')} ₴
                      </div>
                    </div>

                    {/* Hover arrow */}
                    <div
                      className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ backgroundColor: 'var(--color-primary-500)' }}
                    >
                      <ArrowRight className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </a>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// Grid Layout - Clean equal cards
function GridLayout({ services, theme, telegramBotLink }: LayoutProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {services.map((service) => (
        <a
          key={service.id}
          href={telegramBotLink}
          target="_blank"
          rel="noopener noreferrer"
          className="group p-6 transition-all hover:scale-[1.02]"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: theme.borderRadius.card,
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: 'var(--color-primary-100)' }}
          >
            <Sparkles className="w-6 h-6" style={{ color: 'var(--color-primary-500)' }} />
          </div>

          <h4 className="font-bold text-lg mb-2" style={{ color: 'var(--color-text)' }}>
            {service.name}
          </h4>

          {service.description && (
            <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>
              {service.description}
            </p>
          )}

          <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--color-surface-border)' }}>
            <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              <Clock className="w-4 h-4" />
              {service.duration_minutes} хв
            </div>
            <div className="font-bold text-xl" style={{ color: 'var(--color-primary-500)' }}>
              {Number(service.price).toLocaleString('uk-UA')} ₴
            </div>
          </div>
        </a>
      ))}
    </div>
  )
}

// Cards Layout - Horizontal scrolling on mobile
function CardsLayout({ services, theme, telegramBotLink }: LayoutProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {services.map((service) => (
        <a
          key={service.id}
          href={telegramBotLink}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-4 p-4 transition-all hover:scale-[1.01]"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: theme.borderRadius.card,
            boxShadow: 'var(--shadow-card)',
            borderLeft: '4px solid var(--color-primary-500)',
          }}
        >
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'var(--color-primary-100)' }}
          >
            <Sparkles className="w-7 h-7" style={{ color: 'var(--color-primary-500)' }} />
          </div>

          <div className="flex-grow min-w-0">
            <h4 className="font-bold" style={{ color: 'var(--color-text)' }}>
              {service.name}
            </h4>
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              <Clock className="w-4 h-4" />
              {service.duration_minutes} хв
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <div className="font-bold text-xl" style={{ color: 'var(--color-primary-500)' }}>
              {Number(service.price).toLocaleString('uk-UA')} ₴
            </div>
            <ArrowRight
              className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: 'var(--color-primary-500)' }}
            />
          </div>
        </a>
      ))}
    </div>
  )
}

// List Layout - Compact grouped by category
function ListLayout({ servicesByCategoryMap, getCategoryName, theme, telegramBotLink }: LayoutProps) {
  if (!servicesByCategoryMap || !getCategoryName) return null

  return (
    <div className="space-y-8">
      {Object.entries(servicesByCategoryMap).map(([catId, catServices]) => (
        <div
          key={catId}
          className="overflow-hidden"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: theme.borderRadius.card,
            boxShadow: 'var(--shadow-card)',
          }}
        >
          {/* Category header */}
          <div
            className="px-6 py-4 flex items-center gap-3"
            style={{ backgroundColor: 'var(--color-primary-50)' }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-primary-100)' }}
            >
              <Sparkles className="w-5 h-5" style={{ color: 'var(--color-primary-500)' }} />
            </div>
            <div className="flex-grow">
              <h3 className="font-bold" style={{ color: 'var(--color-text)' }}>
                {getCategoryName(catId)}
              </h3>
            </div>
            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {catServices.length} послуг
            </span>
          </div>

          {/* Services list */}
          <div className="divide-y" style={{ borderColor: 'var(--color-surface-border)' }}>
            {catServices.map((service) => (
              <a
                key={service.id}
                href={telegramBotLink}
                target="_blank"
                rel="noopener noreferrer"
                className="group px-6 py-4 flex items-center justify-between gap-4 hover:bg-black/5 transition-colors"
              >
                <div className="min-w-0">
                  <h4 className="font-medium" style={{ color: 'var(--color-text)' }}>
                    {service.name}
                  </h4>
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    <Clock className="w-4 h-4" />
                    {service.duration_minutes} хв
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-bold text-xl" style={{ color: 'var(--color-primary-500)' }}>
                    {Number(service.price).toLocaleString('uk-UA')} ₴
                  </span>
                  <ArrowRight
                    className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: 'var(--color-primary-500)' }}
                  />
                </div>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// Empty state
function EmptyState({ theme }: { theme: IndustryTheme }) {
  return (
    <div
      className="text-center py-16 rounded-2xl"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '2px dashed var(--color-surface-border)',
      }}
    >
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
        style={{ backgroundColor: 'var(--color-primary-100)' }}
      >
        <Sparkles className="w-10 h-10" style={{ color: 'var(--color-primary-500)' }} />
      </div>
      <p className="text-lg font-medium" style={{ color: 'var(--color-text)' }}>
        Послуги поки не додані
      </p>
      <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>
        Скоро тут з'являться наші процедури
      </p>
    </div>
  )
}
