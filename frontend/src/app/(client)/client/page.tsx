'use client'

import { useEffect, useState } from 'react'
import { User, Calendar, Users, Clock, X, Phone, MessageCircle, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { clientPortalApi, ClientData, Specialist, ClientAppointment, TelegramAuthData } from '@/lib/client-api'
import TelegramLoginButton from '@/components/TelegramLoginButton'

type Tab = 'specialists' | 'appointments'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Очікує', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Підтверджено', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Скасовано', color: 'bg-red-100 text-red-800' },
  completed: { label: 'Завершено', color: 'bg-gray-100 text-gray-800' },
}

export default function ClientPortalPage() {
  const [client, setClient] = useState<ClientData | null>(null)
  const [specialists, setSpecialists] = useState<Specialist[]>([])
  const [appointments, setAppointments] = useState<ClientAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('specialists')
  const [cancellingId, setCancellingId] = useState<number | null>(null)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'

  useEffect(() => {
    // Check if we have telegram_id in localStorage
    const savedTelegramId = localStorage.getItem('client_telegram_id')
    if (savedTelegramId) {
      loadClientData(parseInt(savedTelegramId))
    } else {
      setLoading(false)
    }
  }, [])

  const loadClientData = async (telegramId: number) => {
    try {
      const [clientData, specialistsData, appointmentsData] = await Promise.all([
        clientPortalApi.getMe(telegramId),
        clientPortalApi.getSpecialists(telegramId),
        clientPortalApi.getAppointments(telegramId),
      ])
      setClient(clientData)
      setSpecialists(specialistsData)
      setAppointments(appointmentsData)
    } catch (error) {
      console.error('Error loading client data:', error)
      localStorage.removeItem('client_telegram_id')
    } finally {
      setLoading(false)
    }
  }

  const handleTelegramAuth = async (authData: TelegramAuthData) => {
    try {
      setLoading(true)
      const clientData = await clientPortalApi.telegramAuth(authData)
      localStorage.setItem('client_telegram_id', clientData.telegram_id.toString())
      await loadClientData(clientData.telegram_id)
    } catch (error) {
      console.error('Telegram auth error:', error)
      setLoading(false)
    }
  }

  const handleCancelAppointment = async (appointmentId: number) => {
    if (!client) return
    setCancellingId(appointmentId)
    try {
      await clientPortalApi.cancelAppointment(client.telegram_id, appointmentId)
      // Refresh appointments
      const appointmentsData = await clientPortalApi.getAppointments(client.telegram_id)
      setAppointments(appointmentsData)
    } catch (error) {
      console.error('Error cancelling appointment:', error)
    } finally {
      setCancellingId(null)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('client_telegram_id')
    setClient(null)
    setSpecialists([])
    setAppointments([])
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  // Not authenticated - show login
  if (!client) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Клієнтський портал</CardTitle>
            <CardDescription>
              Увійдіть через Telegram, щоб переглянути ваші записи та спеціалістів
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <TelegramLoginButton
              botName={process.env.NEXT_PUBLIC_CLIENT_BOT_NAME || 'YOUR_BOT'}
              onAuth={handleTelegramAuth}
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Authenticated - show portal
  const upcomingAppointments = appointments.filter(
    (a) => a.status === 'pending' || a.status === 'confirmed'
  )

  return (
    <div className="max-w-3xl mx-auto p-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            Привіт, {client.first_name}!
          </h1>
          <p className="text-muted-foreground">
            {specialists.length} спеціаліст{specialists.length !== 1 ? 'ів' : ''}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          Вийти
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
              <div className="text-xs text-muted-foreground">Активних записів</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{specialists.length}</div>
              <div className="text-xs text-muted-foreground">Спеціалістів</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === 'specialists' ? 'default' : 'outline'}
          onClick={() => setActiveTab('specialists')}
          className="flex-1"
        >
          <Users className="w-4 h-4 mr-2" />
          Спеціалісти
        </Button>
        <Button
          variant={activeTab === 'appointments' ? 'default' : 'outline'}
          onClick={() => setActiveTab('appointments')}
          className="flex-1"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Записи
        </Button>
      </div>

      {/* Content */}
      {activeTab === 'specialists' && (
        <div className="space-y-4">
          {specialists.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  У вас ще немає спеціалістів.
                  <br />
                  Перейдіть за посиланням від спеціаліста, щоб додати його.
                </p>
              </CardContent>
            </Card>
          ) : (
            specialists.map((specialist) => (
              <Card key={specialist.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {specialist.logo_url ? (
                      <img
                        src={`${apiUrl}${specialist.logo_url}`}
                        alt={specialist.name}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                        {specialist.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{specialist.name}</h3>
                      {specialist.specialization && (
                        <p className="text-sm text-muted-foreground">{specialist.specialization}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {specialist.appointments_count} запис
                        {specialist.appointments_count !== 1 ? 'ів' : ''}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {specialist.phone && (
                        <a
                          href={`tel:${specialist.phone}`}
                          className="p-2 rounded-full bg-pink-100 text-pink-600 hover:bg-pink-200"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                      {specialist.telegram && (
                        <a
                          href={`https://t.me/${specialist.telegram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-full bg-sky-100 text-sky-600 hover:bg-sky-200"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      )}
                      <a
                        href={`/${specialist.slug}`}
                        className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'appointments' && (
        <div className="space-y-4">
          {appointments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  У вас ще немає записів.
                </p>
              </CardContent>
            </Card>
          ) : (
            appointments.map((appointment) => {
              const statusInfo = STATUS_LABELS[appointment.status] || STATUS_LABELS.pending
              const canCancel =
                appointment.status === 'pending' || appointment.status === 'confirmed'

              return (
                <Card key={appointment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}
                          >
                            {statusInfo.label}
                          </span>
                        </div>
                        <h3 className="font-semibold">{appointment.service_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {appointment.specialist_name}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(appointment.date).toLocaleDateString('uk-UA', {
                              day: 'numeric',
                              month: 'long',
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {appointment.start_time.slice(0, 5)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-pink-600">
                          {appointment.service_price.toLocaleString('uk-UA')} грн
                        </div>
                        {canCancel && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleCancelAppointment(appointment.id)}
                            disabled={cancellingId === appointment.id}
                          >
                            {cancellingId === appointment.id ? (
                              'Скасування...'
                            ) : (
                              <>
                                <X className="w-4 h-4 mr-1" />
                                Скасувати
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
