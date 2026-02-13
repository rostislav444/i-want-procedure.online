'use client'

import { useEffect, useState, useMemo } from 'react'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addMonths, subMonths, isSameDay, isSameMonth, addDays } from 'date-fns'
import { uk } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CalendarView, CalendarEvent, ViewMode } from '@/components/calendar'

import { appointmentsApi, specialistsApi, SpecialistListItem, Appointment } from '@/lib/api'
import { useCompany } from '@/contexts/CompanyContext'
import CreateAppointmentModal from '@/components/appointments/CreateAppointmentModal'
import AppointmentDetailModal from '@/components/appointments/AppointmentDetailModal'

// Specialist color palette
const SPECIALIST_COLORS = [
  { bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-300' },
  { bg: 'bg-purple-100 dark:bg-purple-900/30', border: 'bg-purple-500', text: 'text-purple-700 dark:text-purple-300' },
  { bg: 'bg-pink-100 dark:bg-pink-900/30', border: 'bg-pink-500', text: 'text-pink-700 dark:text-pink-300' },
  { bg: 'bg-cyan-100 dark:bg-cyan-900/30', border: 'bg-cyan-500', text: 'text-cyan-700 dark:text-cyan-300' },
  { bg: 'bg-orange-100 dark:bg-orange-900/30', border: 'bg-orange-500', text: 'text-orange-700 dark:text-orange-300' },
  { bg: 'bg-teal-100 dark:bg-teal-900/30', border: 'bg-teal-500', text: 'text-teal-700 dark:text-teal-300' },
  { bg: 'bg-indigo-100 dark:bg-indigo-900/30', border: 'bg-indigo-500', text: 'text-indigo-700 dark:text-indigo-300' },
  { bg: 'bg-rose-100 dark:bg-rose-900/30', border: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-300' },
]

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

export default function AppointmentsPage() {
  const { companyType, canViewAllAppointments, selectedCompanyId, specialistProfile } = useCompany()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [specialists, setSpecialists] = useState<SpecialistListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('day')
  const [selectedSpecialist, setSelectedSpecialist] = useState<number | null>(
    specialistProfile?.id ?? null
  )
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [preselectedDate, setPreselectedDate] = useState<Date | null>(null)
  const [preselectedTime, setPreselectedTime] = useState<string | null>(null)

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 })
  const monthStart = startOfMonth(selectedDate)
  const monthEnd = endOfMonth(selectedDate)

  // Set default specialist filter to current user's profile
  useEffect(() => {
    if (specialistProfile?.id && selectedSpecialist === null) {
      setSelectedSpecialist(specialistProfile.id)
    }
  }, [specialistProfile])

  // Load specialists for clinic managers
  useEffect(() => {
    if (companyType === 'clinic' && canViewAllAppointments && selectedCompanyId) {
      loadSpecialists()
    }
  }, [companyType, canViewAllAppointments, selectedCompanyId])

  useEffect(() => {
    loadAppointments()
  }, [selectedDate, viewMode, selectedSpecialist])

  const loadSpecialists = async () => {
    if (!selectedCompanyId) return
    try {
      const data = await specialistsApi.getAll(selectedCompanyId)
      setSpecialists(data)
    } catch (error) {
      console.error('Failed to load specialists:', error)
    }
  }

  // Map specialist profile ID to color
  const specialistColorMap = useMemo(() => {
    const map = new Map<number, typeof SPECIALIST_COLORS[0]>()
    specialists.forEach((sp, index) => {
      map.set(sp.id, SPECIALIST_COLORS[index % SPECIALIST_COLORS.length])
    })
    return map
  }, [specialists])

  const loadAppointments = async () => {
    setLoading(true)
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

      const data = await appointmentsApi.getAll({
        date_from: dateFrom,
        date_to: dateTo,
        specialist_id: selectedSpecialist || undefined,
      })
      setAppointments(data)
    } catch (error) {
      console.error('Error loading appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await appointmentsApi.updateStatus(id, status)
      await loadAppointments()
      // Update selected appointment status if it's the one being changed
      if (selectedAppointment?.id === id) {
        setSelectedAppointment(prev => prev ? { ...prev, status: status as Appointment['status'] } : null)
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const handleEmptySlotClick = (date: Date, time: string) => {
    setPreselectedDate(date)
    setPreselectedTime(time)
    setShowCreateModal(true)
  }

  const handleAppointmentCreated = () => {
    loadAppointments()
    setShowCreateModal(false)
  }

  const handleAppointmentClick = (appt: Appointment) => {
    setSelectedAppointment(appt)
    setShowDetailModal(true)
  }

  // Get specialist info by profile ID
  const getSpecialistInfo = (profileId?: number) => {
    if (!profileId) return null
    return specialists.find(sp => sp.id === profileId)
  }

  // Convert appointments to CalendarEvents
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    const showingAllSpecialists = companyType === 'clinic' && canViewAllAppointments && !selectedSpecialist

    return appointments
      .filter(a => a.status !== 'cancelled')
      .map(appt => {
        const specialistColor = appt.specialist_profile_id
          ? specialistColorMap.get(appt.specialist_profile_id)
          : null
        const specialist = getSpecialistInfo(appt.specialist_profile_id)

        // Use specialist colors when showing all, status colors when filtered
        const useSpecialistColors = showingAllSpecialists && specialistColor

        return {
          id: appt.id,
          date: appt.date,
          start_time: appt.start_time,
          end_time: appt.end_time,
          title: appt.service?.name || 'Запис',
          subtitle: showingAllSpecialists && specialist
            ? `${specialist.first_name} ${specialist.last_name}`
            : `${appt.client?.first_name || ''} ${appt.client?.last_name || ''}`.trim(),
          color: useSpecialistColors ? specialistColor.bg : STATUS_COLORS[appt.status],
          borderColor: useSpecialistColors ? specialistColor.border : STATUS_BG[appt.status],
          onClick: () => handleAppointmentClick(appt),
        }
      })
  }, [appointments, specialists, selectedSpecialist, companyType, canViewAllAppointments, specialistColorMap])

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

  const showingAllSpecialists = companyType === 'clinic' && canViewAllAppointments && !selectedSpecialist

  return (
    <div className="flex h-[calc(100vh-120px)] gap-6">
      {/* Main view */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h1 className="text-2xl font-bold">Записи</h1>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => {
              setPreselectedDate(selectedDate)
              setPreselectedTime(null)
              setShowCreateModal(true)
            }}
          >
            <Plus className="h-4 w-4" />
            Новий запис
          </Button>
        </div>

        {/* Specialist filter chips */}
        {companyType === 'clinic' && canViewAllAppointments && specialists.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setSelectedSpecialist(null)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors text-sm ${
                !selectedSpecialist
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'hover:bg-muted/50'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Всі</span>
            </button>
            {specialists.map((sp) => {
              const color = specialistColorMap.get(sp.id)
              const isActive = selectedSpecialist === sp.id
              return (
                <button
                  key={sp.id}
                  onClick={() => setSelectedSpecialist(isActive ? null : sp.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors text-sm ${
                    isActive
                      ? `${color?.bg || 'bg-primary/10'} ${color?.text || ''} border-current font-medium`
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${color?.border}`} />
                  <span>{sp.first_name} {sp.last_name}</span>
                  {sp.position && (
                    <span className={`text-xs ${isActive ? 'opacity-70' : 'text-muted-foreground'}`}>({sp.position})</span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {loading ? (
          <Card className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </Card>
        ) : (
          <CalendarView
            events={calendarEvents}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onDateClick={handleDateClick}
            onEmptySlotClick={handleEmptySlotClick}
            className="flex-1"
          />
        )}
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

        {/* Day's appointments list */}
        <Card className="flex-1">
          <CardContent className="p-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Записи на день</h3>
              {getAppointmentsForDate(selectedDate).length === 0 ? (
                <p className="text-xs text-muted-foreground">Немає записів</p>
              ) : (
                <div className="space-y-1.5">
                  {getAppointmentsForDate(selectedDate).map((appt) => {
                    const specialist = getSpecialistInfo(appt.specialist_profile_id)
                    const specialistColor = appt.specialist_profile_id
                      ? specialistColorMap.get(appt.specialist_profile_id)
                      : null
                    const useSpecialistColors = showingAllSpecialists && specialistColor

                    return (
                      <div
                        key={appt.id}
                        className="flex cursor-pointer"
                        onClick={() => handleAppointmentClick(appt)}
                      >
                        <div className={`w-1 rounded-l ${useSpecialistColors ? specialistColor.border : STATUS_BG[appt.status]}`} />
                        <div className={`flex-1 p-2 rounded-r ${useSpecialistColors ? specialistColor.bg : STATUS_COLORS[appt.status]}`}>
                          <div className="text-xs font-medium">{appt.start_time.slice(0, 5)} - {appt.end_time.slice(0, 5)}</div>
                          <div className="text-xs truncate">{appt.service?.name}</div>
                          {showingAllSpecialists && specialist ? (
                            <div className="text-xs font-medium truncate">
                              {specialist.first_name} {specialist.last_name}
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground truncate">
                              {appt.client?.first_name} {appt.client?.last_name || ''}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Appointment Modal */}
      <CreateAppointmentModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onAppointmentCreated={handleAppointmentCreated}
        preselectedDate={preselectedDate}
        preselectedTime={preselectedTime}
      />

      {/* Appointment Detail Modal */}
      <AppointmentDetailModal
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
        appointment={selectedAppointment}
        specialists={specialists}
        specialistColorMap={specialistColorMap}
        onStatusChange={handleStatusChange}
      />
    </div>
  )
}
