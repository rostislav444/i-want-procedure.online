'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Search, MapPin, Calendar, Users, GraduationCap,
  X, ChevronLeft, ChevronRight, Clock, BookOpen, Video, Award, UserCircle,
} from 'lucide-react'
import Header from '@/components/site/Header'
import Footer from '@/components/site/Footer'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  publicApi,
  type EducatorCard, type EducatorEventCard, type EducatorOffering,
  type EducationMarketplaceResponse, type EventsListResponse,
  type CityShort, type EducationTopicCategory,
  type EducationFilters, type EventFilters,
} from '@/lib/public-api'

const EVENT_TYPE_LABELS: Record<string, string> = {
  course: 'Курс',
  seminar: 'Семінар',
  masterclass: 'Майстер-клас',
  guide: 'Гайд',
  consultation: 'Консультація',
  certification: 'Сертифікація',
}

const OFFERING_TYPE_ICONS: Record<string, string> = {
  course: '🎓',
  guide: '📄',
  consultation: '💬',
  seminar: '🎤',
  masterclass: '✏️',
}

function formatPrice(kopecks: number): string {
  if (kopecks === 0) return 'Безкоштовно'
  return `${(kopecks / 100).toLocaleString('uk-UA')} ₴`
}

function flattenCategories(cats: EducationTopicCategory[], level = 0): { id: number; name: string; level: number }[] {
  const result: { id: number; name: string; level: number }[] = []
  for (const c of cats) {
    result.push({ id: c.id, name: c.name, level })
    if (c.children) result.push(...flattenCategories(c.children, level + 1))
  }
  return result
}

