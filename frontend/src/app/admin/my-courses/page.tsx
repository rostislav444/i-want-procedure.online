'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Calendar, MapPin, Clock, Video, GraduationCap,
  CheckCircle2, Clock3, XCircle, Users, ExternalLink,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { educationApi, type MyRegistration } from '@/lib/api'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  confirmed: { label: 'Підтверджено', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle2 },
  pending: { label: 'Очікує', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock3 },
  waitlist: { label: 'Черга', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Users },
  cancelled: { label: 'Скасовано', color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400', icon: XCircle },
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  course: 'Курс',
  seminar: 'Семінар',
  masterclass: 'Майстер-клас',
  guide: 'Гайд',
  certification: 'Сертифікація',
}

function formatPrice(kopecks: number): string {
  if (kopecks === 0) return 'Безкоштовно'
  return `${(kopecks / 100).toLocaleString('uk-UA')} ₴`
}

function RegistrationCard({ registration }: { registration: MyRegistration }) {
  const { event, status } = registration
  const startDate = new Date(event.start_at)
  const isPast = startDate < new Date()
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  const StatusIcon = statusCfg.icon
  const typeLabel = event.event_type ? EVENT_TYPE_LABELS[event.event_type] : null

  return (
    <Card className={`overflow-hidden transition-opacity ${isPast && status !== 'cancelled' ? 'opacity-70' : ''} ${status === 'cancelled' ? 'opacity-50' : ''}`}>
      <CardContent className="p-0">
        <div className="flex">
          {/* Cover image */}
          {event.cover_image_url ? (
            <div className="flex-shrink-0 w-24 sm:w-32 relative">
              <Image
                src={event.cover_image_url}
                alt={event.title}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex-shrink-0 w-24 sm:w-32 bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-white/70" />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 p-4 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  {typeLabel && (
                    <span className="text-[11px] px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full">
                      {typeLabel}
                    </span>
                  )}
                  <Badge className={`${statusCfg.color} border-0 text-[11px]`}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusCfg.label}
                  </Badge>
                  {isPast && status !== 'cancelled' && (
                    <span className="text-[11px] text-muted-foreground">(минуле)</span>
                  )}
                </div>

                <h3 className="font-semibold text-sm sm:text-base leading-tight line-clamp-2">
                  {event.title}
                </h3>

                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs sm:text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                    {startDate.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                    {startDate.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {event.is_online ? (
                    <span className="flex items-center gap-1">
                      <Video className="w-3.5 h-3.5 flex-shrink-0" />
                      Онлайн
                    </span>
                  ) : event.city_info && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      {event.city_info.name}
                      {event.venue_name && `, ${event.venue_name}`}
                    </span>
                  )}
                </div>

                {/* Educator */}
                {event.educator_name && (
                  <div className="flex items-center gap-2 mt-2">
                    {event.educator_logo_url ? (
                      <Image src={event.educator_logo_url} alt={event.educator_name} width={20} height={20} className="rounded-full object-cover" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-[10px] font-bold text-indigo-500">
                        {event.educator_name.charAt(0)}
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground">{event.educator_name}</span>
                  </div>
                )}
              </div>

              {/* Right side: price + link */}
              <div className="flex-shrink-0 text-right space-y-2">
                <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                  {formatPrice(event.price)}
                </p>
                <Link
                  href={`/education/${event.educator_slug}/events/${event.id}`}
                  target="_blank"
                  className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-600 transition-colors"
                >
                  Деталі
                  <ExternalLink className="w-3 h-3" />
                </Link>
                {event.is_online && event.online_link && status === 'confirmed' && (
                  <a
                    href={event.online_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium transition-colors"
                  >
                    Приєднатись
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function MyCoursesPage() {
  const [registrations, setRegistrations] = useState<MyRegistration[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    educationApi.getMyRegistrations()
      .then(setRegistrations)
      .catch(() => setRegistrations([]))
      .finally(() => setLoading(false))
  }, [])

  const upcoming = registrations.filter(r =>
    r.status !== 'cancelled' && new Date(r.event.start_at) >= new Date()
  )
  const past = registrations.filter(r =>
    r.status === 'cancelled' || new Date(r.event.start_at) < new Date()
  )

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Мої курси</h1>
        <p className="text-muted-foreground mt-1">Ваші реєстрації на навчальні заходи</p>
      </div>

      {registrations.length === 0 ? (
        <div className="text-center py-16">
          <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold text-lg">Ви ще не зареєстровані на жоден захід</h3>
          <p className="text-muted-foreground mt-1 mb-5">Перегляньте афішу та оберіть цікавий курс або семінар</p>
          <Link
            href="/education?tab=events"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            <Calendar className="w-4 h-4" />
            Переглянути афішу
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Найближчі ({upcoming.length})
              </h2>
              <div className="space-y-3">
                {upcoming.map(r => <RegistrationCard key={r.id} registration={r} />)}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Минулі та скасовані ({past.length})
              </h2>
              <div className="space-y-3">
                {past.map(r => <RegistrationCard key={r.id} registration={r} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
