import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Telegram auth data type
export interface TelegramAuthData {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const formData = new FormData()
    formData.append('username', email)
    formData.append('password', password)
    const response = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
  telegramLogin: async (authData: TelegramAuthData) => {
    const response = await api.post('/auth/telegram', authData)
    return response.data
  },
  register: async (data: {
    email: string
    password: string
    first_name: string
    last_name: string
    company_name: string
    company_type: 'solo' | 'clinic'
  }) => {
    const response = await api.post('/auth/register', data)
    return response.data
  },
  getMe: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },
  updateMe: async (data: {
    first_name?: string
    last_name?: string
    patronymic?: string
    phone?: string
    telegram_id?: number | null
  }) => {
    const response = await api.patch('/auth/me', data)
    return response.data
  },
}

// Types
export interface ServiceStep {
  id?: number
  service_id?: number
  order: number
  title: string
  description?: string
  duration_minutes?: number
}

export interface ServiceProduct {
  id?: number
  service_id?: number
  name: string
  description?: string
  manufacturer?: string
}

export interface ServiceCategory {
  id: number
  company_id: number
  parent_id?: number
  name: string
  description?: string
  order: number
  created_at: string
  children?: ServiceCategory[]
}

export interface Service {
  id: number
  company_id: number
  category_id?: number
  doctor_id?: number
  name: string
  description?: string
  duration_minutes: number
  price: number
  is_active: boolean
  created_at: string
  steps?: ServiceStep[]
  products?: ServiceProduct[]
  category?: ServiceCategory
}

// Services API
export const servicesApi = {
  getAll: async (): Promise<Service[]> => {
    const response = await api.get('/services')
    return response.data
  },
  getById: async (id: number): Promise<Service> => {
    const response = await api.get(`/services/${id}`)
    return response.data
  },
  create: async (data: {
    name: string
    description?: string
    duration_minutes: number
    price: number
    category_id?: number
    steps?: Omit<ServiceStep, 'id' | 'service_id'>[]
    products?: Omit<ServiceProduct, 'id' | 'service_id'>[]
  }): Promise<Service> => {
    const response = await api.post('/services', data)
    return response.data
  },
  update: async (id: number, data: Partial<{
    name: string
    description?: string
    duration_minutes: number
    price: number
    category_id?: number
    is_active: boolean
  }>): Promise<Service> => {
    const response = await api.patch(`/services/${id}`, data)
    return response.data
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/services/${id}`)
  },
  // Steps
  addStep: async (serviceId: number, step: Omit<ServiceStep, 'id' | 'service_id'>): Promise<ServiceStep> => {
    const response = await api.post(`/services/${serviceId}/steps`, step)
    return response.data
  },
  updateStep: async (serviceId: number, stepId: number, data: Partial<ServiceStep>): Promise<ServiceStep> => {
    const response = await api.patch(`/services/${serviceId}/steps/${stepId}`, data)
    return response.data
  },
  deleteStep: async (serviceId: number, stepId: number): Promise<void> => {
    await api.delete(`/services/${serviceId}/steps/${stepId}`)
  },
  // Products
  addProduct: async (serviceId: number, product: Omit<ServiceProduct, 'id' | 'service_id'>): Promise<ServiceProduct> => {
    const response = await api.post(`/services/${serviceId}/products`, product)
    return response.data
  },
  updateProduct: async (serviceId: number, productId: number, data: Partial<ServiceProduct>): Promise<ServiceProduct> => {
    const response = await api.patch(`/services/${serviceId}/products/${productId}`, data)
    return response.data
  },
  deleteProduct: async (serviceId: number, productId: number): Promise<void> => {
    await api.delete(`/services/${serviceId}/products/${productId}`)
  },
}

// Categories API
export const categoriesApi = {
  getAll: async (): Promise<ServiceCategory[]> => {
    const response = await api.get('/services/categories')
    return response.data
  },
  getTree: async (): Promise<ServiceCategory[]> => {
    const response = await api.get('/services/categories/tree')
    return response.data
  },
  getById: async (id: number): Promise<ServiceCategory> => {
    const response = await api.get(`/services/categories/${id}`)
    return response.data
  },
  create: async (data: {
    name: string
    description?: string
    parent_id?: number
    order?: number
  }): Promise<ServiceCategory> => {
    const response = await api.post('/services/categories', data)
    return response.data
  },
  update: async (id: number, data: Partial<{
    name: string
    description?: string
    parent_id?: number
    order?: number
  }>): Promise<ServiceCategory> => {
    const response = await api.patch(`/services/categories/${id}`, data)
    return response.data
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/services/categories/${id}`)
  },
}

// Schedule Exception Types
export type ScheduleExceptionType = 'day_off' | 'modified' | 'working' | 'break'

export interface ScheduleException {
  id: number
  doctor_id: number
  date: string
  type: ScheduleExceptionType
  start_time?: string
  end_time?: string
  reason?: string
  created_at: string
}

