'use client'

import { Clock, Phone, MapPin, MessageCircle, Star, Instagram, Facebook, ChevronRight, Sparkles, Calendar } from 'lucide-react'
import { Company, Service, ServiceCategory } from '@/lib/api'
import { useState } from 'react'

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
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  // Helper to get category name from id
  const getCategoryName = (catId: string): string => {
    if (catId === 'null') return 'Послуги'
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
    return findCat(categories) || 'Послуги'
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'
  const primaryColor = company.primary_color || '#e91e63'

  // Generate lighter and darker variants
  const hexToHSL = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    let h = 0, s = 0
    const l = (max + min) / 2
    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
        case g: h = ((b - r) / d + 2) / 6; break
        case b: h = ((r - g) / d + 4) / 6; break
      }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
  }

  const hsl = hexToHSL(primaryColor)
  const gradientStart = `hsl(${hsl.h}, ${Math.min(hsl.s + 10, 100)}%, ${Math.min(hsl.l + 5, 60)}%)`
  const gradientEnd = `hsl(${(hsl.h + 30) % 360}, ${hsl.s}%, ${hsl.l}%)`

  // Parse social links
  let socialLinks: { instagram?: string; facebook?: string } = {}
  if (company.social_links) {
    try {
      socialLinks = JSON.parse(company.social_links)
    } catch {}
  }

  const categoryKeys = Object.keys(servicesByCategoryMap)
  const displayedServices = activeCategory
    ? { [activeCategory]: servicesByCategoryMap[activeCategory] }
    : servicesByCategoryMap

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Floating Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3">
        <div className="max-w-4xl mx-auto">
          <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 rounded-2xl shadow-lg shadow-black/5 dark:shadow-black/20 border border-white/20 dark:border-slate-700/50 px-4 py-2.5 flex items-center justify-between">
            <a href="/" className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors flex items-center gap-1">
              <ChevronRight className="w-4 h-4 rotate-180" />
              <span>Головна</span>
            </a>
            <div className="flex items-center gap-3">
              {company.phone && (
                <a
                  href={`tel:${company.phone}`}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
                >
                  <Phone className="w-4 h-4" />
                  <span className="text-sm font-medium">{company.phone}</span>
                </a>
              )}
              {company.phone && (
                <a
                  href={`tel:${company.phone}`}
                  className="sm:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Phone className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </a>
              )}
              {company.telegram && (
                <a
                  href={`https://t.me/${company.telegram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl text-white text-sm font-medium transition-all hover:scale-105 hover:shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})` }}
                >
                  Записатися
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] rounded-full opacity-20 blur-3xl"
            style={{ background: `radial-gradient(circle, ${primaryColor}, transparent 70%)` }}
          />
          <div
            className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] rounded-full opacity-15 blur-3xl"
            style={{ background: `radial-gradient(circle, ${gradientEnd}, transparent 70%)` }}
          />
        </div>

        <div className="relative max-w-4xl mx-auto px-4">
          {/* Profile Card */}
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-2xl shadow-black/5 dark:shadow-black/30 border border-white/50 dark:border-slate-700/50">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              {/* Avatar */}
              <div className="relative group">
                <div
                  className="absolute inset-0 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity"
                  style={{ background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})` }}
                />
                {company.logo_url ? (
                  <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-full overflow-hidden ring-4 ring-white dark:ring-slate-700 shadow-2xl">
                    <img
                      src={`${apiUrl}${company.logo_url}`}
                      alt={company.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className="relative w-36 h-36 md:w-44 md:h-44 rounded-full flex items-center justify-center text-white text-5xl md:text-6xl font-bold shadow-2xl ring-4 ring-white/30"
                    style={{ background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})` }}
                  >
                    {company.name.charAt(0)}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 text-center lg:text-left">
                {company.specialization && (
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-4 bg-white/80 dark:bg-slate-700/80 shadow-sm border border-slate-100 dark:border-slate-600">
                    <Star className="w-4 h-4" style={{ color: primaryColor }} />
                    <span className="text-slate-700 dark:text-slate-200">{company.specialization}</span>
                  </div>
                )}

                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
                  {company.name}
                </h1>

                {company.description && (
                  <p className="text-lg text-slate-600 dark:text-slate-300 max-w-xl mb-6 leading-relaxed">
                    {company.description}
                  </p>
                )}

                {/* Meta info */}
                <div className="flex flex-wrap items-center gap-4 justify-center lg:justify-start text-sm text-slate-500 dark:text-slate-400 mb-6">
                  {company.working_hours && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700/50">
                      <Clock className="w-4 h-4" style={{ color: primaryColor }} />
                      <span>{company.working_hours}</span>
                    </div>
                  )}
                  {company.address && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700/50">
                      <MapPin className="w-4 h-4" style={{ color: primaryColor }} />
                      <span>{company.address}</span>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-3 justify-center lg:justify-start">
                  {company.phone && (
                    <a
                      href={`tel:${company.phone}`}
                      className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-xl font-semibold transition-all hover:scale-105 hover:shadow-xl shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
                        boxShadow: `0 10px 40px -10px ${primaryColor}80`
                      }}
                    >
                      <Phone className="w-5 h-5" />
                      <span>Зателефонувати</span>
                    </a>
                  )}
                  {company.telegram && (
                    <a
                      href={`https://t.me/${company.telegram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold border-2 transition-all hover:scale-105 bg-white dark:bg-slate-800"
                      style={{ borderColor: primaryColor, color: primaryColor }}
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>Telegram</span>
                    </a>
                  )}
                </div>

                {/* Social links */}
                {(socialLinks.instagram || socialLinks.facebook) && (
                  <div className="flex items-center gap-3 mt-6 justify-center lg:justify-start">
                    {socialLinks.instagram && (
                      <a
                        href={`https://instagram.com/${socialLinks.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 text-white hover:scale-110 transition-transform shadow-lg"
                      >
                        <Instagram className="w-5 h-5" />
                      </a>
                    )}
                    {socialLinks.facebook && (
                      <a
                        href={socialLinks.facebook.startsWith('http') ? socialLinks.facebook : `https://facebook.com/${socialLinks.facebook}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-xl bg-blue-600 text-white hover:scale-110 transition-transform shadow-lg"
                      >
                        <Facebook className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 relative">
        <div className="max-w-4xl mx-auto px-4">
          {/* Section header */}
          <div className="text-center mb-12">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4 bg-white dark:bg-slate-800 shadow-md border border-slate-100 dark:border-slate-700"
              style={{ color: primaryColor }}
            >
              <Sparkles className="w-4 h-4" />
              <span>Прайс-лист</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
              Послуги та ціни
            </h2>
          </div>

          {/* Category tabs */}
          {categoryKeys.length > 1 && (
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              <button
                onClick={() => setActiveCategory(null)}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeCategory === null
                    ? 'text-white shadow-lg scale-105'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
                style={activeCategory === null ? {
                  background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
                  boxShadow: `0 8px 30px -8px ${primaryColor}60`
                } : {}}
              >
                Всі послуги
              </button>
              {categoryKeys.map((catId) => (
                <button
                  key={catId}
                  onClick={() => setActiveCategory(catId)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeCategory === catId
                      ? 'text-white shadow-lg scale-105'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                  style={activeCategory === catId ? {
                    background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
                    boxShadow: `0 8px 30px -8px ${primaryColor}60`
                  } : {}}
                >
                  {getCategoryName(catId)}
                </button>
              ))}
            </div>
          )}

          {/* Services grid */}
          <div className="space-y-10">
            {Object.entries(displayedServices).map(([catId, catServices]) => (
              <div key={catId}>
                {categoryKeys.length > 1 && activeCategory === null && (
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className="w-1.5 h-8 rounded-full"
                      style={{ background: `linear-gradient(to bottom, ${gradientStart}, ${gradientEnd})` }}
                    />
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                      {getCategoryName(catId)}
                    </h3>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {catServices.map((service) => (
                    <div
                      key={service.id}
                      className="group relative bg-white dark:bg-slate-800/90 rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl border border-slate-100 dark:border-slate-700/50 transition-all duration-300 hover:-translate-y-1"
                    >
                      {/* Top accent line */}
                      <div
                        className="h-1 w-full"
                        style={{ background: `linear-gradient(90deg, ${gradientStart}, ${gradientEnd})` }}
                      />

                      <div className="p-5">
                        {/* Service name */}
                        <h4 className="font-semibold text-lg text-slate-900 dark:text-white mb-2 line-clamp-1">
                          {service.name}
                        </h4>

                        {/* Description */}
                        {service.description && (
                          <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2 mb-4 min-h-[40px]">
                            {service.description}
                          </p>
                        )}

                        {/* Bottom row: duration and price */}
                        <div className="flex items-end justify-between pt-3 border-t border-slate-100 dark:border-slate-700/50">
                          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">{service.duration_minutes} хв</span>
                          </div>

                          <div className="text-right">
                            <span
                              className="text-2xl font-bold"
                              style={{ color: primaryColor }}
                            >
                              {Number(service.price).toLocaleString('uk-UA')}
                            </span>
                            <span className="text-sm text-slate-400 ml-1">грн</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {services.length === 0 && (
            <div className="text-center py-20 bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: `linear-gradient(135deg, ${primaryColor}20, ${gradientEnd}20)` }}
              >
                <Calendar className="w-10 h-10" style={{ color: primaryColor }} />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-lg">Послуги скоро з'являться</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section - Telegram Bot */}
      {company.telegram && (
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4">
            <div
              className="relative overflow-hidden rounded-3xl p-8 md:p-12 text-center text-white"
              style={{ background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})` }}
            >
              {/* Decorative circles */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

              <div className="relative">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <MessageCircle className="w-8 h-8" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  Запишіться онлайн
                </h2>
                <p className="text-white/80 mb-8 max-w-md mx-auto">
                  Оберіть зручний час та запишіться на процедуру через Telegram-бот
                </p>
                <a
                  href={`https://t.me/${company.telegram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-10 py-4 bg-white rounded-2xl font-semibold text-lg transition-all hover:scale-105 hover:shadow-2xl"
                  style={{ color: primaryColor }}
                >
                  <MessageCircle className="w-6 h-6" />
                  Записатися через бот
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-8 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
            &copy; {new Date().getFullYear()} {company.name}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Працює на{' '}
            <a
              href="/"
              className="font-medium hover:underline"
              style={{ color: primaryColor }}
            >
              Procedure
            </a>
          </p>
        </div>
      </footer>
    </main>
  )
}
