import { notFound } from 'next/navigation'
import { publicApi } from '@/lib/public-api'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, MapPin, Phone, Instagram, Send, Clock, Scissors, Users, Tag } from 'lucide-react'
import { StickyBookBtn } from './StickyBookBtn'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const company = await publicApi.getCompany(slug)
    const specialization = company.specialization || 'Послуги'
    return {
      title: `${company.name} — ${specialization}`,
      description: company.description || `${specialization} від ${company.name}. Перегляньте каталог послуг та ціни.`,
    }
  } catch {
    return { title: 'Компанія не знайдена' }
  }
}

export default async function CompanyPage({ params }: Props) {
  const { slug } = await params

  let company: Awaited<ReturnType<typeof publicApi.getCompany>>
  let services: Awaited<ReturnType<typeof publicApi.getServices>>
  let team: Awaited<ReturnType<typeof publicApi.getTeam>>
  let categories: Awaited<ReturnType<typeof publicApi.getCategories>>

  try {
    ;[company, services, team, categories] = await Promise.all([
      publicApi.getCompany(slug),
      publicApi.getServices(slug),
      publicApi.getTeam(slug).catch(() => []),
      publicApi.getCategories(slug).catch(() => []),
    ])
  } catch {
    notFound()
  }

  const socialLinks: Record<string, string> = {}
  if (company.social_links) {
    try { Object.assign(socialLinks, JSON.parse(company.social_links)) } catch {}
  }

  const instagramHandle = socialLinks.instagram?.replace('@', '') || null
  const instagramUrl = instagramHandle
    ? (instagramHandle.startsWith('http') ? instagramHandle : `https://instagram.com/${instagramHandle}`)
    : null

  const topServices = services.slice(0, 6)
  const minPrice = services.length > 0 ? Math.min(...services.map(s => Number(s.price))) : null
  const base = `/marketplace/${company.id}-${company.slug}`
  const accentColor = company.primary_color || '#C9837A'

  // Flat list of top-level categories with at least 1 service
  const topCategories = categories.filter(c => c.is_active).slice(0, 8)

  return (
    <>
      {/* ── HERO ─────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Soft pastel background gradient */}
        <div
          className="absolute inset-0 dark:hidden"
          style={{ background: `linear-gradient(135deg, #FDF6F0 0%, #FDE8E0 40%, #FAE8F0 100%)` }}
        />
        <div className="absolute inset-0 hidden dark:block bg-gradient-to-br from-[#1a1a2e] to-[#16162a]" />

        {/* Cover image — right side, decorative */}
        {company.cover_image_url && (
          <>
            {/* Desktop: image fills right half */}
            <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden lg:block">
              <Image
                src={company.cover_image_url}
                alt=""
                fill
                className="object-cover"
                priority
              />
              {/* Fade left edge into the gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#FDF6F0] dark:from-[#1a1a2e] via-transparent to-transparent" />
            </div>
            {/* Mobile: image as subtle full-bg */}
            <div className="absolute inset-0 lg:hidden">
              <Image
                src={company.cover_image_url}
                alt=""
                fill
                className="object-cover opacity-15"
                priority
              />
            </div>
          </>
        )}

        {/* Content */}
        <div className="relative w-full">
          <div className="max-w-7xl mx-auto px-4 py-16 lg:py-24 flex flex-col lg:flex-row lg:items-center gap-10 justify-between">
            {/* Left: main info */}
            <div className="max-w-xl lg:max-w-lg">
              {company.specialization && (
                <span
                  className="inline-block text-xs tracking-widest uppercase font-semibold px-3.5 py-1.5 rounded-full mb-6"
                  style={{ backgroundColor: `${accentColor}22`, color: accentColor }}
                >
                  {company.specialization}
                </span>
              )}
              <h1 className="text-5xl lg:text-6xl font-bold tracking-tight leading-tight text-neutral-900 dark:text-white">
                {company.name}
              </h1>
              {company.description && (
                <p className="mt-5 text-base text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-md">
                  {company.description}
                </p>
              )}
              <div className="flex flex-wrap gap-3 mt-10">
                <a
                  href={`https://t.me/i_want_procedure_bot?start=${company.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-8 py-3.5 text-sm font-semibold rounded-full transition-opacity hover:opacity-85 text-white shadow-sm"
                  style={{ backgroundColor: accentColor }}
                >
                  Записатися онлайн
                </a>
                <Link
                  href={`${base}/services`}
                  className="inline-flex items-center gap-2 px-8 py-3.5 border border-neutral-300 text-neutral-700 dark:text-neutral-300 text-sm font-semibold rounded-full hover:border-neutral-400 hover:bg-white/60 transition-colors"
                >
                  Усі послуги
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right: info card */}
            <div className="lg:min-w-[260px] lg:max-w-[290px]">
              <div className="rounded-3xl p-6 flex flex-col gap-4 bg-white/70 dark:bg-white/10 backdrop-blur-sm border border-white shadow-sm text-sm">
                {company.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: accentColor }} />
                    <span className="text-neutral-600 dark:text-neutral-400 leading-snug">{company.address}</span>
                  </div>
                )}
                {company.phone && (
                  <a href={`tel:${company.phone}`} className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
                    <Phone className="w-4 h-4 flex-shrink-0" style={{ color: accentColor }} />
                    {company.phone}
                  </a>
                )}
                {company.working_hours && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: accentColor }} />
                    <span className="text-neutral-600 dark:text-neutral-400 whitespace-pre-line leading-snug">{company.working_hours}</span>
                  </div>
                )}
                {instagramUrl && (
                  <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
                    <Instagram className="w-4 h-4 flex-shrink-0" style={{ color: accentColor }} />
                    @{instagramHandle}
                  </a>
                )}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── STATS STRIP ────────────────────────────────── */}
      <section className="bg-[#F8F6F3] dark:bg-[#13131f]">
        <div className="max-w-7xl mx-auto px-4 py-10 flex flex-wrap gap-6 sm:gap-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-white/5 flex items-center justify-center shadow-sm flex-shrink-0">
              <Scissors className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-neutral-900 dark:text-white">{services.length}</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">послуг</div>
            </div>
          </div>

          {team.length > 1 && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white dark:bg-white/5 flex items-center justify-center shadow-sm flex-shrink-0">
                <Users className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-neutral-900 dark:text-white">{team.length}</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">спеціалістів</div>
              </div>
            </div>
          )}

          {minPrice != null && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white dark:bg-white/5 flex items-center justify-center shadow-sm flex-shrink-0">
                <Tag className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-neutral-900 dark:text-white">від {minPrice.toLocaleString('uk-UA')} ₴</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">ціни</div>
              </div>
            </div>
          )}

          {company.working_hours && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white dark:bg-white/5 flex items-center justify-center shadow-sm flex-shrink-0">
                <Clock className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
              </div>
              <div>
                <div className="text-sm font-semibold text-neutral-900 dark:text-white leading-snug whitespace-pre-line">{company.working_hours}</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">графік роботи</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── CATEGORIES QUICK-NAV ───────────────────────── */}
      {topCategories.length > 0 && (
        <section className="py-8 px-4 bg-white dark:bg-white/5 border-b border-neutral-100 dark:border-white/10">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-1">
              {topCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`${base}/services`}
                  className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-200 dark:border-white/15 bg-white dark:bg-white/5 text-sm text-neutral-600 dark:text-neutral-400 hover:border-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-all whitespace-nowrap"
                >
                  {cat.icon && <span>{cat.icon}</span>}
                  {cat.name}
                </Link>
              ))}
              <Link
                href={`${base}/services`}
                className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap"
                style={{ color: accentColor }}
              >
                Всі послуги <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── SERVICES ──────────────────────────────────── */}
      {topServices.length > 0 && (
        <section className="py-20 px-4 bg-[#FDFAF8] dark:bg-[#0f0f17]">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-xs tracking-widest uppercase text-neutral-400 dark:text-neutral-500 mb-2 font-medium">Наші послуги</p>
                <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">Послуги</h2>
              </div>
              <Link
                href={`${base}/services`}
                className="hidden sm:flex items-center gap-2 text-sm font-medium hover:underline underline-offset-4 transition-colors"
                style={{ color: accentColor }}
              >
                Переглянути всі <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {topServices.map((service) => (
                <Link
                  key={service.id}
                  href={`${base}/services/${service.id}`}
                  className="group bg-white dark:bg-white/5 border border-rose-50 dark:border-white/10 rounded-2xl p-6 hover:-translate-y-1 hover:shadow-md hover:border-rose-100 dark:hover:border-white/10 transition-all duration-200"
                >
                  {service.global_category?.icon && (
                    <span className="text-3xl block mb-4">{service.global_category.icon}</span>
                  )}
                  <h3 className="font-semibold text-neutral-900 dark:text-white text-base leading-snug group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors">
                    {service.name}
                  </h3>
                  {service.description && (
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2 line-clamp-2 leading-relaxed">
                      {service.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-neutral-100 dark:border-white/10">
                    <span className="text-xs text-neutral-400 dark:text-neutral-500 font-medium">
                      {service.duration_minutes} хв
                    </span>
                    <span className="font-bold text-neutral-900 dark:text-white">
                      {service.price_options && service.price_options.length > 0
                        ? `від ${Math.min(...service.price_options.map(o => Number(o.price))).toLocaleString('uk-UA')} ₴`
                        : `${Number(service.price).toLocaleString('uk-UA')} ₴`
                      }
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="flex justify-center mt-8 sm:hidden">
              <Link
                href={`${base}/services`}
                className="flex items-center gap-2 text-sm font-medium"
                style={{ color: accentColor }}
              >
                Переглянути всі <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── TEAM ──────────────────────────────────────── */}
      {team.length > 0 && (
        <section className="py-20 px-4 bg-[#F8F6F3] dark:bg-[#13131f]">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-xs tracking-widest uppercase text-neutral-400 dark:text-neutral-500 mb-2 font-medium">Наша команда</p>
                <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">Спеціалісти</h2>
              </div>
              {team.length > 4 && (
                <Link
                  href={`${base}/team`}
                  className="hidden sm:flex items-center gap-2 text-sm font-medium hover:underline underline-offset-4"
                  style={{ color: accentColor }}
                >
                  Уся команда <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {team.slice(0, 4).map((member: any) => (
                <div key={member.id} className="group relative overflow-hidden rounded-2xl bg-neutral-200 dark:bg-white/10 aspect-[3/4]">
                  {member.photo_url ? (
                    <Image src={member.photo_url} alt={member.name} fill className="object-cover" />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-5xl font-bold text-white/60"
                      style={{ background: `linear-gradient(135deg, ${accentColor}44, ${accentColor}88)` }}
                    >
                      {member.name.charAt(0)}
                    </div>
                  )}
                  {/* Default label */}
                  <div
                    className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-10"
                    style={{ background: `linear-gradient(to top, ${accentColor}cc, transparent)` }}
                  >
                    <p className="text-white font-semibold text-sm leading-tight">{member.name}</p>
                    {member.position && (
                      <p className="text-white/80 text-xs mt-0.5">{member.position}</p>
                    )}
                  </div>
                  {/* Bio overlay on hover */}
                  {member.bio && (
                    <div
                      className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      style={{ background: `${accentColor}ee` }}
                    >
                      <p className="text-white font-semibold text-sm">{member.name}</p>
                      <p className="text-white/70 text-xs mt-0.5 mb-2">{member.position}</p>
                      <p className="text-white/90 text-xs leading-relaxed line-clamp-4">{member.bio}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── HOW IT WORKS ──────────────────────────────── */}
      <section className="py-20 px-4 bg-[#FDF8F5] dark:bg-[#0f0f17]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs tracking-widest uppercase text-neutral-400 dark:text-neutral-500 mb-2 font-medium">Просто і зручно</p>
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">Як записатися</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
            {[
              { num: '1', title: 'Оберіть послугу', desc: 'Перегляньте каталог послуг, ознайомтесь з цінами та тривалістю процедури' },
              { num: '2', title: 'Запишіться онлайн', desc: 'Натисніть «Записатися», оберіть зручний день та час через Telegram-бот' },
              { num: '3', title: 'Прийдіть на процедуру', desc: 'Ми вас чекаємо! Отримайте нагадування та спокійно насолоджуйтесь процедурою' },
            ].map((step) => (
              <div key={step.num} className="flex gap-5 md:flex-col md:gap-4">
                <div
                  className="text-4xl md:text-5xl font-bold leading-none flex-shrink-0"
                  style={{ color: accentColor }}
                >
                  {step.num}
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white text-base">{step.title}</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1.5 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INSTAGRAM BLOCK ──────────────────────────── */}
      {instagramUrl && (
        <section className="py-16 px-4 dark:bg-white/5" style={{ backgroundColor: `${accentColor}0d` }}>
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <Instagram className="w-5 h-5" style={{ color: accentColor }} />
                <span className="font-bold text-neutral-900 dark:text-white text-lg">@{instagramHandle}</span>
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Слідкуйте за нашими роботами та новинами в Instagram</p>
            </div>
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-full text-white text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: accentColor }}
            >
              <Instagram className="w-4 h-4" />
              Дивитись в Instagram
            </a>
          </div>
        </section>
      )}

      {/* ── CTA ───────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#FDF6F0] dark:bg-[#13131f]">
        <div className="max-w-7xl mx-auto px-4 py-24 flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="text-center lg:text-left max-w-lg">
            <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 dark:text-white">
              Готові до процедури?
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 mt-4 text-lg leading-relaxed">
              Запишіться зараз або зв&apos;яжіться з нами для консультації
            </p>
            <div className="flex flex-wrap gap-4 mt-6 justify-center lg:justify-start text-sm text-neutral-500 dark:text-neutral-400">
              {company.phone && (
                <a href={`tel:${company.phone}`} className="flex items-center gap-1.5 hover:text-neutral-900 dark:hover:text-white transition-colors">
                  <Phone className="w-3.5 h-3.5" /> {company.phone}
                </a>
              )}
              {instagramUrl && (
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-neutral-900 dark:hover:text-white transition-colors">
                  <Instagram className="w-3.5 h-3.5" /> Instagram
                </a>
              )}
              {company.telegram && (
                <a href={`https://t.me/${company.telegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-neutral-900 dark:hover:text-white transition-colors">
                  <Send className="w-3.5 h-3.5" /> Telegram
                </a>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={`https://t.me/i_want_procedure_bot?start=${company.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-4 text-sm font-semibold rounded-full text-white shadow-sm transition-opacity hover:opacity-85"
              style={{ backgroundColor: accentColor }}
            >
              Записатися онлайн
            </a>
            <Link
              href={`${base}/contacts`}
              className="inline-flex items-center justify-center px-8 py-4 border border-neutral-300 text-neutral-700 dark:text-neutral-300 text-sm font-semibold rounded-full hover:border-neutral-400 hover:bg-white/60 transition-colors"
            >
              Контакти
            </Link>
          </div>
        </div>
      </section>

      {/* Sticky mobile book button */}
      <StickyBookBtn slug={company.slug} accentColor={accentColor} />
    </>
  )
}
