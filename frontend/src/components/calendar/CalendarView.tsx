'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isSameDay,
  isSameMonth,
} from 'date-fns'
import { uk } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar, CalendarDays, CalendarRange, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export type ViewMode = 'day' | 'week' | 'month'

export interface CalendarEvent {
  id: string | number
  date: string // YYYY-MM-DD
  start_time: string // HH:MM
  end_time: string // HH:MM
  title: string
  subtitle?: string
  color: string // bg color class
  borderColor: string // border/indicator color class
  textColor?: string
  opacity?: number // 0-100
  onClick?: () => void
}

interface CalendarViewProps {
  events: CalendarEvent[]
  selectedDate: Date
  onDateChange: (date: Date) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  availableViews?: ViewMode[]
  onDateClick?: (date: Date) => void
  onEmptySlotClick?: (date: Date, startTime: string, endTime: string) => void
  slotDuration?: number // default ghost block duration in minutes (default 15)
  startHour?: number
  endHour?: number
  renderDayHeader?: (date: Date) => React.ReactNode
  renderMonthCell?: (date: Date, events: CalendarEvent[]) => React.ReactNode
  className?: string
  headerExtra?: React.ReactNode
}

const HOURS_DEFAULT = Array.from({ length: 12 }, (_, i) => i + 8)

