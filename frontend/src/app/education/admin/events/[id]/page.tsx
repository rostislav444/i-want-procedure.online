'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, Calendar, MapPin, Globe, Users, Clock, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { educationApi, EducatorEvent, EventRegistration } from '@/lib/api'

function formatPrice(kopecks: number): string {
  return `${(kopecks / 100).toLocaleString('uk-UA')} ₴`
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Очікує', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: AlertCircle },
  confirmed: { label: 'Підтверджено', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
  cancelled: { label: 'Скасовано', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
  waitlist: { label: 'У черзі', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Clock },
}

export default function EventDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = Number(params.id)
  const [event, setEvent] = useState<EducatorEvent | null>(null)
  const [registrations, setRegistrations] = useState<EventRegistration[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    try {
      const [evt, regs] = await Promise.all([
        educationApi.getEvent(id),
        educationApi.getEventRegistrations(id),
      ])
      setEvent(evt)
      setRegistrations(regs)
    } catch {
      router.push('/education/admin')
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(regId: number, newStatus: string) {
    try {
      const updated = await educationApi.updateRegistrationStatus(id, regId, newStatus)
      setRegistrations(prev => prev.map(r => r.id === regId ? updated : r))
    } catch (err) {
      console.error('Failed to update status:', err)
    }
  }

  if (loading || !event) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const startDate = new Date(event.start_at)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Button variant="ghost" className="mb-4" onClick={() => router.push('/education/admin')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Назад
      </Button>

      {/* Event header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold">{event.title}</h1>
            {!event.is_published && <Badge variant="outline">Чернетка</Badge>}
            {event.is_cancelled && <Badge variant="destructive">Скасовано</Badge>}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {startDate.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}
              {' '}
              {startDate.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
            </span>
            {event.city_info && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {event.city_info.name}
                {event.venue_name && `, ${event.venue_name}`}
              </span>
            )}
            {event.is_online && (
              <span className="flex items-center gap-1">
                <Globe className="h-4 w-4" />
                Онлайн
              </span>
            )}
          </div>
        </div>
        <Link href={`/education/admin/events/${id}/edit`}>
          <Button variant="outline" size="sm">
            <Pencil className="h-4 w-4 mr-2" />
            Редагувати
          </Button>
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{event.registrations_count}</p>
                <p className="text-sm text-muted-foreground">Реєстрацій</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {event.spots_left !== null && event.spots_left !== undefined
                    ? event.spots_left
                    : '∞'}
                </p>
                <p className="text-sm text-muted-foreground">Вільних місць</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {event.price > 0 ? formatPrice(event.price) : 'Безкоштовно'}
            </div>
            {event.early_bird_price && (
              <p className="text-sm text-muted-foreground">
                Early Bird: {formatPrice(event.early_bird_price)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {event.description && (
        <Card className="mb-8">
          <CardHeader><CardTitle>Опис</CardTitle></CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{event.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Registrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Реєстрації ({registrations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {registrations.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Поки немає реєстрацій
            </p>
          ) : (
            <div className="space-y-3">
              {registrations.map(reg => {
                const statusInfo = STATUS_CONFIG[reg.status] || STATUS_CONFIG.pending
                const StatusIcon = statusInfo.icon
                return (
                  <div key={reg.id} className="flex items-center gap-4 p-3 rounded-lg border">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{reg.full_name}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {reg.email && <span>{reg.email}</span>}
                        {reg.phone && <span>{reg.phone}</span>}
                        {reg.telegram && <span>@{reg.telegram}</span>}
                      </div>
                    </div>
                    <Badge className={statusInfo.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusInfo.label}
                    </Badge>
                    <div className="flex gap-1">
                      {reg.status !== 'confirmed' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-green-600 h-8"
                          onClick={() => handleStatusChange(reg.id, 'confirmed')}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {reg.status !== 'cancelled' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 h-8"
                          onClick={() => handleStatusChange(reg.id, 'cancelled')}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
