'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Search, MapPin, Instagram, X, ChevronLeft, ChevronRight,
  Briefcase, Users, Sparkles,
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
  type MarketplaceCompany, type MarketplaceResponse,
  type CityShort, type MarketplaceCategory,
} from '@/lib/public-api'

const INDUSTRY_LABELS: Record<string, string> = {
  cosmetology: 'Косметологія',
  medical: 'Медицина',
  massage: 'Масаж',
  sport: 'Спорт',
  beauty: 'Краса',
  wellness: 'Велнес',
}

const INDUSTRY_COLORS: Record<string, string> = {
  cosmetology: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  medical: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  massage: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  sport: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  beauty: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  wellness: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
}

function getInstagramUrl(socialLinks?: string): string | null {
  if (!socialLinks) return null
  try {
    const parsed = JSON.parse(socialLinks)
    return parsed.instagram || null
  } catch {
    return null
  }
}

function CompanyCard({ company }: { company: MarketplaceCompany }) {
  const instagram = getInstagramUrl(company.social_links)
  const industryColor = INDUSTRY_COLORS[company.industry_theme] || INDUSTRY_COLORS.cosmetology

  return (
    <Link
      href={`/marketplace/${company.id}-${company.slug}`}
      className="group block rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a2e] overflow-hidden hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1"
    >
      {/* Cover */}
      <div className="relative h-36 bg-gradient-to-br from-indigo-400 via-purple-400 to-violet-500">
        {company.cover_image_url && (
          <Image
            src={company.cover_image_url}
            alt=""
            fill
            className="object-cover"
          />
        )}
        <div className="absolute top-3 right-3 flex gap-1.5">
          <Badge className={`${industryColor} border-0 text-[11px]`}>
            {INDUSTRY_LABELS[company.industry_theme] || company.industry_theme}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="relative px-5 pb-5 pt-8">
        {/* Logo */}
        <div className="absolute -top-8 left-5">
          <div className="w-16 h-16 rounded-xl border-4 border-white dark:border-[#1a1a2e] bg-gray-100 dark:bg-gray-800 overflow-hidden shadow-lg">
            {company.logo_url ? (
              <Image src={company.logo_url} alt={company.name} width={64} height={64} className="object-cover w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">
                {company.name.charAt(0)}
              </div>
            )}
          </div>
        </div>

        {/* Type badge */}
        <div className="absolute -top-3 right-5">
          <Badge variant="outline" className="text-[11px] bg-white dark:bg-[#1a1a2e] border-gray-200 dark:border-white/20">
            {company.type === 'clinic' ? (
              <><Users className="w-3 h-3 mr-1" /> Клініка</>
            ) : (
              <><Briefcase className="w-3 h-3 mr-1" /> Спеціаліст</>
            )}
          </Badge>
        </div>

        {/* Name & specialization */}
        <h3 className="font-semibold text-lg text-gray-900 dark:text-white group-hover:text-indigo-500 transition-colors truncate">
          {company.name}
        </h3>
        {company.specialization && (
          <p className="text-sm text-muted-foreground mt-0.5 truncate">{company.specialization}</p>
        )}

        {/* City */}
        {company.city_info && (
          <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{company.city_info.name}</span>
          </div>
        )}

        {/* Categories */}
        {company.categories.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {company.categories.slice(0, 3).map((cat) => (
              <span key={cat} className="px-2 py-0.5 text-[11px] rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                {cat}
              </span>
            ))}
            {company.categories.length > 3 && (
              <span className="px-2 py-0.5 text-[11px] rounded-full bg-gray-100 dark:bg-white/10 text-gray-500">
                +{company.categories.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer: services count, price, instagram */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-white/10">
          <div className="text-sm">
            {company.services_count > 0 ? (
              <span className="text-muted-foreground">
                {company.services_count} послуг
                {company.min_price != null && (
                  <> &middot; від <span className="font-medium text-gray-900 dark:text-white">{company.min_price} грн</span></>
                )}
              </span>
            ) : (
              <span className="text-muted-foreground text-xs">Немає послуг</span>
            )}
          </div>
          {instagram && (
            <a
              href={instagram.startsWith('http') ? instagram : `https://instagram.com/${instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-indigo-500 hover:text-indigo-600 transition-colors"
            >
              <Instagram className="w-4.5 h-4.5" />
            </a>
          )}
        </div>
      </div>
    </Link>
  )
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a2e] overflow-hidden animate-pulse">
      <div className="h-36 bg-gray-200 dark:bg-gray-700" />
      <div className="px-5 pb-5 pt-10">
        <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded mt-2" />
        <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded mt-3" />
        <div className="flex gap-1 mt-3">
          <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
        </div>
        <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded mt-4 pt-3" />
      </div>
    </div>
  )
}

export default function MarketplacePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [data, setData] = useState<MarketplaceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [cities, setCities] = useState<CityShort[]>([])
  const [categories, setCategories] = useState<MarketplaceCategory[]>([])

  // Read filters from URL
  const q = searchParams.get('q') || ''
  const cityId = searchParams.get('city_id') || ''
  const industryTheme = searchParams.get('industry_theme') || ''
  const type = searchParams.get('type') || ''
  const categoryId = searchParams.get('category_id') || ''
  const page = parseInt(searchParams.get('page') || '1', 10)

  const [searchInput, setSearchInput] = useState(q)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const hasFilters = q || cityId || industryTheme || type || categoryId

  // Update URL params
  const setFilter = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    // Reset page when filters change
    if (key !== 'page') params.delete('page')
    router.push(`/marketplace?${params.toString()}`, { scroll: false })
  }, [searchParams, router])

  const clearFilters = useCallback(() => {
    router.push('/marketplace', { scroll: false })
    setSearchInput('')
  }, [router])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (searchInput !== q) {
        setFilter('q', searchInput)
      }
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchInput]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load filter options
  useEffect(() => {
    publicApi.getMarketplaceCities().then(setCities).catch(() => {})
    publicApi.getMarketplaceCategories().then(setCategories).catch(() => {})
  }, [])

  // Load marketplace data
  useEffect(() => {
    setLoading(true)
    publicApi.getMarketplace({
      q: q || undefined,
      city_id: cityId ? parseInt(cityId) : undefined,
      industry_theme: industryTheme || undefined,
      type: type || undefined,
      category_id: categoryId ? parseInt(categoryId) : undefined,
      page,
      page_size: 18,
    })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [q, cityId, industryTheme, type, categoryId, page])

  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="pt-24 pb-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            Знайдіть свого спеціаліста
          </h1>
          <p className="text-muted-foreground mt-2 text-lg max-w-2xl mx-auto">
            Каталог клінік та спеціалістів краси, здоров&apos;я та спорту
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-[65px] z-40 bg-background/95 backdrop-blur-sm border-b border-gray-200 dark:border-white/10 py-4 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Пошук за назвою..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 h-10 rounded-xl"
              />
            </div>

            {/* City */}
            {cities.length > 0 && (
              <Select value={cityId} onValueChange={(v) => setFilter('city_id', v === '_all' ? '' : v)}>
                <SelectTrigger className="w-[180px] h-10 rounded-xl">
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

            {/* Industry theme */}
            <Select value={industryTheme} onValueChange={(v) => setFilter('industry_theme', v === '_all' ? '' : v)}>
              <SelectTrigger className="w-[170px] h-10 rounded-xl">
                <SelectValue placeholder="Напрямок" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Усі напрямки</SelectItem>
                {Object.entries(INDUSTRY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Type */}
            <Select value={type} onValueChange={(v) => setFilter('type', v === '_all' ? '' : v)}>
              <SelectTrigger className="w-[170px] h-10 rounded-xl">
                <SelectValue placeholder="Тип" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Усі типи</SelectItem>
                <SelectItem value="solo">Спеціаліст</SelectItem>
                <SelectItem value="clinic">Клініка</SelectItem>
              </SelectContent>
            </Select>

            {/* Category */}
            {categories.length > 0 && (
              <Select value={categoryId} onValueChange={(v) => setFilter('category_id', v === '_all' ? '' : v)}>
                <SelectTrigger className="w-[180px] h-10 rounded-xl">
                  <SelectValue placeholder="Категорія" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Усі категорії</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.icon ? `${c.icon} ` : ''}{c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Clear */}
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4 mr-1" /> Скинути
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        {/* Count */}
        {data && !loading && (
          <p className="text-sm text-muted-foreground mb-6">
            {data.total > 0 ? (
              <>Знайдено <span className="font-medium text-foreground">{data.total}</span> {data.total === 1 ? 'результат' : data.total < 5 ? 'результати' : 'результатів'}</>
            ) : null}
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : data && data.items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.items.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Sparkles className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Нічого не знайдено</h3>
            <p className="text-muted-foreground mt-1">Спробуйте змінити фільтри або пошуковий запит</p>
            {hasFilters && (
              <Button variant="outline" className="mt-4" onClick={clearFilters}>
                Скинути фільтри
              </Button>
            )}
          </div>
        )}

        {/* Pagination */}
        {data && data.total_pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setFilter('page', String(page - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: data.total_pages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === data.total_pages || Math.abs(p - page) <= 2)
              .reduce<(number | 'dots')[]>((acc, p, i, arr) => {
                if (i > 0 && arr[i - 1] !== p - 1) acc.push('dots')
                acc.push(p)
                return acc
              }, [])
              .map((p, i) =>
                p === 'dots' ? (
                  <span key={`dots-${i}`} className="px-2 text-muted-foreground">...</span>
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
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.total_pages}
              onClick={() => setFilter('page', String(page + 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </section>

      <Footer />
    </main>
  )
}
