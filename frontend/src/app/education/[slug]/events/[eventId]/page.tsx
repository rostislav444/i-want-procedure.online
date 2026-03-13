'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft, MapPin, Calendar, Clock, Users, Video,
  CheckCircle2, AlertCircle, Loader2, GraduationCap,
} from 'lucide-react'
import Header from '@/components/site/Header'
import Footer from '@/components/site/Footer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  publicApi,
  type EducatorEventCard,
  type PublicTicketType,
} from '@/lib/public-api'

const EVENT_TYPE_LABELS: Record<string, string> = {
  course: 'Курс',
  seminar: 'Семінар',
  masterclass: 'Майстер-клас',
  guide: 'Гайд',
  certification: 'Сертифікація',
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  course: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  seminar: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  masterclass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  guide: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  certification: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
}

function formatPrice(kopecks: number): string {
  if (kopecks === 0) return 'Безкоштовно'
  return `${(kopecks / 100).toLocaleString('uk-UA')} ₴`
}

function RegistrationModal({
  open,
  onClose,
  eventId,
  eventTitle,
  price,
  ticketTypeId,
  ticketCount,
}: {
  open: boolean
  onClose: () => void
  eventId: number
  eventTitle: string
  price: number
  ticketTypeId?: number | null
  ticketCount?: number
}) {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', telegram: '' })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [isWaitlist, setIsWaitlist] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name.trim() || !form.phone.trim()) return
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/education/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          ticket_type_id: ticketTypeId || undefined,
          ticket_count: ticketCount || 1,
          ...form,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.detail || 'Помилка реєстрації')
        return
      }
      setIsWaitlist(data.status === 'waitlist')
      setSuccess(true)
    } catch {
      setError('Помилка мережі. Спробуйте ще раз.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleClose() {
    setForm({ full_name: '', email: '', phone: '', telegram: '' })
    setSuccess(false)
    setError('')
    onClose()
  }

  const totalPrice = price * (ticketCount || 1)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Реєстрація на подію</DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="w-14 h-14 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-semibold">
              {isWaitlist ? 'Ви в черзі очікування!' : 'Реєстрацію підтверджено!'}
            </h3>
            <p className="text-muted-foreground mt-2 text-sm">
              {isWaitlist
                ? 'Якщо звільниться місце, ми з вами зв\'яжемось.'
                : 'Ми зв\'яжемося з вами для підтвердження деталей.'}
            </p>
            <Button className="mt-5" onClick={handleClose}>Закрити</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <p className="font-medium truncate">{eventTitle}</p>
              {totalPrice > 0 && (
                <p className="text-muted-foreground mt-0.5">
                  До сплати: <span className="font-semibold text-foreground">{formatPrice(totalPrice)}</span>
                  {(ticketCount || 1) > 1 && ` (${ticketCount} × ${formatPrice(price)})`}
                </p>
              )}
            </div>

            <div>
              <Label>Ім&apos;я та прізвище *</Label>
              <Input
                value={form.full_name}
                onChange={e => setForm({ ...form, full_name: e.target.value })}
                placeholder="Ваше ім'я"
                required
              />
            </div>

            <div>
              <Label>Телефон *</Label>
              <Input
                type="tel"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="+380..."
                required
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>

            <div>
              <Label>Telegram</Label>
              <Input
                value={form.telegram}
                onChange={e => setForm({ ...form, telegram: e.target.value })}
                placeholder="@username"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
                Скасувати
              </Button>
              <Button type="submit" className="flex-1" disabled={submitting || !form.full_name.trim() || !form.phone.trim()}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Зареєструватися
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default function EventDetailPage() {
  const { slug, eventId } = useParams<{ slug: string; eventId: string }>()

  const [event, setEvent] = useState<EducatorEventCard | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<PublicTicketType | null>(null)
  const [ticketCount, setTicketCount] = useState(1)

  useEffect(() => {
    publicApi.getEducatorEventDetail(slug, parseInt(eventId))
      .then(setEvent)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug, eventId])

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="pt-24 max-w-3xl mx-auto px-4 space-y-4 animate-pulse">
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </main>
    )
  }

  if (notFound || !event) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="pt-32 max-w-3xl mx-auto px-4 text-center">
          <Calendar className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h1 className="text-2xl font-bold">Подію не знайдено</h1>
          <Link href={`/education/${slug}`}>
            <Button className="mt-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад до тренера
            </Button>
          </Link>
        </div>
        <Footer />
      </main>
    )
  }

  const startDate = new Date(event.start_at)
  const endDate = event.end_at ? new Date(event.end_at) : null
  const isEarlyBird = event.early_bird_price && event.early_bird_until && new Date(event.early_bird_until) > new Date()
  const typeColor = EVENT_TYPE_COLORS[event.event_type || ''] || EVENT_TYPE_COLORS.seminar
  const typeLabel = EVENT_TYPE_LABELS[event.event_type || ''] || 'Подія'
  const isFull = event.spots_left !== null && event.spots_left !== undefined && event.spots_left <= 0
  const currentPrice = isEarlyBird ? event.early_bird_price! : event.price
  const hasTicketTypes = event.ticket_types && event.ticket_types.length > 0
  const activeTickets = event.ticket_types?.filter(t => t.is_active) || []
  const effectiveTicket = selectedTicket || (activeTickets[0] ?? null)
  const registerPrice = hasTicketTypes
    ? (effectiveTicket?.price ?? 0)
    : currentPrice

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">
        {/* Back */}
        <Link href={`/education/${slug}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          До профілю тренера
        </Link>

        {/* Cover */}
        {event.cover_image_url && (
          <div className="relative h-48 sm:h-72 rounded-2xl overflow-hidden mb-6">
            <Image src={event.cover_image_url} alt={event.title} fill className="object-cover" />
          </div>
        )}

        {/* Type + badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge className={`${typeColor} border-0`}>{typeLabel}</Badge>
          {event.is_online && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Video className="w-3 h-3" /> Онлайн
            </Badge>
          )}
          {event.is_multi_day && (
            <Badge variant="outline">Багатоденна</Badge>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6">
          {event.title}
        </h1>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {event.description && (
              <Card>
                <CardHeader><CardTitle className="text-base">Опис</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{event.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Educator info */}
            {event.educator_name && (
              <Card>
                <CardHeader><CardTitle className="text-base">Тренер</CardTitle></CardHeader>
                <CardContent>
                  <Link href={`/education/${event.educator_slug}`} className="flex items-center gap-3 group">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0">
                      {event.educator_logo_url ? (
                        <Image src={event.educator_logo_url} alt={event.educator_name} width={48} height={48} className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl font-bold text-indigo-400">
                          {event.educator_name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <span className="font-medium group-hover:text-indigo-500 transition-colors">
                      {event.educator_name}
                    </span>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Ticket / price card */}
            <Card className="border-2 border-indigo-100 dark:border-indigo-900/40">
              <CardContent className="pt-6 space-y-4">
                {hasTicketTypes ? (
                  <>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Оберіть квиток</p>
                    <div className="space-y-2">
                      {activeTickets.map(ticket => {
                        const isSelected = (selectedTicket?.id ?? activeTickets[0]?.id) === ticket.id
                        const soldOut = ticket.spots_left !== null && ticket.spots_left !== undefined && ticket.spots_left <= 0
                        return (
                          <button
                            key={ticket.id}
                            disabled={soldOut}
                            onClick={() => setSelectedTicket(ticket)}
                            className={`w-full text-left rounded-xl border-2 p-3 transition-all ${
                              isSelected
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                : soldOut
                                  ? 'border-muted opacity-50 cursor-not-allowed'
                                  : 'border-transparent bg-muted/40 hover:border-indigo-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">{ticket.name}</span>
                              <span className={`text-sm font-bold ${ticket.price === 0 ? 'text-green-600' : ''}`}>
                                {formatPrice(ticket.price)}
                              </span>
                            </div>
                            {ticket.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">{ticket.description}</p>
                            )}
                            {ticket.spots_left !== null && ticket.spots_left !== undefined && (
                              <p className={`text-xs mt-1 ${ticket.spots_left <= 3 ? 'text-red-500' : 'text-muted-foreground'}`}>
                                {ticket.spots_left <= 0 ? 'Продано' : `Залишилось ${ticket.spots_left} місць`}
                              </p>
                            )}
                          </button>
                        )
                      })}
                    </div>
                    {effectiveTicket && effectiveTicket.price > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Кількість:</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setTicketCount(c => Math.max(1, c - 1))} className="w-8 h-8 rounded-full border flex items-center justify-center text-sm hover:bg-muted transition-colors">−</button>
                          <span className="w-6 text-center text-sm font-medium">{ticketCount}</span>
                          <button onClick={() => setTicketCount(c => Math.min(effectiveTicket.spots_left ?? 99, c + 1))} className="w-8 h-8 rounded-full border flex items-center justify-center text-sm hover:bg-muted transition-colors">+</button>
                        </div>
                      </div>
                    )}
                    {effectiveTicket && effectiveTicket.price > 0 && ticketCount > 1 && (
                      <div className="text-sm font-semibold text-right">
                        Разом: {formatPrice(effectiveTicket.price * ticketCount)}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {isEarlyBird ? (
                      <div>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {formatPrice(event.early_bird_price!)}
                        </p>
                        <p className="text-sm text-muted-foreground line-through">{formatPrice(event.price)}</p>
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0 text-[11px] mt-1">
                          Early Bird до {new Date(event.early_bird_until!).toLocaleDateString('uk-UA')}
                        </Badge>
                      </div>
                    ) : (
                      <p className={`text-2xl font-bold ${event.price === 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                        {formatPrice(event.price)}
                      </p>
                    )}
                    {event.spots_left !== null && event.spots_left !== undefined && (
                      <p className={`text-sm font-medium ${event.spots_left <= 3 ? 'text-red-500' : 'text-muted-foreground'}`}>
                        {event.spots_left === 0 ? 'Місць немає' : `Залишилось ${event.spots_left} місць`}
                      </p>
                    )}
                  </>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  disabled={isFull && !hasTicketTypes}
                  onClick={() => setRegisterOpen(true)}
                >
                  {isFull && !hasTicketTypes ? 'Місця закінчились' : registerPrice === 0 ? 'Зареєструватися безкоштовно' : 'Придбати квиток'}
                </Button>

                {isFull && !hasTicketTypes && (
                  <Button variant="outline" className="w-full" onClick={() => setRegisterOpen(true)}>
                    Стати в чергу
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Date & time */}
            <Card>
              <CardContent className="pt-6 space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">
                      {startDate.toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    {endDate && !event.is_multi_day && (
                      <p className="text-muted-foreground">{endDate.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <span>
                    {startDate.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                    {endDate && (
                      <> — {endDate.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}</>
                    )}
                  </span>
                </div>

                {event.is_online ? (
                  <div className="flex items-center gap-3">
                    <Video className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <span>Онлайн</span>
                  </div>
                ) : event.city_info && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p>{event.city_info.name}</p>
                    </div>
                  </div>
                )}

                {event.registrations_count !== undefined && (
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <span>{event.registrations_count} зареєстровано</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <RegistrationModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        eventId={event.id}
        eventTitle={event.title}
        price={registerPrice}
        ticketTypeId={hasTicketTypes ? (effectiveTicket?.id ?? null) : null}
        ticketCount={hasTicketTypes ? ticketCount : 1}
      />

      <Footer />
    </main>
  )
}
