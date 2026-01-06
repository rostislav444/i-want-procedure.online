'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { uk } from 'date-fns/locale'
import {
  ArrowLeft,
  Phone,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageCircle,
  History,
  CalendarCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { clientsApi, Client, Appointment } from '@/lib/api'

const statusConfig = {
  pending: { label: 'Очікує', color: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800', Icon: AlertCircle },
  confirmed: { label: 'Підтверджено', color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800', Icon: CheckCircle },
  completed: { label: 'Завершено', color: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', Icon: CheckCircle },
  cancelled: { label: 'Скасовано', color: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800', Icon: XCircle },
}

const languageLabels: Record<string, string> = {
  uk: 'Українська',
  ru: 'Російська',
  en: 'English',
}

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const clientId = Number(params.id)

  useEffect(() => {
    if (isNaN(clientId)) {
      router.push('/admin/clients')
      return
    }

    const loadData = async () => {
      try {
        const [clientData, appointmentsData] = await Promise.all([
          clientsApi.getById(clientId),
          clientsApi.getAppointments(clientId),
        ])
        setClient(clientData)
        setAppointments(appointmentsData)
      } catch (err) {
        console.error('Error loading client:', err)
        setError('Не вдалося завантажити дані клієнта')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [clientId, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="min-h-screen">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin/clients">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <span className="text-muted-foreground">Клієнти</span>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{error || 'Клієнта не знайдено'}</p>
            <Button className="mt-4" onClick={() => router.push('/admin/clients')}>
              Повернутися до списку
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculate stats
  const totalAppointments = appointments.length
  const completedAppointments = appointments.filter(a => a.status === 'completed').length
  const cancelledAppointments = appointments.filter(a => a.status === 'cancelled').length
  const totalSpent = appointments
    .filter(a => a.status === 'completed')
    .reduce((sum, a) => sum + Number(a.service?.price || 0), 0)

  // Group appointments
  const upcomingAppointments = appointments.filter(
    a => a.status === 'pending' || a.status === 'confirmed'
  )
  const pastAppointments = appointments.filter(
    a => a.status === 'completed' || a.status === 'cancelled'
  )

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/clients">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <span className="text-muted-foreground">Клієнти</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Client Card */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardContent className="p-6">
              {/* Avatar & Name */}
              <div className="text-center mb-6">
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4 ring-4 ring-primary/10">
                  <User className="w-12 h-12 text-primary" />
                </div>
                <h1 className="text-xl font-bold">
                  {client.first_name} {client.last_name}
                </h1>
                {client.telegram_username && (
                  <p className="text-muted-foreground text-sm mt-1">@{client.telegram_username}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mb-6">
                {client.phone && (
                  <a
                    href={`tel:${client.phone}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-xl transition-colors font-medium text-sm"
                  >
                    <Phone className="h-4 w-4" />
                    Зателефонувати
                  </a>
                )}
                {client.telegram_username && (
                  <a
                    href={`https://t.me/${client.telegram_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-50 dark:bg-sky-900/30 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-700 dark:text-sky-400 rounded-xl transition-colors font-medium text-sm"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Telegram
                  </a>
                )}
              </div>

              {/* Client Details */}
              <div className="space-y-1">
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-sm text-muted-foreground">Телефон</span>
                  {client.phone ? (
                    <a href={`tel:${client.phone}`} className="font-medium text-sm hover:text-primary transition-colors">
                      {client.phone}
                    </a>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-sm text-muted-foreground">Telegram</span>
                  {client.telegram_username ? (
                    <a
                      href={`https://t.me/${client.telegram_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-sm hover:text-primary transition-colors"
                    >
                      @{client.telegram_username}
                    </a>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-sm text-muted-foreground">Мова</span>
                  <span className="font-medium text-sm">{languageLabels[client.language] || client.language}</span>
                </div>

                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-muted-foreground">Клієнт з</span>
                  <span className="font-medium text-sm">
                    {format(new Date(client.created_at), 'd MMM yyyy', { locale: uk })}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">Статистика</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold">{totalAppointments}</p>
                    <p className="text-xs text-muted-foreground">Записів</p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{completedAppointments}</p>
                    <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Завершено</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{cancelledAppointments}</p>
                    <p className="text-xs text-red-600/70 dark:text-red-400/70">Скасовано</p>
                  </div>
                  <div className="bg-primary/5 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-primary">{totalSpent.toLocaleString('uk-UA')}</p>
                    <p className="text-xs text-primary/70">грн витрачено</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Appointments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Appointments */}
          {upcomingAppointments.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CalendarCheck className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Заплановані візити</h2>
                  <span className="ml-auto text-sm text-muted-foreground">{upcomingAppointments.length}</span>
                </div>
                <div className="space-y-3">
                  {upcomingAppointments.map(appointment => {
                    const status = statusConfig[appointment.status]
                    const StatusIcon = status.Icon
                    return (
                      <div
                        key={appointment.id}
                        className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors border border-border/50"
                      >
                        <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center">
                          <span className="text-lg font-bold text-primary">
                            {format(new Date(appointment.date), 'd')}
                          </span>
                          <span className="text-[10px] uppercase text-primary/70">
                            {format(new Date(appointment.date), 'MMM', { locale: uk })}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{appointment.service?.name || 'Послуга'}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{appointment.start_time.slice(0, 5)} - {appointment.end_time.slice(0, 5)}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="font-semibold">
                            {Number(appointment.service?.price || 0).toLocaleString('uk-UA')} грн
                          </span>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Past Appointments */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <History className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Історія візитів</h2>
                <span className="ml-auto text-sm text-muted-foreground">{pastAppointments.length}</span>
              </div>

              {pastAppointments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <History className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground">Історія візитів порожня</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pastAppointments.map(appointment => {
                    const status = statusConfig[appointment.status]
                    const StatusIcon = status.Icon
                    const isCompleted = appointment.status === 'completed'
                    return (
                      <div
                        key={appointment.id}
                        className={`flex items-center gap-4 p-4 rounded-xl border ${
                          isCompleted ? 'bg-muted/50' : 'bg-muted/30'
                        }`}
                      >
                        <div className={`flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center ${
                          isCompleted ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-muted/50'
                        }`}>
                          <span className={`text-lg font-bold ${isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                            {format(new Date(appointment.date), 'd')}
                          </span>
                          <span className={`text-[10px] uppercase ${isCompleted ? 'text-emerald-600/70 dark:text-emerald-400/70' : 'text-muted-foreground/70'}`}>
                            {format(new Date(appointment.date), 'MMM', { locale: uk })}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium truncate ${!isCompleted && 'text-muted-foreground'}`}>
                            {appointment.service?.name || 'Послуга'}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{appointment.start_time.slice(0, 5)} - {appointment.end_time.slice(0, 5)}</span>
                            <span className="text-muted-foreground/50">
                              {format(new Date(appointment.date), 'yyyy', { locale: uk })}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`font-semibold ${!isCompleted && 'text-muted-foreground line-through'}`}>
                            {Number(appointment.service?.price || 0).toLocaleString('uk-UA')} грн
                          </span>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
