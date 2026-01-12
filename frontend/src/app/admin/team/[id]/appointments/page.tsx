'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, addMonths, subMonths, isSameDay, isSameMonth, addDays } from 'date-fns'
import { uk } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, User, Phone, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CalendarView, CalendarEvent, ViewMode } from '@/components/calendar'
import { specialistsApi, SpecialistProfile, Appointment } from '@/lib/api'
import { useCompany } from '@/contexts/CompanyContext'

const STATUS_COLORS = {
  pending: 'bg-amber-100 dark:bg-amber-900/30',
  confirmed: 'bg-emerald-100 dark:bg-emerald-900/30',
  cancelled: 'bg-red-100 dark:bg-red-900/30',
  completed: 'bg-muted',
}

const STATUS_BG = {
  pending: 'bg-amber-500',
  confirmed: 'bg-emerald-500',
  cancelled: 'bg-red-500',
  completed: 'bg-muted-foreground',
}

const STATUS_LABELS = {
  pending: 'Очікує',
  confirmed: 'Підтверджено',
  cancelled: 'Скасовано',
  completed: 'Завершено',
}

export default function SpecialistAppointmentsPage() {
  const params = useParams()
  const router = useRouter()
  const specialistId = Number(params.id)
  const { companyType } = useCompany()

  const [specialist, setSpecialist] = useState<SpecialistProfile | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('week')

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 })
  const monthStart = startOfMonth(selectedDate)
  const monthEnd = endOfMonth(selectedDate)

  useEffect(() => {
    if (companyType && companyType !== 'clinic') {
      router.push('/admin')
      return
    }
    loadSpecialist()
  }, [specialistId, companyType])

  useEffect(() => {
    if (specialist) {
      loadAppointments()
    }
  }, [specialist, selectedDate, viewMode])

  const loadSpecialist = async () => {
    try {
      const data = await specialistsApi.getById(specialistId)
      setSpecialist(data)
    } catch (error) {
      console.error('Failed to load specialist:', error)
      router.push('/admin/team')
    } finally {
      setLoading(false)
    }
  }

  const loadAppointments = async () => {
    try {
      let dateFrom: string, dateTo: string

      if (viewMode === 'day') {
        dateFrom = format(selectedDate, 'yyyy-MM-dd')
        dateTo = dateFrom
      } else if (viewMode === 'week') {
        dateFrom = format(weekStart, 'yyyy-MM-dd')
        dateTo = format(weekEnd, 'yyyy-MM-dd')
      } else {
        dateFrom = format(monthStart, 'yyyy-MM-dd')
        dateTo = format(monthEnd, 'yyyy-MM-dd')
      }

      const data = await specialistsApi.getAppointments(specialistId, {
        date_from: dateFrom,
        date_to: dateTo,
      })
      setAppointments(data)
    } catch (error) {
      console.error('Error loading appointments:', error)
    }
  }

  // Convert appointments to CalendarEvents
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return appointments
      .filter(a => a.status !== 'cancelled')
      .map(appt => ({
        id: appt.id,
        date: appt.date,
        start_time: appt.start_time,
        end_time: appt.end_time,
        title: appt.service?.name || 'Запис',
        subtitle: `${appt.client?.first_name || ''} ${appt.client?.last_name || ''}`.trim(),
        color: STATUS_COLORS[appt.status],
        borderColor: STATUS_BG[appt.status],
        onClick: () => setSelectedAppointment(appt),
      }))
  }, [appointments])

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    if (viewMode === 'month') {
      setViewMode('day')
    }
  }

  // Mini calendar helpers
  const calendarMonthStart = startOfMonth(calendarMonth)
  const calendarMonthEnd = endOfMonth(calendarMonthStart)
  const calendarStart = startOfWeek(calendarMonthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(calendarMonthEnd, { weekStartsOn: 1 })

  const calendarDays: Date[] = []
  let day = calendarStart
  while (day <= calendarEnd) {
    calendarDays.push(day)
    day = addDays(day, 1)
  }

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return appointments.filter(a => a.date === dateStr && a.status !== 'cancelled')
  }

  if (loading || !specialist) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-120px)] gap-6">
      {/* Main view */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-4 mb-4">
          <Link href={`/admin/team/${specialistId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              Записи — {specialist.first_name} {specialist.last_name}
            </h1>
            {specialist.position && (
              <p className="text-sm text-muted-foreground">{specialist.position}</p>
            )}
          </div>
        </div>

        <CalendarView
          events={calendarEvents}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onDateClick={handleDateClick}
          className="flex-1"
        />
      </div>

      {/* Right sidebar */}
      <div className="w-72 flex-shrink-0 space-y-4">
        {/* Mini calendar */}
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-3">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium text-sm">
                {format(calendarMonth, 'LLLL yyyy', { locale: uk })}
              </span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map((d) => (
                <div key={d} className="text-center text-xs text-muted-foreground py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {calendarDays.map((day) => {
                const isSelected = isSameDay(day, selectedDate)
                const isCurrentMonth = isSameMonth(day, calendarMonth)
                const isTodayDate = isSameDay(day, new Date())
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      h-7 w-7 rounded-full text-xs flex items-center justify-center transition-colors
                      ${isSelected ? 'bg-primary text-primary-foreground' : ''}
                      ${!isSelected && isTodayDate ? 'bg-primary/20 text-primary font-bold' : ''}
                      ${!isSelected && !isTodayDate && isCurrentMonth ? 'hover:bg-muted' : ''}
                      ${!isCurrentMonth ? 'text-muted-foreground/50' : ''}
                    `}
                  >
                    {format(day, 'd')}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Appointment details */}
        <Card className="flex-1">
          <CardContent className="p-4">
            {selectedAppointment ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Деталі запису</h3>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setSelectedAppointment(null)}>
                    ×
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${STATUS_BG[selectedAppointment.status]}`} />
                    <span className="text-sm">{STATUS_LABELS[selectedAppointment.status]}</span>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Дата та час</div>
                    <div className="font-medium text-sm">
                      {format(parseISO(selectedAppointment.date), 'd MMMM yyyy', { locale: uk })}
                    </div>
                    <div className="text-sm">
                      {selectedAppointment.start_time.slice(0, 5)} - {selectedAppointment.end_time.slice(0, 5)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Послуга</div>
                    <div className="font-medium text-sm">{selectedAppointment.service?.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {selectedAppointment.service?.duration_minutes} хв • {selectedAppointment.service?.price} грн
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Клієнт</div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">
                        {selectedAppointment.client?.first_name} {selectedAppointment.client?.last_name || ''}
                      </span>
                    </div>
                    {selectedAppointment.client?.phone && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {selectedAppointment.client.phone}
                      </div>
                    )}
                    {selectedAppointment.client?.telegram_username && (
                      <div className="text-xs text-muted-foreground">
                        @{selectedAppointment.client.telegram_username}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Записи на день</h3>
                {getAppointmentsForDate(selectedDate).length === 0 ? (
                  <p className="text-xs text-muted-foreground">Немає записів</p>
                ) : (
                  <div className="space-y-1.5">
                    {getAppointmentsForDate(selectedDate).map((appt) => (
                      <div
                        key={appt.id}
                        className="flex cursor-pointer"
                        onClick={() => setSelectedAppointment(appt)}
                      >
                        <div className={`w-1 rounded-l ${STATUS_BG[appt.status]}`} />
                        <div className={`flex-1 p-2 rounded-r ${STATUS_COLORS[appt.status]}`}>
                          <div className="text-xs font-medium">{appt.start_time.slice(0, 5)} - {appt.end_time.slice(0, 5)}</div>
                          <div className="text-xs truncate">{appt.service?.name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {appt.client?.first_name} {appt.client?.last_name || ''}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
