// For server-side rendering, use internal Docker network address
// For client-side, use public URL (inlined at build time)
const API_URL = typeof window === 'undefined'
  ? (process.env.API_URL_INTERNAL || 'http://api:8000/api/v1')
  : (process.env.NEXT_PUBLIC_API_URL || '/api/v1')

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

export interface Company {
  id: number
  name: string
  slug: string
  description?: string
  phone?: string
  address?: string
  telegram?: string
  // Template settings
  template_type?: string
  primary_color?: string
  logo_url?: string
  cover_image_url?: string
  // Additional info
  specialization?: string
  working_hours?: string
  social_links?: string
}

export interface ServiceCategory {
  id: number
  name: string
  description?: string
  children?: ServiceCategory[]
  services?: Service[]
}

export interface Service {
  id: number
  name: string
  description?: string
  duration_minutes: number
  price: number
  category_id?: number
  category?: ServiceCategory
  steps?: ServiceStep[]
  products?: ServiceProduct[]
}

export interface ServiceStep {
  id: number
  title: string
  description?: string
  duration_minutes?: number
  order: number
}

export interface ServiceProduct {
  id: number
  name: string
  description?: string
  manufacturer?: string
}

// Public API for showcase site
export const publicApi = {
  // Get company by slug
  getCompany: (slug: string) =>
    fetchApi<Company>(`/public/companies/${slug}`),

  // Get services for a company
  getServices: (companySlug: string) =>
    fetchApi<Service[]>(`/public/companies/${companySlug}/services`),

  // Get service categories for a company
  getCategories: (companySlug: string) =>
    fetchApi<ServiceCategory[]>(`/public/companies/${companySlug}/categories`),
}
