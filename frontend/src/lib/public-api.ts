/**
 * Public API for site pages (no auth required)
 */

const BASE_URL = typeof window === 'undefined'
  ? (process.env.API_URL_INTERNAL || 'http://localhost:8000')
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
const API_URL = BASE_URL.endsWith('/api/v1') ? BASE_URL : `${BASE_URL}/api/v1`

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!res.ok) {
    throw new Error(`API Error: ${res.status}`)
  }

  return res.json()
}

export interface PublicCompany {
  id: number
  name: string
  slug: string
  description?: string
  phone?: string
  address?: string
  telegram?: string
  template_type?: string
  industry_theme?: string
  primary_color?: string
  accent_color?: string
  secondary_color?: string
  background_color?: string
  accent_font?: string
  body_font?: string
  logo_url?: string
  cover_image_url?: string
  specialization?: string
  working_hours?: string
  social_links?: string
}

export interface PublicWebsiteSection {
  id: number
  company_id: number
  section_type: string
  order: number
  is_visible: boolean
  content: Record<string, unknown>
  style?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface PublicServiceCategory {
  id: number
  name: string
  name_en?: string
  description?: string
  icon?: string
  order: number
  is_active: boolean
  is_ai_created?: boolean
  children?: PublicServiceCategory[]
}

export interface PublicServicePriceOption {
  id: number
  name: string
  price: number
  duration_minutes?: number
  order: number
}

export interface PublicService {
  id: number
  name: string
  description?: string
  duration_minutes: number
  price: number
  global_category_id?: number
  global_category?: { id: number; name: string; icon?: string }
  steps?: PublicServiceStep[]
  products?: PublicServiceProduct[]
  price_options?: PublicServicePriceOption[]
}

export interface PublicServiceStep {
  id: number
  title: string
  description?: string
  duration_minutes?: number
  order: number
}

export interface PublicServiceProduct {
  id: number
  name: string
  description?: string
  manufacturer?: string
}

// Marketplace types
export interface MarketplaceCompany {
  id: number
  name: string
  slug: string
  type: string
  description?: string
  logo_url?: string
  cover_image_url?: string
  specialization?: string
  industry_theme: string
  city_info?: { id: number; name: string; oblast: string }
  social_links?: string
  services_count: number
  min_price?: number
  max_price?: number
  categories: string[]
}

export interface MarketplaceResponse {
  items: MarketplaceCompany[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface MarketplaceFilters {
  q?: string
  city_id?: number
  industry_theme?: string
  type?: string
  category_id?: number
  page?: number
  page_size?: number
}

export interface MarketplaceCategory {
  id: number
  name: string
  icon?: string
}

export interface CityShort {
  id: number
  name: string
  oblast: string
}

export interface PublicTeamMember {
  id: number
  name: string
  position: string
  bio?: string
  photo_url?: string
  is_owner: boolean
}

/** Build a marketplace URL path for a company: /marketplace/{id}-{slug} */
export function companyUrl(company: { id: number; slug: string }): string {
  return `/marketplace/${company.id}-${company.slug}`
}

// Public API for showcase site
export const publicApi = {
  getCompany: (slug: string) =>
    fetchApi<PublicCompany>(`/public/companies/${slug}`),

  getServices: (companySlug: string) =>
    fetchApi<PublicService[]>(`/public/companies/${companySlug}/services`),

  getCategories: (companySlug: string) =>
    fetchApi<PublicServiceCategory[]>(`/public/companies/${companySlug}/categories`),

  getWebsiteSections: (companySlug: string) =>
    fetchApi<PublicWebsiteSection[]>(`/public/companies/${companySlug}/website-sections`),

  getTeam: (companySlug: string) =>
    fetchApi<PublicTeamMember[]>(`/public/companies/${companySlug}/team`),

  // Marketplace
  getMarketplace: (filters: MarketplaceFilters = {}) => {
    const params = new URLSearchParams()
    if (filters.q) params.set('q', filters.q)
    if (filters.city_id) params.set('city_id', String(filters.city_id))
    if (filters.industry_theme) params.set('industry_theme', filters.industry_theme)
    if (filters.type) params.set('type', filters.type)
    if (filters.category_id) params.set('category_id', String(filters.category_id))
    if (filters.page) params.set('page', String(filters.page))
    if (filters.page_size) params.set('page_size', String(filters.page_size))
    const qs = params.toString()
    return fetchApi<MarketplaceResponse>(`/public/marketplace${qs ? `?${qs}` : ''}`)
  },

  getMarketplaceCities: () =>
    fetchApi<CityShort[]>('/public/marketplace/cities'),

  getMarketplaceCategories: () =>
    fetchApi<MarketplaceCategory[]>('/public/marketplace/categories'),

  // Education Marketplace
  getEducationMarketplace: (filters: EducationFilters = {}) => {
    const params = new URLSearchParams()
    if (filters.q) params.set('q', filters.q)
    if (filters.city_id) params.set('city_id', String(filters.city_id))
    if (filters.topic_category_id) params.set('topic_category_id', String(filters.topic_category_id))
    if (filters.page) params.set('page', String(filters.page))
    if (filters.page_size) params.set('page_size', String(filters.page_size))
    const qs = params.toString()
    return fetchApi<EducationMarketplaceResponse>(`/public/education${qs ? `?${qs}` : ''}`)
  },

  getEducationEvents: (filters: EventFilters = {}) => {
    const params = new URLSearchParams()
    if (filters.q) params.set('q', filters.q)
    if (filters.city_id) params.set('city_id', String(filters.city_id))
    if (filters.topic_category_id) params.set('topic_category_id', String(filters.topic_category_id))
    if (filters.event_type) params.set('event_type', filters.event_type)
    if (filters.date_from) params.set('date_from', filters.date_from)
    if (filters.date_to) params.set('date_to', filters.date_to)
    if (filters.price_min !== undefined) params.set('price_min', String(filters.price_min))
    if (filters.price_max !== undefined) params.set('price_max', String(filters.price_max))
    if (filters.is_online !== undefined) params.set('is_online', String(filters.is_online))
    if (filters.page) params.set('page', String(filters.page))
    if (filters.page_size) params.set('page_size', String(filters.page_size))
    const qs = params.toString()
    return fetchApi<EventsListResponse>(`/public/education/events${qs ? `?${qs}` : ''}`)
  },

  getEducationCities: () =>
    fetchApi<CityShort[]>('/public/education/cities'),

  getEducationCategories: () =>
    fetchApi<EducationTopicCategory[]>('/public/education/categories'),

  getEducator: (slug: string) =>
    fetchApi<EducatorDetail>(`/public/education/${slug}`),

  getEducatorOfferings: (slug: string) =>
    fetchApi<EducatorOffering[]>(`/public/education/${slug}/offerings`),

  getEducatorOffering: (slug: string, offeringSlug: string) =>
    fetchApi<EducatorOffering>(`/public/education/${slug}/offerings/${offeringSlug}`),

  getAllOfferings: (params?: { q?: string; topic_category_id?: number; type?: string; page?: number; page_size?: number }) => {
    const qs = new URLSearchParams()
    if (params?.q) qs.set('q', params.q)
    if (params?.topic_category_id) qs.set('topic_category_id', String(params.topic_category_id))
    if (params?.type) qs.set('type', params.type)
    if (params?.page) qs.set('page', String(params.page))
    if (params?.page_size) qs.set('page_size', String(params.page_size))
    const query = qs.toString()
    return fetchApi<EducatorOffering[]>(`/public/education/offerings${query ? '?' + query : ''}`)
  },

  getEducatorEvents: (slug: string) =>
    fetchApi<EducatorEventCard[]>(`/public/education/${slug}/events`),

  getEducatorEventDetail: (slug: string, eventId: number) =>
    fetchApi<EducatorEventCard>(`/public/education/${slug}/events/${eventId}`),

  getOfferingQuestions: (slug: string, offeringSlug: string) =>
    fetchApi<OfferingQuestion[]>(`/public/education/${slug}/offerings/${offeringSlug}/questions`),

  postOfferingQuestion: async (slug: string, offeringSlug: string, data: { visitor_name: string; visitor_email?: string; question: string }) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/public/education/${slug}/offerings/${offeringSlug}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to post question')
    return res.json() as Promise<OfferingQuestion>
  },
}

// Education types
export interface EducationFilters {
  q?: string
  city_id?: number
  topic_category_id?: number
  page?: number
  page_size?: number
}

export interface EventFilters {
  q?: string
  city_id?: number
  topic_category_id?: number
  event_type?: string
  date_from?: string
  date_to?: string
  price_min?: number
  price_max?: number
  is_online?: boolean
  page?: number
  page_size?: number
}

export interface EducationTopicCategory {
  id: number
  parent_id?: number | null
  name: string
  name_en?: string | null
  icon?: string | null
  order: number
  is_active: boolean
  children?: EducationTopicCategory[]
}

export interface EducatorCard {
  id: number
  name: string
  slug: string
  description?: string | null
  logo_url?: string | null
  cover_image_url?: string | null
  educator_tagline?: string | null
  industry_theme: string
  city_info?: CityShort | null
  social_links?: string | null
  offerings_count: number
  upcoming_events_count: number
  topic_categories: string[]
}

export interface EducatorDetail {
  id: number
  name: string
  slug: string
  description?: string | null
  logo_url?: string | null
  cover_image_url?: string | null
  educator_tagline?: string | null
  educator_credentials?: string | null
  educator_video_url?: string | null
  industry_theme: string
  city_info?: CityShort | null
  phone?: string | null
  telegram?: string | null
  social_links?: string | null
  primary_color?: string | null
  secondary_color?: string | null
  accent_font?: string | null
  body_font?: string | null
  bio?: string | null
  instagram_url?: string | null
  youtube_url?: string | null
  website_url?: string | null
  students_count?: number
}

export interface CurriculumLesson {
  title: string
  description?: string
  duration_min: number
  type: 'video' | 'text' | 'practice' | 'quiz'
}

export interface CurriculumSection {
  section_title: string
  section_description?: string
  lessons: CurriculumLesson[]
}

export interface EducatorOffering {
  id: number
  company_id: number
  topic_category_id?: number | null
  type: string
  title: string
  slug: string
  description?: string | null
  short_description?: string | null
  cover_image_url?: string | null
  price: number
  currency: string
  is_digital: boolean
  digital_file_url?: string | null
  promo_video_url?: string | null
  content_url?: string | null
  prerequisites?: string | null
  duration_hours?: number | null
  is_active: boolean
  order: number
  created_at: string
  topic_category?: EducationTopicCategory | null
  upcoming_events_count: number
  learning_outcomes?: string[] | null
  target_audience?: string | null
  level?: string | null
  curriculum?: CurriculumSection[] | null
  language?: string
  certificate_included?: boolean
  what_includes?: string[] | null
  educator_slug?: string | null
  educator_name?: string | null
}

export interface EducatorEventCard {
  id: number
  title: string
  description?: string | null
  cover_image_url?: string | null
  event_type?: string | null
  start_at: string
  end_at?: string | null
  is_multi_day: boolean
  city_info?: CityShort | null
  is_online: boolean
  price: number
  early_bird_price?: number | null
  early_bird_until?: string | null
  max_participants?: number | null
  spots_left?: number | null
  educator_name?: string
  educator_slug?: string
  educator_logo_url?: string | null
  registrations_count?: number
  ticket_types?: PublicTicketType[]
  online_link?: string | null
  venue_name?: string | null
  venue_address?: string | null
}

export interface PublicTicketType {
  id: number
  name: string
  description?: string | null
  price: number
  quantity?: number | null
  sold_count: number
  spots_left?: number | null
  is_active: boolean
  order: number
}

export interface EducationMarketplaceResponse {
  items: EducatorCard[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface EventsListResponse {
  items: EducatorEventCard[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface OfferingQuestion {
  id: number
  visitor_name: string
  question: string
  answer?: string | null
  is_answered: boolean
  created_at: string
  answered_at?: string | null
}