// Schedule API
export const scheduleApi = {
  getAll: async () => {
    const response = await api.get('/schedule')
    return response.data
  },
  createBulk: async (schedules: Array<{
    day_of_week: number
    start_time: string
    end_time: string
    is_working_day: boolean
  }>) => {
    const response = await api.post('/schedule/bulk', schedules)
    return response.data
  },
  // Exceptions
  getExceptions: async (params?: { date_from?: string; date_to?: string }): Promise<ScheduleException[]> => {
    const response = await api.get('/schedule/exceptions', { params })
    return response.data
  },
  createException: async (data: {
    date: string
    type: ScheduleExceptionType
    start_time?: string
    end_time?: string
    reason?: string
  }): Promise<ScheduleException> => {
    const response = await api.post('/schedule/exceptions', data)
    return response.data
  },
  updateException: async (id: number, data: Partial<{
    type: ScheduleExceptionType
    start_time?: string
    end_time?: string
    reason?: string
  }>): Promise<ScheduleException> => {
    const response = await api.patch(`/schedule/exceptions/${id}`, data)
    return response.data
  },
  deleteException: async (id: number): Promise<void> => {
    await api.delete(`/schedule/exceptions/${id}`)
  },
}

// Appointments API
export const appointmentsApi = {
  getAll: async (params?: {
    date_from?: string
    date_to?: string
    status?: string
  }) => {
    const response = await api.get('/appointments', { params })
    return response.data
  },
  updateStatus: async (id: number, status: string) => {
    const response = await api.patch(`/appointments/${id}`, { status })
    return response.data
  },
}

// Client Types
export interface Client {
  id: number
  telegram_id: number
  telegram_username: string | null
  first_name: string
  last_name: string | null
  phone: string | null
  language: string
  created_at: string
}

export interface Appointment {
  id: number
  company_id: number
  doctor_id: number
  client_id: number
  service_id: number
  date: string
  start_time: string
  end_time: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  created_at: string
  client?: {
    id: number
    first_name: string
    last_name?: string
    phone?: string
    telegram_username?: string
  }
  service?: {
    id: number
    name: string
    duration_minutes: number
    price: number
  }
}

// Clients API
export const clientsApi = {
  getAll: async (): Promise<Client[]> => {
    const response = await api.get('/clients')
    return response.data
  },
  getById: async (id: number): Promise<Client> => {
    const response = await api.get(`/clients/${id}`)
    return response.data
  },
  getAppointments: async (id: number): Promise<Appointment[]> => {
    const response = await api.get(`/clients/${id}/appointments`)
    return response.data
  },
}

// Company Types
export interface Company {
  id: number
  name: string
  slug: string
  type: 'solo' | 'clinic'
  description: string | null
  phone: string | null
  address: string | null
  telegram: string | null
  invite_code: string
  created_at: string
  // Template settings
  template_type: string
  primary_color: string | null
  logo_url: string | null
  cover_image_url: string | null
  // Additional info
  specialization: string | null
  working_hours: string | null
  social_links: string | null
  // Payment requisites
  payment_iban: string | null
  payment_bank_name: string | null
  payment_recipient_name: string | null
  payment_card_number: string | null
  payment_monobank_jar: string | null
}

// Company API
export const companyApi = {
  getMyCompany: async (): Promise<Company> => {
    const response = await api.get('/companies/me')
    return response.data
  },
  createCompany: async (data: { name: string; type: 'solo' | 'clinic' }) => {
    const response = await api.post('/companies/me', data)
    return response.data
  },
  updateCompany: async (data: Partial<{
    name: string
    description: string
    phone: string
    address: string
    telegram: string
    template_type: string
    primary_color: string
    logo_url: string
    cover_image_url: string
    specialization: string
    working_hours: string
    social_links: string
    payment_iban: string
    payment_bank_name: string
    payment_recipient_name: string
    payment_card_number: string
    payment_monobank_jar: string
  }>): Promise<Company> => {
    const response = await api.patch('/companies/me', data)
    return response.data
  },
}

// Upload API
export const uploadApi = {
  uploadLogo: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/uploads/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
  uploadCover: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/uploads/cover', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
}

// Google OAuth Types
export interface GoogleCalendarInfo {
  connected: boolean
  email: string | null
  calendar_enabled: boolean
  calendar_id: string | null
  calendars: Array<{
    id: string
    summary: string
    primary?: boolean
  }>
}

// Google OAuth API
export const googleApi = {
  getAuthUrl: async (action: 'login' | 'link' = 'login'): Promise<{ url: string; state: string }> => {
    const response = await api.get('/auth/google/url', { params: { action } })
    return response.data
  },
  getStatus: async (): Promise<GoogleCalendarInfo> => {
    const response = await api.get('/auth/google/status')
    return response.data
  },
  enableCalendar: async (calendar_id: string = 'primary'): Promise<{ message: string; calendar_id: string }> => {
    const response = await api.post('/auth/google/calendar/enable', null, { params: { calendar_id } })
    return response.data
  },
  disableCalendar: async (): Promise<{ message: string }> => {
    const response = await api.post('/auth/google/calendar/disable')
    return response.data
  },
  disconnect: async (): Promise<{ message: string }> => {
    const response = await api.delete('/auth/google/disconnect')
    return response.data
  },
}
