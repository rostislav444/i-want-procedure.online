import { api } from './api'

// Types
export interface PlatformStats {
  total_companies: number
  active_companies: number
  total_users: number
  total_clients: number
  total_appointments: number
  appointments_this_month: number
  active_subscriptions: number
  trial_subscriptions: number
  total_revenue: number
}

export interface CompanyListItem {
  id: number
  name: string
  slug: string
  type: string
  created_at: string
  users_count: number
  clients_count: number
  appointments_count: number
  subscription_status: string | null
  subscription_plan: string | null
}

export interface SubscriptionDetail {
  id: number
  plan: string
  status: string
  price: number
  trial_ends_at: string | null
  current_period_start: string | null
  current_period_end: string | null
  created_at: string
}

export interface CompanyDetail {
  id: number
  name: string
  slug: string
  type: string
  description: string | null
  phone: string | null
  address: string | null
  telegram: string | null
  template_type: string
  created_at: string
  users_count: number
  clients_count: number
  appointments_count: number
  subscription: SubscriptionDetail | null
}

export interface EmployeeListItem {
  id: number
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  is_owner: boolean
  is_manager: boolean
  is_specialist: boolean
  is_active: boolean
  created_at: string
}

export interface ClientListItem {
  id: number
  telegram_id: number
  telegram_username: string | null
  first_name: string
  last_name: string | null
  phone: string | null
  appointments_count: number
  created_at: string
}

export interface CompanyAnalytics {
  total_appointments: number
  pending_appointments: number
  confirmed_appointments: number
  completed_appointments: number
  cancelled_appointments: number
  appointments_this_week: number
  appointments_this_month: number
  new_clients_this_month: number
  total_revenue: number
  revenue_this_month: number
  appointments_by_day: { date: string; count: number }[]
}

export interface CompanyDetailExtended extends CompanyDetail {
  employees: EmployeeListItem[]
  clients: ClientListItem[]
  analytics: CompanyAnalytics | null
}

export interface PaymentListItem {
  id: number
  company_id: number
  company_name: string
  amount: number
  status: string
  payment_method: string
  external_id: string | null
  notes: string | null
  created_at: string
  completed_at: string | null
}

export interface UpdateSubscriptionRequest {
  plan?: string
  status?: string
  price?: number
  trial_ends_at?: string
  current_period_start?: string
  current_period_end?: string
}

export interface CreatePaymentRequest {
  company_id: number
  amount: number
  payment_method?: string
  notes?: string
  auto_complete?: boolean
}

// Superadmin API
export const superadminApi = {
  // Get platform stats
  getStats: async (): Promise<PlatformStats> => {
    const response = await api.get('/superadmin/stats')
    return response.data
  },

  // List companies
  getCompanies: async (params?: {
    search?: string
    subscription_status?: string
    limit?: number
    offset?: number
  }): Promise<CompanyListItem[]> => {
    const response = await api.get('/superadmin/companies', { params })
    return response.data
  },

  // Get company detail with employees, clients and analytics
  getCompany: async (companyId: number): Promise<CompanyDetailExtended> => {
    const response = await api.get(`/superadmin/companies/${companyId}`)
    return response.data
  },

  // Update subscription
  updateSubscription: async (
    companyId: number,
    data: UpdateSubscriptionRequest
  ): Promise<SubscriptionDetail> => {
    const response = await api.post(`/superadmin/companies/${companyId}/subscription`, data)
    return response.data
  },

  // List payments
  getPayments: async (params?: {
    company_id?: number
    status_filter?: string
    limit?: number
    offset?: number
  }): Promise<PaymentListItem[]> => {
    const response = await api.get('/superadmin/payments', { params })
    return response.data
  },

  // Create payment
  createPayment: async (data: CreatePaymentRequest): Promise<PaymentListItem> => {
    const response = await api.post('/superadmin/payments', data)
    return response.data
  },

  // Complete payment
  completePayment: async (paymentId: number): Promise<void> => {
    await api.patch(`/superadmin/payments/${paymentId}/complete`)
  },
}
