'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Calendar, MapPin, Wifi, Users, MoreHorizontal, Pencil, Eye, Trash2, Search, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { educationApi, type EducatorEvent } from '@/lib/api'

function formatPrice(kopecks: number): string {
  return `${(kopecks / 100).toLocaleString('uk-UA')} ₴`
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return {
    day: d.getDate(),
    month: d.toLocaleDateString('uk-UA', { month: 'short' }),
    time: d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }),
    full: d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' }),
  }
}

export default function EventsPage() {
  const [events, setEvents] = useState<EducatorEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')

  useEffect(() => {
    educationApi.getEvents()
      .then(setEvents)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(id: number) {
    if (!confirm('Видалити цю подію?')) return
    try {
      await educationApi.deleteEvent(id)
      setEvents(prev => prev.filter(e => e.id !== id))
    } catch (err) {
      console.error(err)
      alert('Помилка при видаленні')
    }
  }

  const now = new Date()
  const upcoming = events.filter(e => !e.is_cancelled && new Date(e.start_at) > now)
  const past = events.filter(e => e.is_cancelled || new Date(e.start_at) <= now)

  const source = tab === 'upcoming' ? upcoming : past
  const filtered = source.filter(e =>
    !search || e.title.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Події</h1>
          <p className="text-muted-foreground">Семінари, майстер-класи, конференції</p>
        </div>
        <Link href="/education/admin/events/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Нова подія
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Пошук за назвою..."
          className="w-full pl-9 pr-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setTab('upcoming')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === 'upcoming'
              ? 'border-violet-500 text-violet-600 dark:text-violet-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Майбутні ({upcoming.length})
        </button>
        <button
          onClick={() => setTab('past')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === 'past'
              ? 'border-violet-500 text-violet-600 dark:text-violet-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Минулі ({past.length})
        </button>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground mb-4">
              {search ? 'Нічого не знайдено' : tab === 'upcoming' ? 'Немає запланованих подій' : 'Немає минулих подій'}
            </p>
            {!search && tab === 'upcoming' && (
              <Link href="/education/admin/events/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Створити подію
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(event => {
            const date = formatDate(event.start_at)
            return (
              <Card key={event.id} className="group">
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    {/* Date badge */}
                    <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex flex-col items-center justify-center border border-violet-100 dark:border-violet-500/20">
                      <span className="text-xs font-medium text-violet-500 uppercase leading-none">{date.month}</span>
                      <span className="text-xl font-bold text-violet-700 dark:text-violet-300 leading-tight">{date.day}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold truncate">{event.title}</h3>
                        {!event.is_published && (
                          <Badge variant="outline" className="text-muted-foreground text-xs">Чернетка</Badge>
                        )}
                        {event.is_cancelled && (
                          <Badge variant="destructive" className="text-xs">Скасовано</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {date.time}
                        </span>
                        {event.is_online ? (
                          <span className="flex items-center gap-1">
                            <Wifi className="h-3.5 w-3.5" />
                            Онлайн
                          </span>
                        ) : event.city_info ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {event.city_info.name}
                          </span>
                        ) : null}
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {event.registrations_count} реєстрацій
                        </span>
                        {event.spots_left !== null && event.spots_left !== undefined && (
                          <span className={event.spots_left <= 3 ? 'text-red-500 font-medium' : ''}>
                            {event.spots_left} місць
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {event.price > 0 && (
                        <span className="font-medium text-green-600 dark:text-green-400 text-sm">
                          {formatPrice(event.price)}
                        </span>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/education/admin/events/${event.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              Переглянути
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/education/admin/events/${event.id}/edit`}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Редагувати
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(event.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Видалити
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
