import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function serverFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    redirect('/login')
  }

  const response = await fetch(`${API_URL}/api/v1${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  })

  if (response.status === 401) {
    redirect('/login')
  }

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`)
  }

  return response.json()
}

// Server-side API methods
export const serverClientsApi = {
  getById: (id: number) => serverFetch<{
    id: number
    telegram_id: number
    telegram_username: string | null
    first_name: string
    last_name: string | null
    phone: string | null
    language: string
    created_at: string
  }>(`/clients/${id}`),

  getAppointments: (id: number) => serverFetch<Array<{
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
    service?: {
      id: number
      name: string
      duration_minutes: number
      price: number
    }
  }>>(`/clients/${id}/appointments`),
}
