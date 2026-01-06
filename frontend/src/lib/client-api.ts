import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const clientApi = axios.create({
  baseURL: `${API_URL}/api/v1/client`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Types
export interface TelegramAuthData {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

export interface ClientData {
  id: number
  telegram_id: number
  first_name: string
  last_name: string | null
  phone: string | null
  telegram_username: string | null
}

export interface Specialist {
  id: number
  name: string
  slug: string
  specialization: string | null
  logo_url: string | null
  phone: string | null
  telegram: string | null
  appointments_count: number
}

export interface ClientAppointment {
  id: number
  date: string
  start_time: string
  end_time: string
  status: string
  created_at: string
  service_name: string
  service_price: number
  specialist_name: string
  specialist_slug: string
}

// Client Portal API
export const clientPortalApi = {
  // Telegram auth
  telegramAuth: async (authData: TelegramAuthData): Promise<ClientData> => {
    const response = await clientApi.post('/auth/telegram', authData)
    return response.data
  },

  // Get client data by telegram ID
  getMe: async (telegramId: number): Promise<ClientData> => {
    const response = await clientApi.get('/me', { params: { telegram_id: telegramId } })
    return response.data
  },

  // Get client's specialists
  getSpecialists: async (telegramId: number): Promise<Specialist[]> => {
    const response = await clientApi.get('/specialists', { params: { telegram_id: telegramId } })
    return response.data
  },

  // Get client's appointments
  getAppointments: async (
    telegramId: number,
    filters?: { status?: string; company_slug?: string }
  ): Promise<ClientAppointment[]> => {
    const response = await clientApi.get('/appointments', {
      params: { telegram_id: telegramId, ...filters },
    })
    return response.data
  },

  // Cancel appointment
  cancelAppointment: async (telegramId: number, appointmentId: number): Promise<void> => {
    await clientApi.delete(`/appointments/${appointmentId}`, {
      params: { telegram_id: telegramId },
    })
  },
}
