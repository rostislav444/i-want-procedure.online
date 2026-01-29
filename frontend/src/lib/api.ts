import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Helper to construct full URL for static files (images, uploads)
export function getFileUrl(path: string | null | undefined): string {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${API_URL}${path}`
}

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token and company ID to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Add selected company ID header
    const companyId = localStorage.getItem('selected_company_id')
    if (companyId) {
      config.headers['X-Company-Id'] = companyId
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
        window.location.href = '/auth/login'
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
  position_id?: number
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
    position_id?: number
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
    position_id?: number | null
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
  // AI Generation
  generateFromAI: async (data: {
    position_name: string
    source_type: 'text' | 'url' | 'pdf'
    content: string
    city?: string
    additional_instructions?: string
  }): Promise<{
    services: Array<{
      name: string
      description: string
      duration_minutes: number
      price: number
      category_name: string
    }>
    categories: string[]
    estimated_tokens: number
  }> => {
    const response = await api.post('/services/generate-from-ai', data)
    return response.data
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
    specialist_id?: number  // Filter by specialist (for clinics)
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
  // Appointment stats
  total_appointments: number
  completed_appointments: number
  upcoming_appointments: number
  // Next appointment details
  next_visit_date: string | null
  next_visit_time: string | null
  next_visit_service: string | null
  // Last visit details
  last_visit_date: string | null
  last_visit_service: string | null
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
  getAll: async (filters?: { memberId?: number; positionId?: number }): Promise<Client[]> => {
    const params: Record<string, number> = {}
    if (filters?.memberId) params.member_id = filters.memberId
    if (filters?.positionId) params.position_id = filters.positionId
    const response = await api.get('/clients', { params })
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
  generateTest: async (count: number = 10): Promise<Client[]> => {
    const response = await api.post('/clients/generate-test', { count })
    return response.data
  },
}

// Procedure Protocol Types
export interface ProtocolProduct {
  id: number
  name: string
  manufacturer?: string
  quantity?: string
  batch_number?: string
  notes?: string
}

export interface ProcedureProtocol {
  id: number
  appointment_id: number
  specialist_id?: number
  // Dynamic template support
  template_id?: number
  template_data?: Record<string, Record<string, unknown>>  // {"section_id": {"field_id": value}}
  template?: {
    id: number
    name: string
    sections: Array<{
      id: string
      title: string
      icon?: string
      color?: string
      fields: Array<{
        id: string
        type: string
        label: string
        options?: string[]
        max?: number
        min?: number
        step?: number
      }>
    }>
  }
  // Legacy fields
  skin_condition?: string
  complaints?: string
  procedure_notes?: string
  technique_used?: string
  results?: string
  recommendations?: string
  next_visit_notes?: string
  photos_before?: string[]
  photos_after?: string[]
  products_used: ProtocolProduct[]
  created_at: string
  updated_at: string
}

export interface ProtocolProductCreate {
  name: string
  manufacturer?: string
  quantity?: string
  batch_number?: string
  notes?: string
}

export interface ProcedureProtocolCreate {
  appointment_id: number
  // Dynamic template support
  template_id?: number
  template_data?: Record<string, Record<string, unknown>>
  // Legacy fields
  skin_condition?: string
  complaints?: string
  procedure_notes?: string
  technique_used?: string
  results?: string
  recommendations?: string
  next_visit_notes?: string
  photos_before?: string[]
  photos_after?: string[]
  products_used?: ProtocolProductCreate[]
}

// Protocol File (photo uploads)
export interface ProtocolFile {
  id: number
  protocol_id?: number
  file_type: 'before' | 'after'
  filename: string
  original_filename: string
  file_path: string
  file_size: number
  mime_type: string
  show_in_portfolio: boolean
  uploaded_by?: number
  created_at: string
}

// Protocols API
export const protocolsApi = {
  getByAppointment: async (appointmentId: number): Promise<ProcedureProtocol> => {
    const response = await api.get(`/protocols/appointment/${appointmentId}`)
    return response.data
  },
  getByClient: async (clientId: number): Promise<ProcedureProtocol[]> => {
    const response = await api.get(`/protocols/client/${clientId}`)
    return response.data
  },
  create: async (data: ProcedureProtocolCreate): Promise<ProcedureProtocol> => {
    const response = await api.post('/protocols', data)
    return response.data
  },
  update: async (id: number, data: Partial<ProcedureProtocolCreate>): Promise<ProcedureProtocol> => {
    const response = await api.patch(`/protocols/${id}`, data)
    return response.data
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/protocols/${id}`)
  },
  addProduct: async (protocolId: number, product: ProtocolProductCreate): Promise<ProtocolProduct> => {
    const response = await api.post(`/protocols/${protocolId}/products`, product)
    return response.data
  },
  removeProduct: async (protocolId: number, productId: number): Promise<void> => {
    await api.delete(`/protocols/${protocolId}/products/${productId}`)
  },
  // File management
  getFiles: async (protocolId: number): Promise<ProtocolFile[]> => {
    const response = await api.get(`/protocols/${protocolId}/files`)
    return response.data
  },
  attachFiles: async (protocolId: number, fileIds: number[]): Promise<ProtocolFile[]> => {
    const response = await api.post(`/protocols/${protocolId}/files/attach`, { file_ids: fileIds })
    return response.data
  },
  deleteFile: async (protocolId: number, fileId: number): Promise<void> => {
    await api.delete(`/protocols/${protocolId}/files/${fileId}`)
  },
  getUnattachedFiles: async (): Promise<ProtocolFile[]> => {
    const response = await api.get('/protocols/files/unattached')
    return response.data
  },
  deleteUnattachedFile: async (fileId: number): Promise<void> => {
    await api.delete(`/protocols/files/${fileId}`)
  },
  updateFile: async (fileId: number, data: { show_in_portfolio?: boolean }): Promise<ProtocolFile> => {
    const response = await api.patch(`/protocols/files/${fileId}`, data)
    return response.data
  },
}

