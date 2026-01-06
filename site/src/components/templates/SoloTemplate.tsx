'use client'

import { Clock, Phone, MapPin, MessageCircle, Sparkles, Heart, Instagram, Facebook, ExternalLink } from 'lucide-react'
import { Company, Service, ServiceCategory } from '@/lib/api'
import CompanyHeader from '@/components/CompanyHeader'
import CompanyFooter from '@/components/CompanyFooter'
import WaveDivider from '@/components/WaveDivider'

interface Props {
  company: Company
  services: Service[]
  categories: ServiceCategory[]
  servicesByCategoryMap: Record<string, Service[]>
}

export default function SoloTemplate({
  company,
  services,
  categories,
  servicesByCategoryMap,
}: Props) {
  // Helper to get category name from id
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
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'
  const primaryColor = company.primary_color || '#e91e63'

  // Parse social links
  let socialLinks: { instagram?: string; facebook?: string } = {}
  if (company.social_links) {
    try {
      socialLinks = JSON.parse(company.social_links)
    } catch {}
  }

  return (
    <main className="min-h-screen bg-background overflow-hidden">
      <CompanyHeader />

      {/* Hero with specialist photo */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        {/* Decorative blobs with custom color */}
        <div
          className="absolute w-80 h-80 -top-20 -right-20 rounded-full blur-3xl opacity-40 animate-blob"
          style={{ backgroundColor: primaryColor }}
        />
        <div className="absolute w-64 h-64 bg-yellow-200 top-40 -left-32 rounded-full blur-3xl opacity-50 animate-blob" style={{ animationDelay: '-3s' }} />

        <div className="relative max-w-5xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            {/* Logo/Photo */}
            <div className="flex-shrink-0">
              {company.logo_url ? (
                <div
                  className="w-40 h-40 md:w-52 md:h-52 rounded-full border-4 shadow-2xl overflow-hidden"
                  style={{ borderColor: primaryColor }}
                >
                  <img
                    src={`${apiUrl}${company.logo_url}`}
                    alt={company.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div
                  className="w-40 h-40 md:w-52 md:h-52 rounded-full flex items-center justify-center text-white text-5xl font-bold shadow-2xl"
                  style={{ backgroundColor: primaryColor }}
                >
                  {company.name.charAt(0)}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="text-center md:text-left flex-1">
              {company.specialization && (
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4 animate-float"
                  style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                >
                  <Heart className="w-4 h-4" />
                  <span>{company.specialization}</span>
                </div>
              )}
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">{company.name}</h1>
              {company.description && (
                <p className="text-lg text-muted-foreground max-w-xl mb-6">
                  {company.description}
                </p>
              )}

              {/* Working hours */}
              {company.working_hours && (
                <div className="flex items-center gap-2 text-muted-foreground mb-6 justify-center md:justify-start">
                  <Clock className="w-5 h-5" />
                  <span>{company.working_hours}</span>
                </div>
              )}

              {/* Contact buttons */}
              <div className="flex items-center gap-4 flex-wrap justify-center md:justify-start">
                {company.phone && (
                  <a
                    href={`tel:${company.phone}`}
                    className="group inline-flex items-center gap-2 px-6 py-3 text-white rounded-full font-medium hover:shadow-xl transition-all hover:-translate-y-1"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Phone className="w-5 h-5" />
                    Зателефонувати
                  </a>
                )}
                {company.telegram && (
                  <a
                    href={`https://t.me/${company.telegram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-full font-medium hover:shadow-xl hover:shadow-sky-500/30 transition-all hover:-translate-y-1"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Telegram
                  </a>
                )}
              </div>

              {/* Social links */}
              {(socialLinks.instagram || socialLinks.facebook) && (
                <div className="flex items-center gap-3 mt-4 justify-center md:justify-start">
                  {socialLinks.instagram && (
                    <a
                      href={`https://instagram.com/${socialLinks.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-card border hover:border-pink-300 transition-colors"
                    >
                      <Instagram className="w-5 h-5 text-pink-500" />
                    </a>
                  )}
                  {socialLinks.facebook && (
                    <a
                      href={socialLinks.facebook.startsWith('http') ? socialLinks.facebook : `https://facebook.com/${socialLinks.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-card border hover:border-blue-300 transition-colors"
                    >
                      <Facebook className="w-5 h-5 text-blue-500" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <WaveDivider />
      </section>

      {/* Services */}
      <section className="bg-secondary py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card text-sm font-medium mb-4 shadow-soft"
              style={{ color: primaryColor }}
            >
              <Sparkles className="w-4 h-4" />
              <span>Каталог послуг</span>
            </div>
            <h2 className="text-3xl font-bold">Послуги та ціни</h2>
          </div>

          {Object.entries(servicesByCategoryMap).map(([catId, catServices]) => (
            <div key={catId ?? 'uncategorized'} className="mb-10">
              <h3 className="text-xl font-semibold mb-4 pb-3 border-b flex items-center gap-3" style={{ borderColor: `${primaryColor}40` }}>
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: primaryColor }} />
                <span style={{ color: primaryColor }}>{getCategoryName(catId)}</span>
              </h3>
              <div className="grid gap-4">
                {catServices.map((service) => (
                  <div
                    key={service.id}
                    className="group p-5 sm:p-6 rounded-2xl bg-card border shadow-soft hover:shadow-xl transition-all hover:-translate-y-1"
                    style={{ borderColor: `${primaryColor}20` }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-lg transition-colors" style={{ color: 'inherit' }}>
                          {service.name}
                        </h4>
                        {service.description && (
                          <p className="text-muted-foreground mt-1 line-clamp-2">
                            {service.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                          <span
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full"
                            style={{ backgroundColor: `${primaryColor}10` }}
                          >
                            <Clock className="w-4 h-4" style={{ color: primaryColor }} />
                            {service.duration_minutes} хв
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-2xl font-bold" style={{ color: primaryColor }}>
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
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${primaryColor}20` }}>
                <Sparkles className="w-10 h-10" style={{ color: primaryColor }} />
              </div>
              <p className="text-muted-foreground text-lg">Послуги поки не додані</p>
            </div>
          )}
        </div>
      </section>

      {/* Contact Section */}
      {(company.phone || company.address) && (
        <section className="py-16 relative overflow-hidden">
          <div className="absolute w-64 h-64 bg-yellow-200 -bottom-20 -right-20 rounded-full blur-3xl opacity-50 animate-blob" />

          <div className="max-w-5xl mx-auto px-4 relative">
            <h2 className="text-2xl font-bold mb-8 text-center">Контакти</h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              {company.phone && (
                <a
                  href={`tel:${company.phone}`}
                  className="group flex items-center gap-4 p-5 rounded-2xl bg-card border shadow-soft hover:shadow-xl transition-all hover:-translate-y-1 w-full sm:w-auto"
                  style={{ borderColor: `${primaryColor}20` }}
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Телефон</div>
                    <div className="font-semibold text-lg">{company.phone}</div>
                  </div>
                </a>
              )}
              {company.address && (
                <div
                  className="flex items-center gap-4 p-5 rounded-2xl bg-card border shadow-soft w-full sm:w-auto"
                  style={{ borderColor: `${primaryColor}20` }}
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
                    <MapPin className="w-6 h-6 text-white" />
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

      <CompanyFooter companyName={company.name} />
    </main>
  )
}