// ─── Educator Card ───────────────────────────────────────────────
function EducatorCard({ educator }: { educator: EducatorCard }) {
  return (
    <Link
      href={`/education/${educator.slug}`}
      className="group block rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/[0.03] overflow-hidden hover:border-violet-300 dark:hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-200"
    >
      {/* Cover */}
      <div className="relative h-28 bg-neutral-100 dark:bg-white/5 overflow-hidden">
        {educator.cover_image_url ? (
          <Image src={educator.cover_image_url} alt="" fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-neutral-300 dark:text-white/10">
            <GraduationCap className="w-10 h-10" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative px-4 pb-4 pt-7">
        {/* Logo */}
        <div className="absolute -top-7 left-4">
          <div className="w-14 h-14 rounded-xl border-4 border-white dark:border-neutral-900 bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
            {educator.logo_url ? (
              <Image src={educator.logo_url} alt={educator.name} width={56} height={56} className="object-cover w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl font-bold text-violet-400">
                {educator.name.charAt(0)}
              </div>
            )}
          </div>
        </div>

        <h3 className="font-semibold text-sm text-neutral-900 dark:text-white group-hover:text-violet-500 transition-colors truncate">
          {educator.name}
        </h3>
        {educator.educator_tagline && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2">{educator.educator_tagline}</p>
        )}

        {educator.city_info && (
          <div className="flex items-center gap-1 mt-2 text-xs text-neutral-400">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{educator.city_info.name}</span>
          </div>
        )}

        {educator.topic_categories.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {educator.topic_categories.slice(0, 3).map((cat) => (
              <span key={cat} className="px-2 py-0.5 text-[10px] rounded-md bg-neutral-100 dark:bg-white/8 text-neutral-500 dark:text-neutral-400">
                {cat}
              </span>
            ))}
            {educator.topic_categories.length > 3 && (
              <span className="px-2 py-0.5 text-[10px] rounded-md bg-neutral-100 dark:bg-white/8 text-neutral-400">
                +{educator.topic_categories.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100 dark:border-white/8 text-xs text-neutral-400">
          <span>{educator.offerings_count} матеріалів</span>
          {educator.upcoming_events_count > 0 && (
            <span className="text-violet-500 font-medium">{educator.upcoming_events_count} подій</span>
          )}
        </div>
      </div>
    </Link>
  )
}

function EducatorSkeleton() {
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/[0.03] overflow-hidden animate-pulse">
      <div className="h-28 bg-neutral-100 dark:bg-white/5" />
      <div className="px-4 pb-4 pt-7">
        <div className="h-4 w-3/4 bg-neutral-100 dark:bg-white/8 rounded" />
        <div className="h-3 w-1/2 bg-neutral-100 dark:bg-white/8 rounded mt-2" />
        <div className="h-3 w-1/3 bg-neutral-100 dark:bg-white/8 rounded mt-2" />
        <div className="flex gap-1 mt-3">
          <div className="h-4 w-14 bg-neutral-100 dark:bg-white/8 rounded-md" />
          <div className="h-4 w-18 bg-neutral-100 dark:bg-white/8 rounded-md" />
        </div>
        <div className="h-3 w-full bg-neutral-100 dark:bg-white/8 rounded mt-4" />
      </div>
    </div>
  )
}

// ─── Event Card ───────────────────────────────────────────────────
function EventCard({ event }: { event: EducatorEventCard }) {
  const startDate = new Date(event.start_at)
  const typeLabel = EVENT_TYPE_LABELS[event.event_type || ''] || 'Подія'

  return (
    <Link
      href={`/education/${event.educator_slug}/events/${event.id}`}
      className="group flex gap-4 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-4 hover:border-violet-300 dark:hover:border-violet-500/40 hover:shadow-md transition-all duration-200"
    >
      {/* Date badge */}
      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-neutral-100 dark:bg-white/8 flex flex-col items-center justify-center">
        <span className="text-[9px] font-semibold text-neutral-400 uppercase">
          {startDate.toLocaleDateString('uk-UA', { month: 'short' })}
        </span>
        <span className="text-lg font-bold text-neutral-900 dark:text-white leading-none">
          {startDate.getDate()}
        </span>
      </div>

      {/* Cover image */}
      {event.cover_image_url && (
        <div className="flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden hidden sm:block">
          <Image src={event.cover_image_url} alt={event.title} width={64} height={48} className="object-cover w-full h-full" />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400">
            {typeLabel}
          </span>
          {event.is_online && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-white/8 text-neutral-500 flex items-center gap-1">
              <Video className="w-2.5 h-2.5" /> Онлайн
            </span>
          )}
        </div>
        <h3 className="font-medium text-sm text-neutral-900 dark:text-white group-hover:text-violet-500 transition-colors mt-1 line-clamp-1">
          {event.title}
        </h3>
        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-neutral-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {startDate.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {event.city_info && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {event.city_info.name}
            </span>
          )}
          {event.educator_name && (
            <span className="flex items-center gap-1">
              <GraduationCap className="w-3 h-3" />
              {event.educator_name}
            </span>
          )}
        </div>
      </div>

      {/* Price */}
      <div className="flex-shrink-0 text-right">
        <p className={`text-sm font-semibold ${event.price === 0 ? 'text-green-600 dark:text-green-400' : 'text-neutral-900 dark:text-white'}`}>
          {formatPrice(event.price)}
        </p>
        {event.early_bird_price && event.early_bird_until && new Date(event.early_bird_until) > new Date() && (
          <p className="text-[10px] text-amber-500 mt-0.5">Early Bird</p>
        )}
        {event.spots_left !== null && event.spots_left !== undefined && event.spots_left <= 5 && (
          <p className="text-[10px] text-red-500 mt-1">{event.spots_left} місць</p>
        )}
      </div>
    </Link>
  )
}

function EventSkeleton() {
  return (
    <div className="flex gap-4 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-4 animate-pulse">
      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-neutral-100 dark:bg-white/8" />
      <div className="flex-1">
        <div className="h-3 w-20 bg-neutral-100 dark:bg-white/8 rounded" />
        <div className="h-4 w-3/4 bg-neutral-100 dark:bg-white/8 rounded mt-2" />
        <div className="h-3 w-1/2 bg-neutral-100 dark:bg-white/8 rounded mt-2" />
      </div>
      <div className="flex-shrink-0 w-14">
        <div className="h-4 w-full bg-neutral-100 dark:bg-white/8 rounded" />
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────
export default function EducationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const tab = (searchParams.get('tab') || 'offerings') as 'educators' | 'events' | 'offerings'
  const q = searchParams.get('q') || ''
  const cityId = searchParams.get('city_id') || ''
  const categoryId = searchParams.get('category_id') || ''
  const eventType = searchParams.get('event_type') || ''
  const isOnline = searchParams.get('is_online') || ''
  const page = parseInt(searchParams.get('page') || '1', 10)

  const [searchInput, setSearchInput] = useState(q)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const [educatorsData, setEducatorsData] = useState<EducationMarketplaceResponse | null>(null)
  const [eventsData, setEventsData] = useState<EventsListResponse | null>(null)
  const [offeringsData, setOfferingsData] = useState<EducatorOffering[]>([])
  const [loadingEducators, setLoadingEducators] = useState(true)
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [loadingOfferings, setLoadingOfferings] = useState(true)
  const [cities, setCities] = useState<CityShort[]>([])
  const [categories, setCategories] = useState<EducationTopicCategory[]>([])

  const flatCats = flattenCategories(categories)
  const offeringType = searchParams.get('offering_type') || ''
  const hasFilters = q || cityId || categoryId || eventType || isOnline || offeringType

  const setFilter = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    if (key !== 'page') params.delete('page')
    router.push(`/education?${params.toString()}`, { scroll: false })
  }, [searchParams, router])

  const clearFilters = useCallback(() => {
    router.push(`/education?tab=${tab}`, { scroll: false })
    setSearchInput('')
  }, [router, tab])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (searchInput !== q) setFilter('q', searchInput)
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchInput]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    publicApi.getEducationCities().then(setCities).catch(() => {})
    publicApi.getEducationCategories().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    if (tab !== 'educators') return
    setLoadingEducators(true)
    const filters: EducationFilters = {
      q: q || undefined,
      city_id: cityId ? parseInt(cityId) : undefined,
      topic_category_id: categoryId ? parseInt(categoryId) : undefined,
      page,
      page_size: 18,
    }
    publicApi.getEducationMarketplace(filters)
      .then(setEducatorsData)
      .catch(() => setEducatorsData(null))
      .finally(() => setLoadingEducators(false))
  }, [tab, q, cityId, categoryId, page])

  useEffect(() => {
    if (tab !== 'offerings') return
    setLoadingOfferings(true)
    publicApi.getAllOfferings({
      q: q || undefined,
      topic_category_id: categoryId ? parseInt(categoryId) : undefined,
      type: offeringType || undefined,
      page,
      page_size: 18,
    })
      .then(setOfferingsData)
      .catch(() => setOfferingsData([]))
      .finally(() => setLoadingOfferings(false))
  }, [tab, q, categoryId, offeringType, page])

  useEffect(() => {
    if (tab !== 'events') return
    setLoadingEvents(true)
    const filters: EventFilters = {
      q: q || undefined,
      city_id: cityId ? parseInt(cityId) : undefined,
      topic_category_id: categoryId ? parseInt(categoryId) : undefined,
      event_type: eventType || undefined,
      is_online: isOnline === 'true' ? true : isOnline === 'false' ? false : undefined,
      page,
      page_size: 20,
    }
    publicApi.getEducationEvents(filters)
      .then(setEventsData)
      .catch(() => setEventsData(null))
      .finally(() => setLoadingEvents(false))
  }, [tab, q, cityId, categoryId, eventType, isOnline, page])

  const groupedEvents = (eventsData?.items || []).reduce<Record<string, EducatorEventCard[]>>((acc, event) => {
    const key = new Date(event.start_at).toLocaleDateString('uk-UA', { year: 'numeric', month: 'long' })
    if (!acc[key]) acc[key] = []
    acc[key].push(event)
    return acc
  }, {})

  const isLoading = tab === 'educators' ? loadingEducators : tab === 'events' ? loadingEvents : loadingOfferings
  const totalPages = tab === 'educators' ? (educatorsData?.total_pages || 1) : tab === 'events' ? (eventsData?.total_pages || 1) : 1
  const totalItems = tab === 'educators' ? (educatorsData?.total || 0) : tab === 'events' ? (eventsData?.total || 0) : offeringsData.length

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-[#0f0f1a]">
      <Header />

      {/* Nav + Filters */}
      <div className="pt-16 sticky top-0 z-40 bg-white/95 dark:bg-[#0f0f1a]/95 backdrop-blur-sm border-b border-neutral-200 dark:border-white/10">
        <div className="max-w-6xl mx-auto px-4">

          {/* Tab row */}
          <div className="flex items-center gap-1 pt-3">
            {[
              { key: 'offerings', label: 'Матеріали', icon: BookOpen, count: offeringsData.length },
              { key: 'educators', label: 'Спікери', icon: Users, count: educatorsData?.total },
              { key: 'events', label: 'Афіша', icon: Calendar, count: eventsData?.total },
            ].map(({ key, label, icon: Icon, count }) => (
              <button
                key={key}
                onClick={() => setFilter('tab', key)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors relative ${
                  tab === key
                    ? 'text-violet-600 dark:text-violet-400'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {count !== undefined && count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium leading-none ${
                    tab === key
                      ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400'
                      : 'bg-neutral-100 dark:bg-white/10 text-neutral-400'
                  }`}>
                    {count}
                  </span>
                )}
                {tab === key && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-violet-500 rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap items-center gap-2 py-2.5">
            {/* Offering type pills */}
            {tab === 'offerings' && (
              <div className="flex flex-wrap gap-1.5 flex-1">
                {[
                  { value: '', label: 'Всі' },
                  { value: 'course', label: 'Курси' },
                  { value: 'guide', label: 'Гайди' },
                  { value: 'consultation', label: 'Консультації' },
                  { value: 'seminar', label: 'Семінари' },
                  { value: 'masterclass', label: 'Майстер-класи' },
                ].map(({ value, label }) => (
                  <button
                    key={value || '_all'}
                    onClick={() => setFilter('offering_type', value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      offeringType === value
                        ? 'bg-violet-500 text-white'
                        : 'bg-neutral-100 dark:bg-white/8 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-white/15'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* Search */}
            <div className="relative min-w-[180px] flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
              <Input
                placeholder="Пошук..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-8 h-8 text-sm rounded-lg border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5"
              />
            </div>

            {cities.length > 0 && tab !== 'offerings' && (
              <Select value={cityId} onValueChange={(v) => setFilter('city_id', v === '_all' ? '' : v)}>
                <SelectTrigger className="w-[140px] h-8 text-xs rounded-lg border-neutral-200 dark:border-white/10">
                  <SelectValue placeholder="Місто" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Усі міста</SelectItem>
                  {cities.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {flatCats.length > 0 && (
              <Select value={categoryId} onValueChange={(v) => setFilter('category_id', v === '_all' ? '' : v)}>
                <SelectTrigger className="w-[160px] h-8 text-xs rounded-lg border-neutral-200 dark:border-white/10">
                  <SelectValue placeholder="Категорія" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Усі категорії</SelectItem>
                  {flatCats.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {'  '.repeat(c.level)}{c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {tab === 'events' && (
              <>
                <Select value={eventType} onValueChange={(v) => setFilter('event_type', v === '_all' ? '' : v)}>
                  <SelectTrigger className="w-[130px] h-8 text-xs rounded-lg border-neutral-200 dark:border-white/10">
                    <SelectValue placeholder="Тип події" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">Усі типи</SelectItem>
                    {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={isOnline} onValueChange={(v) => setFilter('is_online', v === '_all' ? '' : v)}>
                  <SelectTrigger className="w-[110px] h-8 text-xs rounded-lg border-neutral-200 dark:border-white/10">
                    <SelectValue placeholder="Формат" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">Усі формати</SelectItem>
                    <SelectItem value="false">Офлайн</SelectItem>
                    <SelectItem value="true">Онлайн</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}

            {hasFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
                <X className="w-3.5 h-3.5" /> Скинути
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <section className="py-8">
        <div className="max-w-6xl mx-auto px-4">

          {tab !== 'offerings' && !isLoading && totalItems > 0 && (
            <p className="text-xs text-neutral-400 mb-5">
              Знайдено{' '}
              <span className="font-medium text-neutral-900 dark:text-white">{totalItems}</span>{' '}
              {tab === 'educators'
                ? totalItems === 1 ? 'спікер' : totalItems < 5 ? 'спікери' : 'спікерів'
                : totalItems === 1 ? 'подія' : totalItems < 5 ? 'події' : 'подій'}
            </p>
          )}

          {/* ── Offerings ── */}
          {tab === 'offerings' && (
            <>
              {loadingOfferings ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/[0.03] overflow-hidden animate-pulse">
                      <div className="h-36 bg-neutral-100 dark:bg-white/5" />
                      <div className="p-4 space-y-2">
                        <div className="h-3 w-16 bg-neutral-100 dark:bg-white/8 rounded-full" />
                        <div className="h-4 w-3/4 bg-neutral-100 dark:bg-white/8 rounded" />
                        <div className="h-3 w-full bg-neutral-100 dark:bg-white/8 rounded" />
                        <div className="h-5 w-20 bg-neutral-100 dark:bg-white/8 rounded mt-2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : offeringsData.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {offeringsData.map((offering) => {
                    const typeLabel = EVENT_TYPE_LABELS[offering.type] || offering.type
                    const typeIcon = OFFERING_TYPE_ICONS[offering.type] || '📚'
                    const publishedDate = new Date(offering.created_at).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' })
                    return (
                      <a
                        key={offering.id}
                        href={offering.educator_slug ? `/education/${offering.educator_slug}/${offering.slug}` : '#'}
                        className="group rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/[0.03] overflow-hidden hover:border-violet-300 dark:hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-200 flex flex-col"
                      >
                        {/* Cover */}
                        <div className="relative h-36 bg-neutral-100 dark:bg-white/5 flex-shrink-0 overflow-hidden">
                          {offering.cover_image_url ? (
                            <img src={offering.cover_image_url} alt={offering.title} className="absolute inset-0 w-full h-full object-cover" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-20 select-none">
                              {typeIcon}
                            </div>
                          )}
                          <div className="absolute top-3 left-3 flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/90 dark:bg-black/50 text-neutral-700 dark:text-neutral-300 backdrop-blur-sm">
                              {typeLabel}
                            </span>
                          </div>
                          {offering.certificate_included && (
                            <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-50/90 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 flex items-center gap-1 backdrop-blur-sm">
                              <Award className="w-2.5 h-2.5" /> Сертифікат
                            </span>
                          )}
                        </div>

                        <div className="p-4 flex flex-col flex-1">
                          <h3 className="font-semibold text-sm text-neutral-900 dark:text-white leading-snug group-hover:text-violet-500 transition-colors line-clamp-2">
                            {offering.title}
                          </h3>
                          {offering.short_description && (
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-1.5">{offering.short_description}</p>
                          )}

                          <div className="mt-auto pt-3">
                            <div className="flex items-center justify-between">
                              <span className={`text-sm font-bold ${offering.price === 0 ? 'text-green-600 dark:text-green-400' : 'text-neutral-900 dark:text-white'}`}>
                                {formatPrice(offering.price)}
                              </span>
                              {offering.duration_hours && (
                                <span className="text-xs text-neutral-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />{offering.duration_hours} год
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100 dark:border-white/8">
                              {offering.educator_name ? (
                                <div className="flex items-center gap-1 min-w-0">
                                  <UserCircle className="w-3 h-3 flex-shrink-0 text-violet-400" />
                                  <span className="truncate text-[10px] font-medium text-violet-500 dark:text-violet-400">
                                    {offering.educator_name}
                                  </span>
                                </div>
                              ) : <span />}
                              <span className="text-[10px] text-neutral-400 flex-shrink-0 ml-2">{publishedDate}</span>
                            </div>
                          </div>
                        </div>
                      </a>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-20">
                  <BookOpen className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
                  <h3 className="text-base font-medium text-neutral-900 dark:text-white">Матеріалів не знайдено</h3>
                  <p className="text-sm text-neutral-400 mt-1">Спробуйте змінити фільтри</p>
                  {hasFilters && <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>Скинути фільтри</Button>}
                </div>
              )}
            </>
          )}

          {/* ── Educators ── */}
          {tab === 'educators' && (
            <>
              {loadingEducators ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => <EducatorSkeleton key={i} />)}
                </div>
              ) : educatorsData && educatorsData.items.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {educatorsData.items.map((educator) => (
                    <EducatorCard key={educator.id} educator={educator} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <GraduationCap className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
                  <h3 className="text-base font-medium text-neutral-900 dark:text-white">Спеціалістів не знайдено</h3>
                  <p className="text-sm text-neutral-400 mt-1">Спробуйте змінити фільтри</p>
                  {hasFilters && <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>Скинути фільтри</Button>}
                </div>
              )}
            </>
          )}

          {/* ── Events ── */}
          {tab === 'events' && (
            <>
              {loadingEvents ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => <EventSkeleton key={i} />)}
                </div>
              ) : eventsData && eventsData.items.length > 0 ? (
                <div className="space-y-8">
                  {Object.entries(groupedEvents).map(([month, events]) => (
                    <div key={month}>
                      <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3 capitalize">
                        {month}
                      </h2>
                      <div className="space-y-2">
                        {events.map((event) => (
                          <EventCard key={event.id} event={event} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <Calendar className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
                  <h3 className="text-base font-medium text-neutral-900 dark:text-white">Подій не знайдено</h3>
                  <p className="text-sm text-neutral-400 mt-1">Найближчих подій за вашими фільтрами немає</p>
                  {hasFilters && <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>Скинути фільтри</Button>}
                </div>
              )}
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setFilter('page', String(page - 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                .reduce<(number | 'dots')[]>((acc, p, i, arr) => {
                  if (i > 0 && arr[i - 1] !== p - 1) acc.push('dots')
                  acc.push(p)
                  return acc
                }, [])
                .map((p, i) =>
                  p === 'dots' ? (
                    <span key={`dots-${i}`} className="px-2 text-neutral-400 text-sm">...</span>
                  ) : (
                    <Button
                      key={p}
                      variant={p === page ? 'default' : 'outline'}
                      size="sm"
                      className="min-w-[36px]"
                      onClick={() => setFilter('page', String(p))}
                    >
                      {p}
                    </Button>
                  )
                )}
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setFilter('page', String(page + 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}
