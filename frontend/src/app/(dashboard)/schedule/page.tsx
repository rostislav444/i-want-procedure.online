'use client'

import { useEffect, useState, useMemo } from 'react'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, subDays } from 'date-fns'
import { uk } from 'date-fns/locale'
import { Trash2, Calendar, Clock, Coffee, Briefcase, PauseCircle, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { CalendarView, CalendarEvent, ViewMode } from '@/components/calendar'
import { scheduleApi, appointmentsApi, ScheduleException, ScheduleExceptionType } from '@/lib/api'

const DAYS = [
  { id: 0, name: 'Пн', full: 'Понеділок' },
  { id: 1, name: 'Вт', full: 'Вівторок' },
  { id: 2, name: 'Ср', full: 'Середа' },
  { id: 3, name: 'Чт', full: 'Четвер' },
  { id: 4, name: 'Пт', full: "П'ятниця" },
  { id: 5, name: 'Сб', full: 'Субота' },
  { id: 6, name: 'Нд', full: 'Неділя' },
]

interface ScheduleDay {
  day_of_week: number
  start_time: string
  end_time: string
  is_working_day: boolean
}

interface Appointment {
  id: number
  date: string
  start_time: string
  end_time: string
  status: string
  service?: { name: string } | null
  client?: { first_name: string; last_name?: string } | null
}

const EXCEPTION_TYPES: { value: ScheduleExceptionType; label: string; shortLabel: string; icon: React.ReactNode; bgClass: string; borderClass: string; textClass: string }[] = [
  { value: 'day_off', label: 'Вихідний', shortLabel: 'Вих', icon: <Coffee className="h-4 w-4" />, bgClass: 'bg-red-100 dark:bg-red-950', borderClass: 'bg-red-500', textClass: 'text-red-900 dark:text-red-200' },
  { value: 'modified', label: 'Змінений графік', shortLabel: 'Зм', icon: <Clock className="h-4 w-4" />, bgClass: 'bg-amber-100 dark:bg-amber-950', borderClass: 'bg-amber-500', textClass: 'text-amber-900 dark:text-amber-200' },
  { value: 'working', label: 'Робочий день', shortLabel: 'Роб', icon: <Briefcase className="h-4 w-4" />, bgClass: 'bg-emerald-100 dark:bg-emerald-950', borderClass: 'bg-emerald-500', textClass: 'text-emerald-900 dark:text-emerald-200' },
  { value: 'break', label: 'Перерва', shortLabel: 'Пер', icon: <PauseCircle className="h-4 w-4" />, bgClass: 'bg-orange-100 dark:bg-orange-950', borderClass: 'bg-orange-500', textClass: 'text-orange-900 dark:text-orange-200' },
]

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<ScheduleDay[]>(
    DAYS.map((day) => ({
      day_of_week: day.id,
      start_time: '09:00',
      end_time: '18:00',
      is_working_day: day.id < 5,
    }))
  )
  const [exceptions, setExceptions] = useState<ScheduleException[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [selectedException, setSelectedException] = useState<ScheduleException | null>(null)
  const [showExceptionDialog, setShowExceptionDialog] = useState(false)
  const [dialogDate, setDialogDate] = useState<Date | null>(null)

  const [exceptionType, setExceptionType] = useState<ScheduleExceptionType>('break')
  const [exceptionStartTime, setExceptionStartTime] = useState('12:00')
  const [exceptionEndTime, setExceptionEndTime] = useState('13:00')
  const [exceptionReason, setExceptionReason] = useState('')
  const [savingException, setSavingException] = useState(false)

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 })
  const monthStart = startOfMonth(selectedDate)
  const monthEnd = endOfMonth(selectedDate)

  useEffect(() => {
    loadSchedule()
  }, [])

  useEffect(() => {
    loadExceptionsAndAppointments()
  }, [selectedDate, viewMode])

  // Update exception type when dialog date changes (if current type becomes invalid)
  useEffect(() => {
    if (!dialogDate || selectedException) return // Don't change type when editing existing exception

    const dayOfWeek = (dialogDate.getDay() + 6) % 7
    const schedule = schedules.find(s => s.day_of_week === dayOfWeek)
    const isWorkingDay = schedule?.is_working_day ?? false

    // Check if current type is valid for the new date
    if (isWorkingDay && exceptionType === 'working') {
      setExceptionType('break')
    } else if (!isWorkingDay && exceptionType !== 'working') {
      setExceptionType('working')
    }
  }, [dialogDate])

  const loadSchedule = async () => {
    try {
      const data = await scheduleApi.getAll()
      if (data.length > 0) {
        setSchedules(
          DAYS.map((day) => {
            const existing = data.find((s: any) => s.day_of_week === day.id)
            return existing
              ? {
                  day_of_week: day.id,
                  start_time: existing.start_time,
                  end_time: existing.end_time,
                  is_working_day: existing.is_working_day,
                }
              : {
                  day_of_week: day.id,
                  start_time: '09:00',
                  end_time: '18:00',
                  is_working_day: false,
                }
          })
        )
      }
    } catch (error) {
      console.error('Error loading schedule:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadExceptionsAndAppointments = async () => {
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

      const [exceptionsData, appointmentsData] = await Promise.all([
        scheduleApi.getExceptions({ date_from: dateFrom, date_to: dateTo }),
        appointmentsApi.getAll({ date_from: dateFrom, date_to: dateTo }),
      ])

      setExceptions(exceptionsData)
      setAppointments(appointmentsData)
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const handleSaveSchedule = async () => {
    setSaving(true)
    try {
      await scheduleApi.createBulk(schedules)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving schedule:', error)
    } finally {
      setSaving(false)
    }
  }

  const updateSchedule = (dayId: number, field: keyof ScheduleDay, value: any) => {
    setSchedules((prev) =>
      prev.map((s) =>
        s.day_of_week === dayId ? { ...s, [field]: value } : s
      )
    )
  }

  const formatTime = (time: string) => time.slice(0, 5)

  // Convert exceptions and appointments to CalendarEvents
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    const events: CalendarEvent[] = []

    // Add appointments as shadows
    appointments
      .filter(a => a.status !== 'cancelled')
      .forEach(appt => {
        events.push({
          id: `appt-${appt.id}`,
          date: appt.date,
          start_time: appt.start_time,
          end_time: appt.end_time,
          title: appt.service?.name || 'Запис',
          subtitle: appt.client ? `${appt.client.first_name} ${appt.client.last_name || ''}`.trim() : undefined,
          color: 'bg-blue-50 dark:bg-blue-950',
          borderColor: 'bg-blue-400 dark:bg-blue-500',
          textColor: 'text-blue-700 dark:text-blue-300',
          opacity: 50, // Shadow opacity
        })
      })

    // Add exceptions
    exceptions.forEach(exc => {
      const typeConfig = EXCEPTION_TYPES.find(t => t.value === exc.type) || EXCEPTION_TYPES[0]

      // For day_off, we need to show it spanning full day
      // For others, we show the time range
      if (exc.type === 'day_off') {
        // Find schedule for this day to get working hours
        const dayOfWeek = (new Date(exc.date).getDay() + 6) % 7
        const schedule = schedules.find(s => s.day_of_week === dayOfWeek)
        events.push({
          id: `exc-${exc.id}`,
          date: exc.date,
          start_time: schedule?.start_time || '09:00',
          end_time: schedule?.end_time || '18:00',
          title: typeConfig.label,
          subtitle: exc.reason || undefined,
          color: typeConfig.bgClass,
          borderColor: typeConfig.borderClass,
          textColor: typeConfig.textClass,
          onClick: () => openExceptionDialog(new Date(exc.date), exc),
        })
      } else if (exc.start_time && exc.end_time) {
        events.push({
          id: `exc-${exc.id}`,
          date: exc.date,
          start_time: exc.start_time,
          end_time: exc.end_time,
          title: typeConfig.label,
          subtitle: exc.reason || undefined,
          color: typeConfig.bgClass,
          borderColor: typeConfig.borderClass,
          textColor: typeConfig.textClass,
          onClick: () => openExceptionDialog(new Date(exc.date), exc),
        })
      }
    })

    return events
  }, [exceptions, appointments, schedules])

  const openExceptionDialog = (date: Date, exception?: ScheduleException) => {
    setDialogDate(date)
    setSelectedException(exception || null)

    if (exception) {
      setExceptionType(exception.type)
      setExceptionStartTime(exception.start_time ? formatTime(exception.start_time) : '09:00')
      setExceptionEndTime(exception.end_time ? formatTime(exception.end_time) : '18:00')
      setExceptionReason(exception.reason || '')
    } else {
      const dayOfWeek = (date.getDay() + 6) % 7
      const schedule = schedules.find(s => s.day_of_week === dayOfWeek)
      const isWorkingDay = schedule?.is_working_day ?? false

      // Set default type based on whether it's a working day
      if (isWorkingDay) {
        setExceptionType('break') // Default to break on working day
        setExceptionStartTime('12:00')
        setExceptionEndTime('13:00')
      } else {
        setExceptionType('working') // Default to working day on non-working day
        setExceptionStartTime(schedule?.start_time ? formatTime(schedule.start_time) : '09:00')
        setExceptionEndTime(schedule?.end_time ? formatTime(schedule.end_time) : '18:00')
      }
      setExceptionReason('')
    }

    setShowExceptionDialog(true)
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    if (viewMode === 'month') {
      setViewMode('week')
    } else {
      // In week/day view, clicking on date opens exception dialog
      openExceptionDialog(date)
    }
  }

  const handleEmptySlotClick = (date: Date, time: string) => {
    const [hour] = time.split(':').map(Number)
    const endHour = hour + 1
    setExceptionStartTime(`${hour.toString().padStart(2, '0')}:00`)
    setExceptionEndTime(`${endHour.toString().padStart(2, '0')}:00`)
    openExceptionDialog(date)
  }

  const handleSaveException = async () => {
    if (!dialogDate) return

    setSavingException(true)
    try {
      const dateStr = format(dialogDate, 'yyyy-MM-dd')

      const data: any = {
        date: dateStr,
        type: exceptionType,
        reason: exceptionReason || undefined,
      }

      if (exceptionType !== 'day_off') {
        data.start_time = exceptionStartTime
        data.end_time = exceptionEndTime
      }

      if (selectedException) {
        await scheduleApi.updateException(selectedException.id, data)
      } else {
        await scheduleApi.createException(data)
      }

      await loadExceptionsAndAppointments()
      setShowExceptionDialog(false)
    } catch (error) {
      console.error('Error saving exception:', error)
    } finally {
      setSavingException(false)
    }
  }

  const handleDeleteException = async () => {
    if (!selectedException) return

    try {
      await scheduleApi.deleteException(selectedException.id)
      await loadExceptionsAndAppointments()
      setShowExceptionDialog(false)
    } catch (error) {
      console.error('Error deleting exception:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-120px)] gap-6">
      {/* Left: Weekly Schedule & Legend */}
      <div className="w-64 flex-shrink-0 space-y-4">
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Стандартний розклад</span>
            <Button onClick={handleSaveSchedule} disabled={saving} size="sm" variant={saved ? "outline" : "default"} className="h-7 px-2 text-xs">
              {saving ? '...' : saved ? 'Збережено' : 'Зберегти'}
            </Button>
          </div>
          <div className="space-y-0.5">
            {DAYS.map((day) => {
              const schedule = schedules.find((s) => s.day_of_week === day.id)!
              return (
                <div
                  key={day.id}
                  className={`flex items-center gap-2 py-1.5 px-2 rounded transition-colors ${
                    schedule.is_working_day ? 'hover:bg-muted/50' : 'opacity-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={schedule.is_working_day}
                    onChange={(e) => updateSchedule(day.id, 'is_working_day', e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-muted-foreground/30"
                  />
                  <span className={`w-6 text-xs ${schedule.is_working_day ? 'font-medium' : 'text-muted-foreground'}`}>
                    {day.name}
                  </span>
                  <input
                    type="time"
                    value={schedule.start_time}
                    onChange={(e) => updateSchedule(day.id, 'start_time', e.target.value)}
                    disabled={!schedule.is_working_day}
                    className="h-6 w-[72px] text-xs px-1.5 border rounded bg-background disabled:opacity-40"
                  />
                  <span className="text-muted-foreground/50 text-xs">—</span>
                  <input
                    type="time"
                    value={schedule.end_time}
                    onChange={(e) => updateSchedule(day.id, 'end_time', e.target.value)}
                    disabled={!schedule.is_working_day}
                    className="h-6 w-[72px] text-xs px-1.5 border rounded bg-background disabled:opacity-40"
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="bg-card rounded-xl border p-4">
          <span className="text-sm font-medium">Легенда</span>
          <div className="mt-3 space-y-2">
            {EXCEPTION_TYPES.map((type) => (
              <div key={type.value} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded ${type.borderClass}`} />
                <span className="text-xs text-muted-foreground">{type.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 pt-2 border-t">
              <div className="w-3 h-3 rounded bg-blue-400 dark:bg-blue-500 opacity-50" />
              <span className="text-xs text-muted-foreground">Записи клієнтів</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Calendar */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-2 mb-4">
          <h1 className="text-2xl font-bold">Розклад</h1>
          <Button
            onClick={() => openExceptionDialog(selectedDate)}
            size="sm"
            className="ml-auto"
          >
            <Plus className="h-4 w-4 mr-1" />
            Додати виключення
          </Button>
        </div>

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
      </div>

      {/* Exception Dialog */}
      <Dialog open={showExceptionDialog} onOpenChange={setShowExceptionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {selectedException ? 'Редагувати виключення' : 'Додати виключення'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Date picker */}
            <div className="space-y-2">
              <Label>Дата</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => dialogDate && setDialogDate(subDays(dialogDate, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Input
                  type="date"
                  value={dialogDate ? format(dialogDate, 'yyyy-MM-dd') : ''}
                  onChange={(e) => e.target.value && setDialogDate(new Date(e.target.value))}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => dialogDate && setDialogDate(addDays(dialogDate, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Тип</Label>
              <div className="grid grid-cols-2 gap-2">
                {(() => {
                  // Determine if selected day is working day by schedule
                  const dayOfWeek = dialogDate ? (dialogDate.getDay() + 6) % 7 : 0
                  const schedule = schedules.find(s => s.day_of_week === dayOfWeek)
                  const isWorkingDay = schedule?.is_working_day ?? false

                  // Filter types based on whether it's a working day
                  // Working day: can add day_off, modified hours, or break
                  // Non-working day: can add working day
                  const availableTypes = EXCEPTION_TYPES.filter(type => {
                    if (isWorkingDay) {
                      // On working day: hide "working" option (it's already working)
                      return type.value !== 'working'
                    } else {
                      // On non-working day: only show "working" option
                      return type.value === 'working'
                    }
                  })

                  return availableTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setExceptionType(type.value)}
                      className={`
                        p-3 rounded-xl flex items-center gap-2 transition-all text-left border
                        ${exceptionType === type.value
                          ? `${type.bgClass} ${type.textClass} border-current shadow-sm`
                          : 'bg-muted text-muted-foreground hover:bg-muted/80 border-transparent'
                        }
                      `}
                    >
                      {type.icon}
                      <span className="text-sm font-medium">{type.label}</span>
                    </button>
                  ))
                })()}
              </div>
            </div>

            {exceptionType !== 'day_off' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Початок</Label>
                  <Input
                    type="time"
                    value={exceptionStartTime}
                    onChange={(e) => setExceptionStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Кінець</Label>
                  <Input
                    type="time"
                    value={exceptionEndTime}
                    onChange={(e) => setExceptionEndTime(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Коментар</Label>
              <Input
                value={exceptionReason}
                onChange={(e) => setExceptionReason(e.target.value)}
                placeholder="Магазин, лікар, обід..."
              />
            </div>

            {/* Show warning if there are appointments */}
            {dialogDate && appointments.filter(a => a.date === format(dialogDate, 'yyyy-MM-dd') && a.status !== 'cancelled').length > 0 && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
                На цей день є записи клієнтів. Додавання виключення не скасує їх автоматично.
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            {selectedException && (
              <Button variant="destructive" onClick={handleDeleteException} className="mr-auto">
                <Trash2 className="mr-2 h-4 w-4" />
                Видалити
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowExceptionDialog(false)}>
              Скасувати
            </Button>
            <Button onClick={handleSaveException} disabled={savingException}>
              {savingException ? '...' : 'Зберегти'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
