/**
 * Public API for site pages (no auth required)
 */

const API_URL = typeof window === 'undefined'
  ? (process.env.API_URL_INTERNAL || 'http://localhost:8000/api/v1')
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1')

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
  description?: string
  children?: PublicServiceCategory[]
  services?: PublicService[]
}

export interface PublicService {
  id: number
  name: string
  description?: string
  duration_minutes: number
  price: number
  category_id?: number
  category?: PublicServiceCategory
  steps?: PublicServiceStep[]
  products?: PublicServiceProduct[]
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
}
