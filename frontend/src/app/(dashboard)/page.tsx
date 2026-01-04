'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, isToday, isTomorrow, parseISO, startOfDay, endOfDay, addDays } from 'date-fns'
import { uk } from 'date-fns/locale'
import {
  Calendar,
  Clock,
  Users,
  Scissors,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  CalendarDays,
  UserPlus,
  Settings,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { appointmentsApi, clientsApi, servicesApi } from '@/lib/api'

interface Appointment {
  id: number
  date: string
  start_time: string
  end_time: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  client: {
    id: number
    first_name: string
    last_name?: string
    phone?: string
  } | null
  service: {
    id: number
    name: string
    duration_minutes: number
    price: number
  } | null
}

interface Client {
  id: number
  first_name: string
  last_name: string | null
  telegram_username: string | null
  created_at: string
}

interface Service {
  id: number
  name: string
  duration_minutes: number
  price: number
  is_active: boolean
}

const STATUS_COLORS = {
  pending: 'bg-yellow-500',
  confirmed: 'bg-green-500',
  cancelled: 'bg-red-500',
  completed: 'bg-gray-500',
}

const STATUS_LABELS = {
  pending: 'Очікує',
  confirmed: 'Підтверджено',
  cancelled: 'Скасовано',
  completed: 'Завершено',
}

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([])
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([])
  const [recentClients, setRecentClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [stats, setStats] = useState({
    todayTotal: 0,
    todayPending: 0,
    todayCompleted: 0,
    todayRevenue: 0,
    totalClients: 0,
    activeServices: 0,
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      const nextWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd')

      const [appointmentsData, clientsData, servicesData] = await Promise.all([
        appointmentsApi.getAll({ date_from: today, date_to: nextWeek }),
        clientsApi.getAll(),
        servicesApi.getAll(),
      ])

      // Today's appointments
      const todayAppts = appointmentsData.filter((a: Appointment) => a.date === today)
      setTodayAppointments(todayAppts.sort((a: Appointment, b: Appointment) =>
        a.start_time.localeCompare(b.start_time)
      ))

      // Upcoming appointments (excluding today, next 7 days)
      const upcoming = appointmentsData
        .filter((a: Appointment) => a.date > today && a.status !== 'cancelled')
        .sort((a: Appointment, b: Appointment) => {
          const dateCompare = a.date.localeCompare(b.date)
          return dateCompare !== 0 ? dateCompare : a.start_time.localeCompare(b.start_time)
        })
        .slice(0, 5)
      setUpcomingAppointments(upcoming)

      // Recent clients (last 5)
      const sortedClients = [...clientsData].sort((a: Client, b: Client) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ).slice(0, 5)
      setRecentClients(sortedClients)

      // Services
      setServices(servicesData)

      // Calculate stats
      const pendingCount = todayAppts.filter((a: Appointment) => a.status === 'pending').length
      const completedCount = todayAppts.filter((a: Appointment) => a.status === 'completed').length
      const revenue = todayAppts
        .filter((a: Appointment) => a.status === 'completed' || a.status === 'confirmed')
        .reduce((sum: number, a: Appointment) => sum + Number(a.service?.price || 0), 0)

      setStats({
        todayTotal: todayAppts.length,
        todayPending: pendingCount,
        todayCompleted: completedCount,
        todayRevenue: revenue,
        totalClients: clientsData.length,
        activeServices: servicesData.filter((s: Service) => s.is_active).length,
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (time: string) => time.slice(0, 5)

  const formatDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr)
    if (isToday(date)) return 'Сьогодні'
    if (isTomorrow(date)) return 'Завтра'
    return format(date, 'd MMMM', { locale: uk })
  }

  const getCurrentTimePosition = () => {
    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes()
    // Work hours: 8:00 - 20:00 (12 hours)
    const startHour = 8
    const endHour = 20
    if (hours < startHour || hours >= endHour) return null
    return ((hours - startHour) * 60 + minutes) / ((endHour - startHour) * 60) * 100
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const currentTimePosition = getCurrentTimePosition()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Головна</h1>
          <p className="text-muted-foreground">
            {format(new Date(), "EEEE, d MMMM yyyy", { locale: uk })}
          </p>
        </div>
        <Button onClick={() => router.push('/appointments')}>
          <Calendar className="mr-2 h-4 w-4" />
          Календар записів
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Записів сьогодні</p>
                <p className="text-3xl font-bold">{stats.todayTotal}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <CalendarDays className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Очікують підтвердження</p>
                <p className="text-3xl font-bold">{stats.todayPending}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Завершено сьогодні</p>
                <p className="text-3xl font-bold">{stats.todayCompleted}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Дохід сьогодні</p>
                <p className="text-3xl font-bold">{stats.todayRevenue.toLocaleString('uk-UA')} ₴</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Розклад на сьогодні
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => router.push('/appointments')}>
              Переглянути всі
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {todayAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">На сьогодні записів немає</p>
                <p className="text-sm text-muted-foreground">Вільний день для відпочинку!</p>
              </div>
            ) : (
              <div className="relative">
                {/* Timeline */}
                <div className="space-y-3">
                  {todayAppointments.map((appt) => (
                    <div
                      key={appt.id}
                      className="flex gap-4 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => router.push('/appointments')}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-medium">{formatTime(appt.start_time)}</span>
                        <div className="flex-1 w-px bg-border my-1" />
                        <span className="text-xs text-muted-foreground">{formatTime(appt.end_time)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[appt.status]}`} />
                          <span className="font-medium truncate">{appt.service?.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {appt.client?.first_name} {appt.client?.last_name || ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium">{appt.service?.price} ₴</span>
                        <p className="text-xs text-muted-foreground">{appt.service?.duration_minutes} хв</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & Stats */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Швидкі дії</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => router.push('/appointments')}
              >
                <Calendar className="h-5 w-5" />
                <span className="text-xs">Записи</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => router.push('/services')}
              >
                <Scissors className="h-5 w-5" />
                <span className="text-xs">Послуги</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => router.push('/clients')}
              >
                <Users className="h-5 w-5" />
                <span className="text-xs">Клієнти</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => router.push('/schedule')}
              >
                <Settings className="h-5 w-5" />
                <span className="text-xs">Розклад</span>
              </Button>
            </CardContent>
          </Card>

          {/* Mini Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Загальна статистика</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm">Всього клієнтів</span>
                </div>
                <span className="font-semibold">{stats.totalClients}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-pink-100 flex items-center justify-center">
                    <Scissors className="h-4 w-4 text-pink-600" />
                  </div>
                  <span className="text-sm">Активних послуг</span>
                </div>
                <span className="font-semibold">{stats.activeServices}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Найближчі записи
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Немає майбутніх записів</p>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => router.push('/appointments')}
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-medium text-primary">
                        {format(parseISO(appt.date), 'd', { locale: uk })}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{appt.service?.name}</span>
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[appt.status]}`} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDateLabel(appt.date)} о {formatTime(appt.start_time)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm truncate">{appt.client?.first_name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Clients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Нові клієнти
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => router.push('/clients')}>
              Всі клієнти
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentClients.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Клієнтів поки немає</p>
            ) : (
              <div className="space-y-3">
                {recentClients.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => router.push('/clients')}
                  >
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-medium">
                      {client.first_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {client.first_name} {client.last_name || ''}
                      </p>
                      {client.telegram_username && (
                        <p className="text-sm text-muted-foreground truncate">
                          @{client.telegram_username}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(client.created_at), 'd MMM', { locale: uk })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
