'use client'

import { Clock, Phone, MapPin, MessageCircle, Sparkles, Building2, Instagram, Facebook, Users } from 'lucide-react'
import { Company, Service, ServiceCategory } from '@/lib/api'
import CompanyHeader from '@/components/CompanyHeader'
import CompanyFooter from '@/components/CompanyFooter'

interface Props {
  company: Company
  services: Service[]
  categories: ServiceCategory[]
  servicesByCategoryMap: Record<string, Service[]>
}

export default function ClinicTemplate({
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

      {/* Hero with cover image */}
      <section className="relative pt-16">
        {/* Cover image */}
        <div className="relative h-64 md:h-80 overflow-hidden">
          {company.cover_image_url ? (
            <img
              src={`${apiUrl}${company.cover_image_url}`}
              alt={company.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}80 100%)`,
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>

        {/* Clinic info overlay */}
        <div className="relative max-w-5xl mx-auto px-4 -mt-20">
          <div className="bg-card rounded-3xl shadow-2xl p-6 md:p-8 border" style={{ borderColor: `${primaryColor}20` }}>
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              {/* Logo */}
              <div className="flex-shrink-0 -mt-16 md:-mt-20">
                {company.logo_url ? (
                  <div
                    className="w-28 h-28 md:w-36 md:h-36 rounded-2xl border-4 shadow-xl overflow-hidden bg-card"
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
                    className="w-28 h-28 md:w-36 md:h-36 rounded-2xl flex items-center justify-center text-white shadow-xl"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Building2 className="w-12 h-12" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
                  <h1 className="text-3xl md:text-4xl font-bold">{company.name}</h1>
                  {company.specialization && (
                    <span
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium self-center"
                      style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                    >
                      <Users className="w-4 h-4" />
                      {company.specialization}
                    </span>
                  )}
                </div>
                {company.description && (
                  <p className="text-muted-foreground mb-4 max-w-2xl">
                    {company.description}
                  </p>
                )}

                {/* Meta info */}
                <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start text-sm text-muted-foreground">
                  {company.working_hours && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" style={{ color: primaryColor }} />
                      {company.working_hours}
                    </span>
                  )}
                  {company.address && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" style={{ color: primaryColor }} />
                      {company.address}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3 mt-6 justify-center md:justify-start">
                  {company.phone && (
                    <a
                      href={`tel:${company.phone}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-xl font-medium hover:opacity-90 transition-all"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <Phone className="w-4 h-4" />
                      {company.phone}
                    </a>
                  )}
                  {company.telegram && (
                    <a
                      href={`https://t.me/${company.telegram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500 text-white rounded-xl font-medium hover:bg-sky-600 transition-all"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Telegram
                    </a>
                  )}
                  {socialLinks.instagram && (
                    <a
                      href={`https://instagram.com/${socialLinks.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white hover:opacity-90 transition-all"
                    >
                      <Instagram className="w-5 h-5" />
                    </a>
                  )}
                  {socialLinks.facebook && (
                    <a
                      href={socialLinks.facebook.startsWith('http') ? socialLinks.facebook : `https://facebook.com/${socialLinks.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all"
                    >
                      <Facebook className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services by Category */}
      <section className="py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card text-sm font-medium mb-4 shadow-sm border"
              style={{ color: primaryColor, borderColor: `${primaryColor}30` }}
            >
              <Sparkles className="w-4 h-4" />
              <span>Наші послуги</span>
            </div>
            <h2 className="text-3xl font-bold">Прайс-лист</h2>
          </div>

          {/* Category tabs/cards */}
          <div className="space-y-8">
            {Object.entries(servicesByCategoryMap).map(([catId, catServices]) => (
              <div
                key={catId ?? 'uncategorized'}
                className="bg-card rounded-2xl border overflow-hidden"
                style={{ borderColor: `${primaryColor}20` }}
              >
                {/* Category header */}
                <div
                  className="px-6 py-4 border-b flex items-center gap-3"
                  style={{ borderColor: `${primaryColor}20`, backgroundColor: `${primaryColor}05` }}
                >
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: primaryColor }} />
                  <h3 className="text-lg font-semibold" style={{ color: primaryColor }}>
                    {getCategoryName(catId)}
                  </h3>
                  <span className="text-sm text-muted-foreground ml-auto">
                    {catServices.length} послуг
                  </span>
                </div>

                {/* Services list */}
                <div className="divide-y" style={{ borderColor: `${primaryColor}10` }}>
                  {catServices.map((service) => (
                    <div
                      key={service.id}
                      className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium">{service.name}</h4>
                        {service.description && (
                          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                            {service.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {service.duration_minutes} хв
                        </span>
                        <span className="text-xl font-bold" style={{ color: primaryColor }}>
                          {Number(service.price).toLocaleString('uk-UA')} ₴
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {services.length === 0 && (
            <div className="text-center py-16 bg-card rounded-2xl border" style={{ borderColor: `${primaryColor}20` }}>
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <Sparkles className="w-10 h-10" style={{ color: primaryColor }} />
              </div>
              <p className="text-muted-foreground text-lg">Послуги поки не додані</p>
            </div>
          )}
        </div>
      </section>

      {/* Map/Address section */}
      {company.address && (
        <section className="py-12 bg-secondary">
          <div className="max-w-5xl mx-auto px-4">
            <div className="bg-card rounded-2xl border p-6 md:p-8" style={{ borderColor: `${primaryColor}20` }}>
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <MapPin className="w-8 h-8" style={{ color: primaryColor }} />
                </div>
                <div className="text-center md:text-left flex-1">
                  <h3 className="text-xl font-semibold mb-1">Наша адреса</h3>
                  <p className="text-muted-foreground">{company.address}</p>
                </div>
                {company.phone && (
                  <a
                    href={`tel:${company.phone}`}
                    className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-xl font-medium hover:opacity-90 transition-all"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Phone className="w-5 h-5" />
                    Зателефонувати
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      <CompanyFooter companyName={company.name} />
    </main>
  )
}
