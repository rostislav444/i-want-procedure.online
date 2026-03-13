'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, BookOpen, Calendar, Users, GraduationCap, FileText, Award, Presentation, Eye, EyeOff, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { educationApi, Offering, EducatorEvent } from '@/lib/api'

const TYPE_LABELS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  course: { label: 'Курс', icon: BookOpen, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  seminar: { label: 'Семінар', icon: Presentation, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  masterclass: { label: 'Майстер-клас', icon: GraduationCap, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  guide: { label: 'Гайд', icon: FileText, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  certification: { label: 'Сертифікація', icon: Award, color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
}

function formatPrice(kopecks: number): string {
  return `${(kopecks / 100).toLocaleString('uk-UA')} ₴`
}

export default function EducationDashboardPage() {
  const [offerings, setOfferings] = useState<Offering[]>([])
  const [events, setEvents] = useState<EducatorEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [offs, evts] = await Promise.all([
        educationApi.getOfferings(),
        educationApi.getEvents(),
      ])
      setOfferings(offs)
      setEvents(evts)
    } catch (err) {
      console.error('Failed to load education data:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteOffering(id: number) {
    if (!confirm('Видалити цей продукт?')) return
    try {
      await educationApi.deleteOffering(id)
      setOfferings(prev => prev.filter(o => o.id !== id))
    } catch (err) {
      console.error('Failed to delete offering:', err)
    }
  }

  async function handleDeleteEvent(id: number) {
    if (!confirm('Видалити цю подію?')) return
    try {
      await educationApi.deleteEvent(id)
      setEvents(prev => prev.filter(e => e.id !== id))
    } catch (err) {
      console.error('Failed to delete event:', err)
    }
  }

  const upcomingEvents = events.filter(e => !e.is_cancelled && new Date(e.start_at) > new Date())
  const pastEvents = events.filter(e => e.is_cancelled || new Date(e.start_at) <= new Date())

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Навчання</h1>
          <p className="text-muted-foreground">Управління курсами, семінарами та подіями</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{offerings.length}</p>
                <p className="text-sm text-muted-foreground">Продуктів</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcomingEvents.length}</p>
                <p className="text-sm text-muted-foreground">Найближчих подій</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {upcomingEvents.reduce((sum, e) => sum + e.registrations_count, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Реєстрацій</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Offerings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Продукти</h2>
          <Link href="/education/admin/offerings/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Додати продукт
            </Button>
          </Link>
        </div>

        {offerings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">У вас поки немає продуктів</p>
              <Link href="/education/admin/offerings/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Створити перший продукт
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {offerings.map(offering => {
              const typeInfo = TYPE_LABELS[offering.type] || TYPE_LABELS.course
              const TypeIcon = typeInfo.icon
              return (
                <Card key={offering.id} className="group relative">
                  {offering.cover_image_url && (
                    <div className="h-32 overflow-hidden rounded-t-lg">
                      <img
                        src={offering.cover_image_url}
                        alt={offering.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className={offering.cover_image_url ? 'pt-4' : 'pt-6'}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className={typeInfo.color}>
                            <TypeIcon className="h-3 w-3 mr-1" />
                            {typeInfo.label}
                          </Badge>
                          {!offering.is_active && (
                            <Badge variant="outline" className="text-muted-foreground">
                              <EyeOff className="h-3 w-3 mr-1" />
                              Приховано
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold truncate">{offering.title}</h3>
                        {offering.short_description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {offering.short_description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-3 text-sm">
                          {offering.price > 0 && (
                            <span className="font-medium text-green-600 dark:text-green-400">
                              {formatPrice(offering.price)}
                            </span>
                          )}
                          {offering.price === 0 && (
                            <span className="font-medium text-green-600 dark:text-green-400">
                              Безкоштовно
                            </span>
                          )}
                          {offering.duration_hours && (
                            <span className="text-muted-foreground">
                              {offering.duration_hours} год
                            </span>
                          )}
                          {offering.upcoming_events_count > 0 && (
                            <span className="text-muted-foreground">
                              {offering.upcoming_events_count} подій
                            </span>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/education/admin/offerings/${offering.id}/edit`}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Редагувати
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteOffering(offering.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Видалити
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Upcoming Events */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Найближчі події</h2>
          <Link href="/education/admin/events/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Створити подію
            </Button>
          </Link>
        </div>

        {upcomingEvents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">Немає запланованих подій</p>
              <Link href="/education/admin/events/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Створити подію
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map(event => (
              <Card key={event.id} className="group">
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    {/* Date badge */}
                    <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-primary/10 flex flex-col items-center justify-center">
                      <span className="text-xs font-medium text-primary uppercase">
                        {new Date(event.start_at).toLocaleDateString('uk-UA', { month: 'short' })}
                      </span>
                      <span className="text-lg font-bold text-primary">
                        {new Date(event.start_at).getDate()}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium truncate">{event.title}</h3>
                        {!event.is_published && (
                          <Badge variant="outline" className="text-muted-foreground">
                            Чернетка
                          </Badge>
                        )}
                        {event.is_cancelled && (
                          <Badge variant="destructive">Скасовано</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span>
                          {new Date(event.start_at).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {event.city_info && <span>{event.city_info.name}</span>}
                        {event.is_online && <Badge variant="secondary" className="text-xs">Онлайн</Badge>}
                        <span>{event.registrations_count} реєстрацій</span>
                        {event.spots_left !== null && event.spots_left !== undefined && (
                          <span className={event.spots_left <= 3 ? 'text-red-500' : ''}>
                            {event.spots_left} місць
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
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
                            onClick={() => handleDeleteEvent(event.id)}
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
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
