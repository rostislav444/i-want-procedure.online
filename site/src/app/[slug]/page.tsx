import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Clock, Phone, MapPin, MessageCircle, Sparkles, ArrowLeft } from 'lucide-react'
import { publicApi, Service, ServiceCategory } from '@/lib/api'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const company = await publicApi.getCompany(slug)
    return {
      title: `${company.name} — Косметологічні послуги`,
      description: company.description || `Косметологічні послуги від ${company.name}. Перегляньте каталог послуг та ціни.`,
    }
  } catch {
    return {
      title: 'Компанія не знайдена',
    }
  }
}

export default async function CompanyPage({ params }: Props) {
  const { slug } = await params

  let company
  let categories: ServiceCategory[] = []
  let services: Service[] = []

  try {
    ;[company, categories, services] = await Promise.all([
      publicApi.getCompany(slug),
      publicApi.getCategories(slug),
      publicApi.getServices(slug),
    ])
  } catch (error) {
    notFound()
  }

  // Group services by category
  const servicesByCategory = new Map<number | null, Service[]>()
  services.forEach((service) => {
    const catId = service.category_id || null
    if (!servicesByCategory.has(catId)) {
      servicesByCategory.set(catId, [])
    }
    servicesByCategory.get(catId)!.push(service)
  })

  const getCategoryName = (id: number | null) => {
    if (!id) return 'Інші послуги'
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
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            На головну
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4" />
            <span>Procedure</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-background" />
        <div className="relative max-w-5xl mx-auto px-4 py-16 sm:py-20 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">{company.name}</h1>
          {company.description && (
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              {company.description}
            </p>
          )}

          {/* Contact buttons */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {company.phone && (
              <a
                href={`tel:${company.phone}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/25"
              >
                <Phone className="w-5 h-5" />
                Зателефонувати
              </a>
            )}
            {company.telegram && (
              <a
                href={`https://t.me/${company.telegram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-sky-500 text-white rounded-full font-medium hover:bg-sky-600 transition-colors shadow-lg shadow-sky-500/25"
              >
                <MessageCircle className="w-5 h-5" />
                Telegram
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-600 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            <span>Каталог послуг</span>
          </div>
          <h2 className="text-3xl font-bold">Послуги та ціни</h2>
        </div>

        {Array.from(servicesByCategory.entries()).map(([catId, catServices]) => (
          <div key={catId ?? 'uncategorized'} className="mb-10">
            <h3 className="text-xl font-semibold text-blue-600 mb-4 pb-3 border-b flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {getCategoryName(catId)}
            </h3>
            <div className="grid gap-4">
              {catServices.map((service) => (
                <div
                  key={service.id}
                  className="group p-5 sm:p-6 rounded-2xl border bg-card hover:border-blue-500/30 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-lg group-hover:text-blue-600 transition-colors">
                        {service.name}
                      </h4>
                      {service.description && (
                        <p className="text-muted-foreground mt-1 line-clamp-2">
                          {service.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          {service.duration_minutes} хв
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-2xl font-bold text-blue-600">
                        {Number(service.price).toLocaleString('uk-UA')}
                      </div>
                      <div className="text-sm text-muted-foreground">грн</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {services.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-lg">Послуги поки не додані</p>
          </div>
        )}
      </section>

      {/* Contact Section */}
      {(company.phone || company.address) && (
        <section className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border-t">
          <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
            <h2 className="text-2xl font-bold mb-8 text-center">Контакти</h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
              {company.phone && (
                <a
                  href={`tel:${company.phone}`}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-background border hover:border-blue-500/30 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Phone className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Телефон</div>
                    <div className="font-semibold">{company.phone}</div>
                  </div>
                </a>
              )}
              {company.address && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-background border">
                  <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Адреса</div>
                    <div className="font-semibold">{company.address}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} {company.name}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Працює на{' '}
            <Link href="/" className="text-blue-500 hover:underline">
              Procedure
            </Link>
          </p>
        </div>
      </footer>
    </main>
  )
}