export default function CalendarView({
  events,
  selectedDate,
  onDateChange,
  viewMode,
  onViewModeChange,
  availableViews = ['day', 'week', 'month'],
  onDateClick,
  onEmptySlotClick,
  slotDuration = 15,
  startHour = 8,
  endHour = 20,
  renderDayHeader,
  renderMonthCell,
  className = '',
  headerExtra,
}: CalendarViewProps) {
  const hours = useMemo(() =>
    Array.from({ length: endHour - startHour }, (_, i) => i + startHour),
    [startHour, endHour]
  )

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 })
  const monthStart = startOfMonth(selectedDate)
  const monthEnd = endOfMonth(selectedDate)

  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  )

  const monthDays = useMemo(() => {
    const start = startOfWeek(monthStart, { weekStartsOn: 1 })
    const end = endOfWeek(monthEnd, { weekStartsOn: 1 })
    const days: Date[] = []
    let day = start
    while (day <= end) {
      days.push(day)
      day = addDays(day, 1)
    }
    return days
  }, [monthStart, monthEnd])

  const navigate = (direction: 'prev' | 'next') => {
    const delta = direction === 'prev' ? -1 : 1
    if (viewMode === 'day') {
      onDateChange(addDays(selectedDate, delta))
    } else if (viewMode === 'week') {
      onDateChange(direction === 'prev' ? subWeeks(selectedDate, 1) : addWeeks(selectedDate, 1))
    } else {
      onDateChange(direction === 'prev' ? subMonths(selectedDate, 1) : addMonths(selectedDate, 1))
    }
  }

  const goToToday = () => {
    onDateChange(new Date())
  }

  const getDateLabel = () => {
    if (viewMode === 'day') {
      return format(selectedDate, 'EEEE, d MMMM yyyy', { locale: uk })
    } else if (viewMode === 'week') {
      return `${format(weekStart, 'd MMM', { locale: uk })} - ${format(weekEnd, 'd MMM yyyy', { locale: uk })}`
    } else {
      return format(selectedDate, 'LLLL yyyy', { locale: uk })
    }
  }

  const getEventsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return events.filter(e => e.date === dateStr)
  }

  const getEventStyle = (event: CalendarEvent) => {
    const [startH, startM] = event.start_time.split(':').map(Number)
    const [endH, endM] = event.end_time.split(':').map(Number)
    const startMinutes = (startH - startHour) * 60 + startM
    const endMinutes = (endH - startHour) * 60 + endM
    const duration = endMinutes - startMinutes
    const top = (startMinutes / 60) * 64
    const height = Math.max((duration / 60) * 64, 24)
    return { top: `${top}px`, height: `${height}px` }
  }

  const isToday = (date: Date) => isSameDay(date, new Date())
  const isTodaySelected = isSameDay(selectedDate, new Date())

  const renderTimeColumn = () => (
    <div className="w-14 flex-shrink-0 border-r bg-muted/30">
      {viewMode === 'week' && <div className="h-12 border-b" />}
      {hours.map((hour) => (
        <div key={hour} className="h-16 flex items-start justify-end pr-2 text-xs text-muted-foreground">
          {hour}:00
        </div>
      ))}
    </div>
  )

  const renderCurrentTimeLine = () => {
    const now = new Date()
    const currentHour = now.getHours()
    if (currentHour < startHour || currentHour >= endHour) return null
    const top = ((currentHour - startHour) * 60 + now.getMinutes()) / 60 * 64
    return (
      <div
        className="absolute left-0 right-0 border-t-2 border-red-500 z-20 pointer-events-none"
        style={{ top: `${top}px` }}
      >
        <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-red-500" />
      </div>
    )
  }

  const renderEvent = (event: CalendarEvent, compact = false) => {
    const style = getEventStyle(event)
    const heightNum = parseInt(style.height)
    const opacity = event.opacity !== undefined ? event.opacity / 100 : 1

    return (
      <div
        key={event.id}
        className={`absolute left-1 right-1 overflow-hidden transition-all rounded-lg shadow-md hover:shadow-lg ${event.color} ${event.textColor || ''} ${event.onClick ? 'pointer-events-auto cursor-pointer hover:ring-2 hover:ring-primary/50' : ''}`}
        style={{ ...style, opacity }}
        onClick={event.onClick}
      >
        <div className={`absolute left-1 top-1.5 bottom-1.5 ${compact ? 'w-0.5' : 'w-1'} rounded-full ${event.borderColor}`} />
        <div className="pl-4 pr-2 py-1">
          <div className="text-xs font-medium truncate">
            {event.start_time.slice(0, 5)} {event.title}
          </div>
          {!compact && heightNum >= 48 && event.subtitle && (
            <div className="text-xs opacity-75 truncate">{event.subtitle}</div>
          )}
        </div>
      </div>
    )
  }

  // Check if a time range overlaps with any event on a given date
  const isSlotOccupied = (dateStr: string, fromMin: number, toMin: number) => {
    const dayEvents = events.filter(e => e.date === dateStr)
    return dayEvents.some(e => {
      const [sh, sm] = e.start_time.split(':').map(Number)
      const [eh, em] = e.end_time.split(':').map(Number)
      const eStart = sh * 60 + sm
      const eEnd = eh * 60 + em
      return fromMin < eEnd && toMin > eStart
    })
  }

  // Drag-select state for time range selection
  const [dragDate, setDragDate] = useState<string | null>(null)
  const [dragStartMin, setDragStartMin] = useState<number | null>(null)
  const [dragCurrentMin, setDragCurrentMin] = useState<number | null>(null)
  const isDragging = useRef(false)

  const fmtTime = (totalMin: number) => {
    const h = Math.floor(totalMin / 60)
    const m = totalMin % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
  }

  const getDragRange = () => {
    if (dragStartMin === null || dragCurrentMin === null) return null
    const minVal = Math.min(dragStartMin, dragCurrentMin)
    const maxVal = Math.max(dragStartMin, dragCurrentMin) + 15
    // Use slotDuration as minimum
    const duration = maxVal - minVal
    const endMin = duration < slotDuration ? minVal + slotDuration : maxVal
    return { startMin: minVal, endMin }
  }

  // Global mouseup to finish drag
  useEffect(() => {
    const handleMouseUp = () => {
      if (!isDragging.current || dragDate === null || dragStartMin === null || dragCurrentMin === null) {
        isDragging.current = false
        setDragDate(null)
        setDragStartMin(null)
        setDragCurrentMin(null)
        return
      }
      isDragging.current = false
      const range = getDragRange()
      if (range && onEmptySlotClick) {
        const dateObj = new Date(dragDate + 'T00:00:00')
        onEmptySlotClick(dateObj, fmtTime(range.startMin), fmtTime(range.endMin))
      }
      setDragDate(null)
      setDragStartMin(null)
      setDragCurrentMin(null)
    }
    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [dragDate, dragStartMin, dragCurrentMin, onEmptySlotClick])

  const renderHourSlot = (date: Date, hour: number) => {
    const quarters = [0, 15, 30, 45]
    const dateStr = format(date, 'yyyy-MM-dd')
    if (!onEmptySlotClick) {
      return <div key={hour} className="h-16 border-b border-dashed border-border/50" />
    }
    return (
      <div key={hour} className="h-16 border-b border-dashed border-border/50 relative flex flex-col">
        {quarters.map((min) => {
          const slotMin = hour * 60 + min
          const occupied = isSlotOccupied(dateStr, slotMin, slotMin + 15)
          const isInDrag = !occupied && dragDate === dateStr && getDragRange() !== null &&
            slotMin >= getDragRange()!.startMin && slotMin < getDragRange()!.endMin
          return (
            <div
              key={min}
              className={`flex-1 relative select-none ${occupied ? '' : 'cursor-pointer'} ${isInDrag ? '' : occupied ? '' : 'group/q'}`}
              style={min === 30 ? { borderTop: '1px dotted var(--border)' } : undefined}
              onMouseDown={(e) => {
                if (occupied) return
                e.preventDefault()
                isDragging.current = true
                setDragDate(dateStr)
                setDragStartMin(slotMin)
                setDragCurrentMin(slotMin)
              }}
              onMouseEnter={() => {
                if (isDragging.current && dragDate === dateStr && !occupied) {
                  setDragCurrentMin(slotMin)
                }
              }}
            >
              {/* Hover preview with slotDuration (only when not dragging, only on free slots) */}
              {!isDragging.current && !occupied && !isSlotOccupied(dateStr, slotMin, slotMin + slotDuration) && (
                <div className="absolute inset-x-1 top-0 opacity-0 group-hover/q:opacity-100 transition-opacity pointer-events-none z-30 rounded-lg bg-primary/15 shadow-md border-2 border-primary/30 border-dashed flex items-center overflow-hidden" style={{ height: `${(slotDuration / 60) * 64}px` }}>
                  <div className="absolute left-1 top-1.5 bottom-1.5 w-1 rounded-full bg-primary/40" />
                  <div className="pl-4 flex items-center gap-1.5 text-primary">
                    <Plus className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="text-xs font-semibold whitespace-nowrap">{fmtTime(slotMin)}–{fmtTime(slotMin + slotDuration)}</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const renderGhostBlock = (dateStr: string) => {
    if (dragDate !== dateStr) return null
    const range = getDragRange()
    if (!range) return null
    const topMin = range.startMin - startHour * 60
    const height = range.endMin - range.startMin
    const topPx = (topMin / 60) * 64
    const heightPx = (height / 60) * 64
    return (
      <div
        className="absolute left-1 right-1 z-30 pointer-events-none rounded-lg bg-primary/15 shadow-md border-2 border-primary/30 border-dashed flex items-center overflow-hidden"
        style={{ top: `${topPx}px`, height: `${heightPx}px` }}
      >
        <div className="absolute left-1 top-1.5 bottom-1.5 w-1 rounded-full bg-primary/40" />
        <div className="pl-4 flex items-center gap-1.5 text-primary">
          <Plus className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="text-xs font-semibold whitespace-nowrap">{fmtTime(range.startMin)}–{fmtTime(range.endMin)}</span>
        </div>
      </div>
    )
  }

  const renderDayView = () => {
    const dayEvents = getEventsForDate(selectedDate)

    return (
      <div className="flex h-full overflow-auto">
        {renderTimeColumn()}
        <div className="flex-1 relative">
          {hours.map((hour) => renderHourSlot(selectedDate, hour))}
          {renderGhostBlock(format(selectedDate, 'yyyy-MM-dd'))}
          <div className="absolute inset-0 px-2 pointer-events-none">
            {dayEvents.map((event) => renderEvent(event))}
          </div>
          {dayEvents.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-muted-foreground">Немає подій</p>
            </div>
          )}
          {isToday(selectedDate) && renderCurrentTimeLine()}
        </div>
      </div>
    )
  }

  const renderWeekView = () => (
    <div className="flex h-full overflow-auto">
      {renderTimeColumn()}
      <div className="flex-1 grid grid-cols-7 min-w-[700px]">
        {weekDays.map((day) => {
          const dayEvents = getEventsForDate(day)
          const isDayToday = isToday(day)

          return (
            <div key={day.toISOString()} className="border-r last:border-r-0 flex flex-col">
              <div
                className={`h-12 border-b flex flex-col items-center justify-center text-sm cursor-pointer hover:bg-muted/50 ${isDayToday ? 'bg-primary/10' : ''}`}
                onClick={() => onDateClick?.(day)}
              >
                {renderDayHeader ? (
                  renderDayHeader(day)
                ) : (
                  <>
                    <span className="text-muted-foreground text-xs">{format(day, 'EEE', { locale: uk })}</span>
                    <span className={`font-medium ${isDayToday ? 'bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center' : ''}`}>
                      {format(day, 'd')}
                    </span>
                  </>
                )}
              </div>
              <div className="flex-1 relative">
                {hours.map((hour) => renderHourSlot(day, hour))}
                {renderGhostBlock(format(day, 'yyyy-MM-dd'))}
                {isDayToday && renderCurrentTimeLine()}
                <div className="absolute inset-0 px-0.5 pointer-events-none">
                  {dayEvents.map((event) => renderEvent(event, true))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  const renderMonthView = () => (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-7 border-b">
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map((d) => (
          <div key={d} className="p-2 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0">
            {d}
          </div>
        ))}
      </div>
      <div className="flex-1 grid grid-cols-7 auto-rows-fr">
        {monthDays.map((day) => {
          const dayEvents = getEventsForDate(day)
          const isDayToday = isToday(day)
          const isCurrentMonth = isSameMonth(day, selectedDate)

          if (renderMonthCell) {
            return (
              <div
                key={day.toISOString()}
                className={`border-r border-b last:border-r-0 cursor-pointer hover:bg-muted/50 ${!isCurrentMonth ? 'bg-muted/30' : ''}`}
                onClick={() => onDateClick?.(day)}
              >
                {renderMonthCell(day, dayEvents)}
              </div>
            )
          }

          return (
            <div
              key={day.toISOString()}
              className={`border-r border-b last:border-r-0 p-1 min-h-[100px] cursor-pointer hover:bg-muted/50 ${!isCurrentMonth ? 'bg-muted/30' : ''}`}
              onClick={() => onDateClick?.(day)}
            >
              <div className={`text-sm mb-1 ${isDayToday ? 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center' : ''} ${!isCurrentMonth ? 'text-muted-foreground' : ''}`}>
                {format(day, 'd')}
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="flex text-xs"
                    style={{ opacity: event.opacity !== undefined ? event.opacity / 100 : 1 }}
                    onClick={(e) => { e.stopPropagation(); event.onClick?.() }}
                  >
                    <div className={`w-0.5 rounded-l ${event.borderColor}`} />
                    <div className={`flex-1 px-1 py-0.5 rounded-r truncate ${event.color} ${event.textColor || ''}`}>
                      {event.start_time.slice(0, 5)} {event.title}
                    </div>
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground px-1">
                    +{dayEvents.length - 3} ще
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Сьогодні
          </Button>
          {headerExtra}
        </div>

        {availableViews.length > 1 && (
          <div className="flex border rounded-lg overflow-hidden">
            {availableViews.includes('day') && (
              <Button
                variant={viewMode === 'day' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none"
                onClick={() => onViewModeChange('day')}
              >
                <Calendar className="h-4 w-4 mr-1" />
                День
              </Button>
            )}
            {availableViews.includes('week') && (
              <Button
                variant={viewMode === 'week' ? 'default' : 'ghost'}
                size="sm"
                className={`rounded-none ${availableViews.includes('day') && availableViews.includes('month') ? 'border-x' : ''}`}
                onClick={() => onViewModeChange('week')}
              >
                <CalendarDays className="h-4 w-4 mr-1" />
                Тиждень
              </Button>
            )}
            {availableViews.includes('month') && (
              <Button
                variant={viewMode === 'month' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none"
                onClick={() => onViewModeChange('month')}
              >
                <CalendarRange className="h-4 w-4 mr-1" />
                Місяць
              </Button>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('prev')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className={`px-4 py-2 rounded-lg font-medium min-w-[200px] text-center ${isTodaySelected && viewMode === 'day' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            {getDateLabel()}
          </span>
          <Button variant="ghost" size="icon" onClick={() => navigate('next')}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0 h-full">
          {viewMode === 'day' && renderDayView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'month' && renderMonthView()}
        </CardContent>
      </Card>
    </div>
  )
}