// Company Membership (for company selection)
export interface CompanyMembership {
  id: number
  name: string
  slug: string
  type: 'solo' | 'clinic'
  logo_url: string | null
  is_owner: boolean
  is_manager: boolean
  is_specialist: boolean
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
  team_invite_code: string
  created_at: string
  // Template settings
  template_type: string
  industry_theme: string | null
  // Colors (3-color system)
  primary_color: string | null
  accent_color: string | null
  secondary_color: string | null
  background_color: string | null
  // Fonts
  accent_font: string | null
  body_font: string | null
  // Images
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
  getMyMemberships: async (): Promise<CompanyMembership[]> => {
    const response = await api.get('/companies/my-memberships')
    return response.data
  },
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
    industry_theme: string
    primary_color: string  // Legacy
    accent_color: string
    secondary_color: string
    background_color: string
    accent_font: string
    body_font: string
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
  uploadProtocolPhoto: async (file: File, fileType: 'before' | 'after'): Promise<ProtocolFile> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('file_type', fileType)
    const response = await api.post('/uploads/protocol-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
}

// Website Section Types
export interface WebsiteSection {
  id: number
  company_id: number
  section_type: string
  order: number
  is_visible: boolean
  content: Record<string, unknown>
  style: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface SectionTypeInfo {
  type: string
  name: string
  description: string
  icon: string
  is_premium: boolean
  default_content: Record<string, unknown>
}

export interface IndustryThemeInfo {
  id: string
  name: string
  description: string
  primary_color: string
  gradient_from: string
  gradient_to: string
}

// Website API
export const websiteApi = {
  getSections: async (): Promise<WebsiteSection[]> => {
    const response = await api.get('/website/sections')
    return response.data
  },
  createSection: async (data: {
    section_type: string
    content?: Record<string, unknown>
    style?: Record<string, unknown>
  }): Promise<WebsiteSection> => {
    const response = await api.post('/website/sections', data)
    return response.data
  },
  updateSection: async (id: number, data: {
    content?: Record<string, unknown>
    style?: Record<string, unknown>
    is_visible?: boolean
  }): Promise<WebsiteSection> => {
    const response = await api.patch(`/website/sections/${id}`, data)
    return response.data
  },
  deleteSection: async (id: number): Promise<void> => {
    await api.delete(`/website/sections/${id}`)
  },
  reorderSections: async (items: { id: number; order: number }[]): Promise<void> => {
    await api.post('/website/sections/reorder', items)
  },
  resetToDefaults: async (): Promise<void> => {
    await api.post('/website/sections/reset')
  },
  getSectionTypes: async (): Promise<SectionTypeInfo[]> => {
    const response = await api.get('/website/section-types')
    return response.data
  },
  getThemes: async (): Promise<IndustryThemeInfo[]> => {
    const response = await api.get('/website/themes')
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

// Specialist Types
export interface SpecialistListItem {
  id: number
  user_id: number
  first_name: string
  last_name: string
  position: string | null
  position_id: number | null
  is_active: boolean
  services_count: number
  google_connected: boolean
}

export interface SpecialistProfile {
  id: number
  user_id: number
  company_id: number
  position: string | null
  position_id: number | null
  photo_url: string | null
  bio: string | null
  is_active: boolean
  created_at: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  services_count: number
  clients_count: number
  appointments_today: number
  google_connected: boolean
}

export interface SpecialistService {
  id: number
  member_id: number
  service_id: number
  service_name: string
  service_price: number
  service_duration_minutes: number
  custom_price: number | null
  custom_duration_minutes: number | null
  is_active: boolean
  created_at: string
}

// Specialists API
export const specialistsApi = {
  getAll: async (companyId: number, includeInactive = false): Promise<SpecialistListItem[]> => {
    const response = await api.get('/specialists', { params: { company_id: companyId, include_inactive: includeInactive } })
    return response.data
  },
  getMe: async (companyId?: number): Promise<SpecialistProfile> => {
    const response = await api.get('/specialists/me', { params: companyId ? { company_id: companyId } : {} })
    return response.data
  },
  getById: async (id: number, companyId: number): Promise<SpecialistProfile> => {
    const response = await api.get(`/specialists/${id}`, { params: { company_id: companyId } })
    return response.data
  },
  update: async (id: number, companyId: number, data: {
    position_id?: number | null
    bio?: string
    is_active?: boolean
  }): Promise<SpecialistProfile> => {
    const response = await api.patch(`/specialists/${id}`, data, { params: { company_id: companyId } })
    return response.data
  },
  // Services
  getServices: async (specialistId: number, companyId: number): Promise<SpecialistService[]> => {
    const response = await api.get(`/specialists/${specialistId}/services`, { params: { company_id: companyId } })
    return response.data
  },
  assignServices: async (specialistId: number, companyId: number, serviceIds: number[]): Promise<SpecialistService[]> => {
    const response = await api.post(`/specialists/${specialistId}/services`, { service_ids: serviceIds }, { params: { company_id: companyId } })
    return response.data
  },
  removeService: async (specialistId: number, companyId: number, serviceId: number): Promise<void> => {
    await api.delete(`/specialists/${specialistId}/services/${serviceId}`, { params: { company_id: companyId } })
  },
  // Appointments
  getAppointments: async (specialistId: number, companyId: number, params?: { date_from?: string; date_to?: string }): Promise<Appointment[]> => {
    const response = await api.get(`/specialists/${specialistId}/appointments`, { params: { company_id: companyId, ...params } })
    return response.data
  },
  // Clients
  getClients: async (specialistId: number, companyId: number): Promise<Client[]> => {
    const response = await api.get(`/specialists/${specialistId}/clients`, { params: { company_id: companyId } })
    return response.data
  },
}

// Position types
export interface Position {
  id: number
  company_id: number
  name: string
  description: string | null
  color: string | null
  order: number
  created_at: string
  services_count: number
}

export interface PositionService {
  id: number
  name: string
  description: string | null
  duration_minutes: number
  price: number
  is_active: boolean
}

export interface PositionSpecialist {
  id: number
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  bio: string | null
  is_active: boolean
}

export interface PositionDetail extends Position {
  services: PositionService[]
  specialists: PositionSpecialist[]
  specialists_count: number
}

// Positions API
export const positionsApi = {
  getAll: async (): Promise<Position[]> => {
    const response = await api.get('/positions')
    return response.data
  },
  getById: async (id: number): Promise<PositionDetail> => {
    const response = await api.get(`/positions/${id}`)
    return response.data
  },
  create: async (data: {
    name: string
    description?: string
    color?: string
    order?: number
  }): Promise<Position> => {
    const response = await api.post('/positions', data)
    return response.data
  },
  update: async (id: number, data: {
    name?: string
    description?: string
    color?: string
    order?: number
  }): Promise<Position> => {
    const response = await api.patch(`/positions/${id}`, data)
    return response.data
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/positions/${id}`)
  },
}

// Section Template Types
export interface SectionTemplate {
  id: number
  name: string
  description: string | null
  section_type: string
  html_template: string
  variables_schema: Record<string, {
    type: string
    required?: boolean
    label?: string
    default?: string
  }>
  preview_image_url: string | null
  source_image_url: string | null
  is_system: boolean
  created_by_id: number | null
  tags: string[]
  created_at: string
  updated_at: string
}

// Section Templates API
export const sectionTemplatesApi = {
  getAll: async (sectionType?: string, includeSystem = true): Promise<SectionTemplate[]> => {
    const response = await api.get('/section-templates', {
      params: { section_type: sectionType, include_system: includeSystem }
    })
    return response.data
  },
  getById: async (id: number): Promise<SectionTemplate> => {
    const response = await api.get(`/section-templates/${id}`)
    return response.data
  },
  create: async (data: {
    name: string
    description?: string
    section_type?: string
    html_template: string
    variables_schema?: Record<string, unknown>
    tags?: string[]
  }): Promise<SectionTemplate> => {
    const response = await api.post('/section-templates', data)
    return response.data
  },
  update: async (id: number, data: {
    name?: string
    description?: string
    html_template?: string
    variables_schema?: Record<string, unknown>
    tags?: string[]
  }): Promise<SectionTemplate> => {
    const response = await api.patch(`/section-templates/${id}`, data)
    return response.data
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/section-templates/${id}`)
  },
  render: async (templateId: number, variables: Record<string, string>): Promise<{ html: string }> => {
    const response = await api.post(`/section-templates/${templateId}/render`, {
      template_id: templateId,
      variables
    })
    return response.data
  },
  generateFullSite: async (data: {
    company_name: string
    description: string
    services?: string[]
    phone?: string
    address?: string
    primary_color?: string
    industry?: string
    additional_instructions?: string
  }): Promise<{ html: string; estimated_tokens: number }> => {
    const response = await api.post('/section-templates/generate-site', data)
    return response.data
  },
  generateFullSiteFromImage: async (
    images: File[],
    companyName: string,
    prompt?: string,
    mode: 'inspired' | 'copy' = 'inspired',
    autoCrop: boolean = true
  ): Promise<{ html: string; estimated_tokens: number }> => {
    const formData = new FormData()
    images.forEach((image) => {
      formData.append('images', image)
    })
    formData.append('company_name', companyName)
    formData.append('mode', mode)
    formData.append('auto_crop', autoCrop.toString())
    if (prompt) {
      formData.append('prompt', prompt)
    }
    const response = await api.post('/section-templates/generate-site-from-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 180000, // 3 min timeout for multiple images
    })
    return response.data
  },
  improveSite: async (data: {
    company_name: string
    current_html: string
    corrections: string
  }): Promise<{ html: string; estimated_tokens: number }> => {
    const response = await api.post('/section-templates/improve-site', data, {
      timeout: 120000, // 2 min timeout
    })
    return response.data
  },
  saveLanding: async (data: {
    html: string
    prompt?: string
    had_reference_image?: boolean
    reference_images?: Array<{
      data: string  // base64 data URL or raw base64
      media_type?: string
      name?: string
    }>
  }): Promise<{ success: boolean; message: string; version_id: number }> => {
    const response = await api.post('/section-templates/save-landing', data)
    return response.data
  },
  // Landing versions API
  listVersions: async (): Promise<LandingVersionListItem[]> => {
    const response = await api.get('/section-templates/landing-versions')
    return response.data
  },
  getVersion: async (versionId: number): Promise<LandingVersion> => {
    const response = await api.get(`/section-templates/landing-versions/${versionId}`)
    return response.data
  },
  updateVersionNotes: async (versionId: number, notes: string): Promise<LandingVersion> => {
    const response = await api.patch(`/section-templates/landing-versions/${versionId}/notes`, { notes })
    return response.data
  },
  activateVersion: async (versionId: number): Promise<LandingVersion> => {
    const response = await api.post(`/section-templates/landing-versions/${versionId}/activate`)
    return response.data
  },
  deleteVersion: async (versionId: number): Promise<void> => {
    await api.delete(`/section-templates/landing-versions/${versionId}`)
  },
}

// Reference image stored with landing version
export interface ReferenceImageData {
  data: string  // base64 data URL or raw base64
  media_type?: string
  name?: string
}

// Landing version types
export interface LandingVersionListItem {
  id: number
  prompt: string | null
  had_reference_image: boolean
  has_reference_images: boolean
  notes: string | null
  is_active: boolean
  created_at: string
}

export interface LandingVersion extends LandingVersionListItem {
  html: string
  reference_images?: ReferenceImageData[]
}

// Protocol Template Types
export type ProtocolFieldType =
  | 'text'
  | 'textarea'
  | 'chips'
  | 'chips_multi'
  | 'rating'
  | 'number'
  | 'select'
  | 'checkbox'
  | 'date'
  | 'photos'
  | 'products'

export interface ProtocolTemplateField {
  id: string
  type: ProtocolFieldType
  label: string
  placeholder?: string
  required?: boolean
  options?: string[]  // for chips/chips_multi/select
  max?: number  // for rating
  min?: number  // for number
  step?: number  // for number
  max_photos?: number  // for photos
}

export interface ProtocolTemplateSection {
  id: string
  title: string
  icon?: string  // Lucide icon name
  color?: string  // Tailwind color (blue, violet, green, etc.)
  fields: ProtocolTemplateField[]
}

export interface ProtocolTemplate {
  id: number
  company_id?: number
  service_id?: number
  category_id?: number
  name: string
  description?: string
  sections: ProtocolTemplateSection[]
  is_default: boolean
  is_system: boolean
  tags: string[]
  created_at: string
  updated_at: string
}

export interface ProtocolTemplateCreate {
  name: string
  description?: string
  sections: ProtocolTemplateSection[]
  service_id?: number
  category_id?: number
  is_default?: boolean
  tags?: string[]
}

export interface GenerateProtocolTemplateRequest {
  service_name: string
  service_description?: string
  category_name?: string
  hints?: string
}

export interface GenerateProtocolTemplateResponse {
  name: string
  description: string
  sections: ProtocolTemplateSection[]
  suggested_tags: string[]
}

// Updated ProcedureProtocol with template support
export interface ProcedureProtocolWithTemplate extends ProcedureProtocol {
  template_id?: number
  template_data?: Record<string, Record<string, unknown>>  // {"section_id": {"field_id": value}}
  template?: {
    id: number
    name: string
    sections: ProtocolTemplateSection[]
  }
}

// Protocol Templates API
export const protocolTemplatesApi = {
  getAll: async (serviceId?: number, categoryId?: number): Promise<ProtocolTemplate[]> => {
    const response = await api.get('/protocol-templates', {
      params: { service_id: serviceId, category_id: categoryId }
    })
    return response.data
  },
  getById: async (id: number): Promise<ProtocolTemplate> => {
    const response = await api.get(`/protocol-templates/${id}`)
    return response.data
  },
  getForService: async (serviceId: number): Promise<ProtocolTemplate | null> => {
    const response = await api.get(`/protocol-templates/for-service/${serviceId}`)
    return response.data
  },
  create: async (data: ProtocolTemplateCreate): Promise<ProtocolTemplate> => {
    const response = await api.post('/protocol-templates', data)
    return response.data
  },
  update: async (id: number, data: Partial<ProtocolTemplateCreate>): Promise<ProtocolTemplate> => {
    const response = await api.patch(`/protocol-templates/${id}`, data)
    return response.data
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/protocol-templates/${id}`)
  },
  copy: async (data: {
    source_template_id: number
    new_name?: string
    target_service_id?: number
    target_category_id?: number
  }): Promise<ProtocolTemplate> => {
    const response = await api.post('/protocol-templates/copy', data)
    return response.data
  },
  generate: async (data: GenerateProtocolTemplateRequest): Promise<GenerateProtocolTemplateResponse> => {
    const response = await api.post('/protocol-templates/generate', data, {
      timeout: 60000, // 1 min timeout for AI generation
    })
    return response.data
  },
}

// === Inventory Types ===

export interface InventoryAttribute {
  id: number
  group_id: number
  name: string
  value: string
  extra_data?: Record<string, unknown>
  order: number
  is_active: boolean
}

export interface InventoryAttributeGroup {
  id: number
  company_id: number
  name: string
  slug: string
  description?: string
  selection_type: 'single' | 'multi'
  value_type: 'text' | 'number' | 'color' | 'boolean'
  is_filterable: boolean
  show_in_card: boolean
  order: number
  is_active: boolean
  attributes: InventoryAttribute[]
  created_at: string
}

export interface InventoryCategory {
  id: number
  company_id: number
  parent_id?: number
  name: string
  description?: string
  image_url?: string
  photo_level?: number
  display_type: string
  order: number
  is_active: boolean
  created_at: string
  items_count: number
  children?: InventoryCategory[]
  attribute_groups?: InventoryAttributeGroup[]
}

export interface ItemImage {
  url: string
  is_main?: boolean
}

export interface ItemAttribute {
  id: number
  attribute_id: number
  attribute_name: string
  attribute_value: string
  group_name: string
  group_id: number
  custom_value?: string
}

export interface InventoryItemVariant {
  id: number
  name: string
  sku?: string
  barcode?: string
  purchase_price?: number
  sale_price?: number
  quantity_in_pack: number
  order: number
  is_default: boolean
  is_active: boolean
  current_stock: number
  is_low_stock: boolean
  images?: ItemImage[]
}

export interface InventoryItem {
  id: number
  company_id: number
  category_id?: number
  brand_id?: number
  collection_id?: number
  parent_id?: number
  name: string
  sku?: string
  barcode?: string
  description?: string
  usage_type: 'internal' | 'sale' | 'both'
  purchase_price?: number
  sale_price?: number
  unit: string
  min_stock_level?: number
  manufacturer?: string
  images?: ItemImage[]
  is_active: boolean
  is_available_for_sale: boolean
  quantity_in_pack: number
  order: number
  is_default: boolean
  created_at: string
  updated_at: string
  current_stock: number
  total_stock: number
  is_low_stock: boolean
  category_name?: string
  brand_name?: string
  collection_name?: string
  attributes?: ItemAttribute[]
  // Варіанти (дочірні товари)
  variants?: InventoryItemVariant[]
  variants_count?: number
  min_variant_price?: number
  max_variant_price?: number
}

export interface VariantListItem {
  id: number
  name: string
  sale_price?: number
  current_stock: number
  is_default: boolean
  is_low_stock?: boolean
}

export interface InventoryItemListItem {
  id: number
  name: string
  sku?: string
  barcode?: string
  usage_type: 'internal' | 'sale' | 'both'
  purchase_price?: number
  sale_price?: number
  unit: string
  current_stock: number
  total_stock: number
  is_low_stock: boolean
  main_image_url?: string
  category_name?: string
  category_id?: number
  parent_id?: number
  is_active: boolean
  is_available_for_sale: boolean
  quantity_in_pack: number
  order: number
  is_default: boolean
  // Brand & Collection
  brand_id?: number
  brand_name?: string
  collection_id?: number
  collection_name?: string
  // Для батьківських товарів
  variants_count?: number
  min_variant_price?: number
  max_variant_price?: number
  variants?: VariantListItem[]
}

export interface StockMovement {
  id: number
  company_id: number
  item_id: number
  item_name: string
  movement_type: 'incoming' | 'outgoing' | 'sale' | 'adjustment' | 'write_off'
  quantity: number
  unit_price?: number
  appointment_id?: number
  performed_by?: number
  performed_by_name?: string
  notes?: string
  batch_number?: string
  expiry_date?: string
  created_at: string
}

export interface ServiceInventoryItem {
  id: number
  service_id: number
  item_id: number
  item_name: string
  quantity: number
  current_stock: number
  unit: string
  created_at: string
}

export interface InventoryStats {
  total_items: number
  low_stock_items: number
  total_value: number
  items_for_sale: number
  items_internal: number
}

// Brand & Collection types
export interface Brand {
  id: number
  company_id: number
  name: string
  slug: string
  logo_url?: string
  description?: string
  website?: string
  order: number
  is_active: boolean
  created_at: string
  collections?: Collection[]
  items_count?: number
}

export interface Collection {
  id: number
  brand_id: number
  name: string
  slug: string
  image_url?: string
  description?: string
  order: number
  is_active: boolean
  created_at: string
  items_count?: number
}

export interface PaginatedItemsResponse {
  items: InventoryItemListItem[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

// === Inventory API ===

export const inventoryApi = {
  // Categories
  getCategories: async (): Promise<InventoryCategory[]> => {
    const response = await api.get('/inventory/categories')
    return response.data
  },
  getCategoriesTree: async (): Promise<InventoryCategory[]> => {
    const response = await api.get('/inventory/categories/tree')
    return response.data
  },
  getCategory: async (id: number): Promise<InventoryCategory> => {
    const response = await api.get(`/inventory/categories/${id}`)
    return response.data
  },
  createCategory: async (data: {
    name: string
    description?: string
    parent_id?: number
    image_url?: string
    photo_level?: number
    display_type?: string
    order?: number
    attribute_group_ids?: number[]
  }): Promise<InventoryCategory> => {
    const response = await api.post('/inventory/categories', data)
    return response.data
  },
  updateCategory: async (id: number, data: Partial<{
    name: string
    description?: string
    parent_id?: number
    image_url?: string
    photo_level?: number
    display_type?: string
    order?: number
    is_active?: boolean
    attribute_group_ids?: number[]
  }>): Promise<InventoryCategory> => {
    const response = await api.patch(`/inventory/categories/${id}`, data)
    return response.data
  },
  deleteCategory: async (id: number): Promise<void> => {
    await api.delete(`/inventory/categories/${id}`)
  },

  // Attribute Groups
  getAttributeGroups: async (): Promise<InventoryAttributeGroup[]> => {
    const response = await api.get('/inventory/attribute-groups')
    return response.data
  },
  getAttributeGroup: async (id: number): Promise<InventoryAttributeGroup> => {
    const response = await api.get(`/inventory/attribute-groups/${id}`)
    return response.data
  },
  createAttributeGroup: async (data: {
    name: string
    slug: string
    description?: string
    selection_type?: string
    value_type?: string
    is_filterable?: boolean
    show_in_card?: boolean
    order?: number
    attributes?: Array<{ name: string; value: string; metadata?: Record<string, unknown>; order?: number }>
  }): Promise<InventoryAttributeGroup> => {
    const response = await api.post('/inventory/attribute-groups', data)
    return response.data
  },
  updateAttributeGroup: async (id: number, data: Partial<{
    name: string
    slug: string
    description?: string
    selection_type?: string
    value_type?: string
    is_filterable?: boolean
    show_in_card?: boolean
    order?: number
    is_active?: boolean
  }>): Promise<InventoryAttributeGroup> => {
    const response = await api.patch(`/inventory/attribute-groups/${id}`, data)
    return response.data
  },
  deleteAttributeGroup: async (id: number): Promise<void> => {
    await api.delete(`/inventory/attribute-groups/${id}`)
  },
  addAttribute: async (groupId: number, data: {
    name: string
    value: string
    metadata?: Record<string, unknown>
    order?: number
  }): Promise<InventoryAttribute> => {
    const response = await api.post(`/inventory/attribute-groups/${groupId}/attributes`, data)
    return response.data
  },
  updateAttribute: async (attributeId: number, data: Partial<{
    name: string
    value: string
    metadata?: Record<string, unknown>
    order?: number
    is_active?: boolean
  }>): Promise<InventoryAttribute> => {
    const response = await api.patch(`/inventory/attributes/${attributeId}`, data)
    return response.data
  },
  deleteAttribute: async (attributeId: number): Promise<void> => {
    await api.delete(`/inventory/attributes/${attributeId}`)
  },

  // Items
  getItems: async (params?: {
    category_id?: number | null
    parent_id?: number | null
    include_children?: boolean
    usage_type?: string | null
    is_low_stock?: boolean
    search?: string
    is_active?: boolean
    brand_id?: number | null
    collection_id?: number | null
    page?: number
    page_size?: number
  }): Promise<PaginatedItemsResponse> => {
    const response = await api.get('/inventory/items', { params })
    return response.data
  },
  getItem: async (id: number): Promise<InventoryItem> => {
    const response = await api.get(`/inventory/items/${id}`)
    return response.data
  },
  createItem: async (data: {
    name: string
    category_id?: number
    parent_id?: number
    sku?: string
    barcode?: string
    description?: string
    usage_type?: string
    purchase_price?: number
    sale_price?: number
    unit?: string
    min_stock_level?: number
    manufacturer?: string
    images?: ItemImage[]
    attributes?: Array<{ attribute_id: number; custom_value?: string }>
    is_available_for_sale?: boolean
    quantity_in_pack?: number
    order?: number
    is_default?: boolean
    initial_stock?: number
    // Варіанти для створення разом з батьківським товаром
    variants?: Array<{
      name: string
      sku?: string
      barcode?: string
      purchase_price?: number
      sale_price?: number
      quantity_in_pack?: number
      order?: number
      is_default?: boolean
      initial_stock?: number
      images?: ItemImage[]
    }>
  }): Promise<InventoryItem> => {
    const response = await api.post('/inventory/items', data)
    return response.data
  },
  updateItem: async (id: number, data: Partial<{
    name: string
    category_id?: number
    parent_id?: number
    sku?: string
    barcode?: string
    description?: string
    usage_type?: string
    purchase_price?: number
    sale_price?: number
    unit?: string
    min_stock_level?: number
    manufacturer?: string
    images?: ItemImage[]
    is_active?: boolean
    is_available_for_sale?: boolean
    quantity_in_pack?: number
    order?: number
    is_default?: boolean
  }>): Promise<InventoryItem> => {
    const response = await api.patch(`/inventory/items/${id}`, data)
    return response.data
  },
  deleteItem: async (id: number): Promise<void> => {
    await api.delete(`/inventory/items/${id}`)
  },
  setItemAttributes: async (itemId: number, attributes: Array<{
    attribute_id: number
    custom_value?: string
  }>): Promise<InventoryItem> => {
    const response = await api.post(`/inventory/items/${itemId}/attributes`, attributes)
    return response.data
  },

  // Stock Movements
  getItemMovements: async (itemId: number, includeVariants: boolean = true, params?: {
    skip?: number
    limit?: number
  }): Promise<StockMovement[]> => {
    const response = await api.get(`/inventory/items/${itemId}/movements`, {
      params: { ...params, include_variants: includeVariants }
    })
    return response.data
  },
  createMovement: async (data: {
    item_id: number
    movement_type: string
    quantity: number
    unit_price?: number
    appointment_id?: number
    notes?: string
    batch_number?: string
    expiry_date?: string
  }): Promise<StockMovement> => {
    const response = await api.post('/inventory/movements', data)
    return response.data
  },
  getAllMovements: async (params?: {
    movement_type?: string
    item_id?: number
    skip?: number
    limit?: number
  }): Promise<StockMovement[]> => {
    const response = await api.get('/inventory/movements', { params })
    return response.data
  },

  // Service Inventory Items
  getServiceItems: async (serviceId: number): Promise<ServiceInventoryItem[]> => {
    const response = await api.get(`/inventory/services/${serviceId}/items`)
    return response.data
  },
  addServiceItem: async (serviceId: number, data: {
    item_id: number
    quantity?: number
  }): Promise<ServiceInventoryItem> => {
    const response = await api.post(`/inventory/services/${serviceId}/items`, data)
    return response.data
  },
  removeServiceItem: async (serviceId: number, itemId: number): Promise<void> => {
    await api.delete(`/inventory/services/${serviceId}/items/${itemId}`)
  },

  // Stats
  getStats: async (): Promise<InventoryStats> => {
    const response = await api.get('/inventory/stats')
    return response.data
  },
  getLowStockItems: async (): Promise<InventoryItemListItem[]> => {
    const response = await api.get('/inventory/low-stock')
    return response.data
  },

  // Brands
  getBrands: async (params?: { is_active?: boolean }): Promise<Brand[]> => {
    const response = await api.get('/inventory/brands', { params })
    return response.data
  },
  getBrand: async (id: number): Promise<Brand> => {
    const response = await api.get(`/inventory/brands/${id}`)
    return response.data
  },
  createBrand: async (data: {
    name: string
    slug?: string
    logo_url?: string
    description?: string
    website?: string
    order?: number
  }): Promise<Brand> => {
    const response = await api.post('/inventory/brands', data)
    return response.data
  },
  updateBrand: async (id: number, data: Partial<{
    name: string
    slug: string
    logo_url?: string
    description?: string
    website?: string
    order?: number
    is_active?: boolean
  }>): Promise<Brand> => {
    const response = await api.patch(`/inventory/brands/${id}`, data)
    return response.data
  },
  deleteBrand: async (id: number): Promise<void> => {
    await api.delete(`/inventory/brands/${id}`)
  },

  // Collections
  getCollections: async (brandId?: number, params?: { is_active?: boolean }): Promise<Collection[]> => {
    const response = await api.get('/inventory/collections', { params: { brand_id: brandId, ...params } })
    return response.data
  },
  getCollection: async (id: number): Promise<Collection> => {
    const response = await api.get(`/inventory/collections/${id}`)
    return response.data
  },
  createCollection: async (data: {
    brand_id: number
    name: string
    slug?: string
    image_url?: string
    description?: string
    order?: number
  }): Promise<Collection> => {
    const response = await api.post('/inventory/collections', data)
    return response.data
  },
  updateCollection: async (id: number, data: Partial<{
    name: string
    slug: string
    image_url?: string
    description?: string
    order?: number
    is_active?: boolean
  }>): Promise<Collection> => {
    const response = await api.patch(`/inventory/collections/${id}`, data)
    return response.data
  },
  deleteCollection: async (id: number): Promise<void> => {
    await api.delete(`/inventory/collections/${id}`)
  },
}
