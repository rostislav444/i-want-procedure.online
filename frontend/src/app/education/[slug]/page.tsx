'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  MapPin, Calendar, BookOpen, GraduationCap, Video,
  ArrowLeft, Clock, Users, ExternalLink, Play, Link as LinkIcon,
  Instagram, Youtube, Globe, MessageCircle,
} from 'lucide-react'
import Header from '@/components/site/Header'
import Footer from '@/components/site/Footer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  publicApi,
  type EducatorDetail, type EducatorOffering, type EducatorEventCard,
} from '@/lib/public-api'

const OFFERING_TYPE_LABELS: Record<string, string> = {
  course: 'Курс',
  guide: 'Матеріали',
  consultation: 'Консультація',
  seminar: 'Семінар',
  masterclass: 'Майстер-клас',
  certification: 'Сертифікація',
}

const OFFERING_TYPE_COLORS: Record<string, string> = {
  course: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  guide: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  consultation: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  seminar: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  masterclass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  certification: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
}

function formatPrice(kopecks: number): string {
  if (kopecks === 0) return 'Безкоштовно'
  return `${(kopecks / 100).toLocaleString('uk-UA')} ₴`
}

function getSocialLinks(socialLinks?: string | null) {
  if (!socialLinks) return {}
  try { return JSON.parse(socialLinks) } catch { return {} }
}

export default function EducatorProfilePage() {
  const { slug } = useParams<{ slug: string }>()

  const [educator, setEducator] = useState<EducatorDetail | null>(null)
  const [offerings, setOfferings] = useState<EducatorOffering[]>([])
  const [events, setEvents] = useState<EducatorEventCard[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    Promise.all([
      publicApi.getEducator(slug),
      publicApi.getEducatorOfferings(slug),
      publicApi.getEducatorEvents(slug),
    ])
      .then(([edu, offs, evts]) => {
        setEducator(edu)
        setOfferings(offs)
        setEvents(evts)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="pt-24 max-w-4xl mx-auto px-4 space-y-6 animate-pulse">
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl" />)}
          </div>
        </div>
      </main>
    )
  }

  if (notFound || !educator) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="pt-32 max-w-4xl mx-auto px-4 text-center">
          <GraduationCap className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h1 className="text-2xl font-bold">Спеціаліста не знайдено</h1>
          <p className="text-muted-foreground mt-2">Можливо, сторінку було видалено або адресу вказано невірно</p>
          <Link href="/education">
            <Button className="mt-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              До каталогу
            </Button>
          </Link>
        </div>
        <Footer />
      </main>
    )
  }

  const socialLinks = getSocialLinks(educator.social_links)
  const upcomingEvents = events.filter(e => new Date(e.start_at) > new Date())
  const instagramUrl = educator.instagram_url || (socialLinks.instagram ? (socialLinks.instagram.startsWith('http') ? socialLinks.instagram : `https://instagram.com/${socialLinks.instagram.replace('@', '')}`) : null)
  const youtubeUrl = educator.youtube_url || socialLinks.youtube || null
  const websiteUrl = educator.website_url || null

  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative">
        {/* Cover */}
        <div className="h-48 sm:h-64 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 relative">
          {educator.cover_image_url && (
            <Image src={educator.cover_image_url} alt="" fill className="object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>

        {/* Profile info */}
        <div className="max-w-4xl mx-auto px-4 relative">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-16 pb-6">
            {/* Avatar */}
            <div className="w-28 h-28 rounded-2xl border-4 border-white dark:border-background bg-gray-100 dark:bg-gray-800 overflow-hidden shadow-xl flex-shrink-0">
              {educator.logo_url ? (
                <Image src={educator.logo_url} alt={educator.name} width={112} height={112} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-indigo-400">
                  {educator.name.charAt(0)}
                </div>
              )}
            </div>

            <div className="flex-1 sm:pb-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{educator.name}</h1>
              {educator.educator_tagline && (
                <p className="text-muted-foreground mt-1">{educator.educator_tagline}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                {educator.city_info && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {educator.city_info.name}
                  </span>
                )}
                {educator.telegram && (
                  <a href={`https://t.me/${educator.telegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-500 hover:text-blue-600">
                    <MessageCircle className="w-3.5 h-3.5" /> Telegram
                  </a>
                )}
                {instagramUrl && (
                  <a href={instagramUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-pink-500 hover:text-pink-600">
                    <Instagram className="w-3.5 h-3.5" /> Instagram
                  </a>
                )}
                {youtubeUrl && (
                  <a href={youtubeUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-red-500 hover:text-red-600">
                    <Youtube className="w-3.5 h-3.5" /> YouTube
                  </a>
                )}
                {websiteUrl && (
                  <a href={websiteUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-green-600 hover:text-green-700">
                    <Globe className="w-3.5 h-3.5" /> Сайт
                  </a>
                )}
              </div>
              {/* Stats bar */}
              <div className="flex items-center gap-5 mt-3 text-sm">
                {offerings.length > 0 && (
                  <span className="flex items-center gap-1 font-medium">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                    {offerings.length} {offerings.length === 1 ? 'продукт' : offerings.length < 5 ? 'продукти' : 'продуктів'}
                  </span>
                )}
                {educator.students_count ? (
                  <span className="flex items-center gap-1 font-medium">
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    {educator.students_count.toLocaleString()} студентів
                  </span>
                ) : null}
                {upcomingEvents.length > 0 && (
                  <span className="flex items-center gap-1 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    {upcomingEvents.length} {upcomingEvents.length === 1 ? 'подія' : 'події'}
                  </span>
                )}
              </div>
            </div>

            {/* Contact button */}
            {educator.phone && (
              <a href={`tel:${educator.phone}`}>
                <Button>Зв&apos;язатись</Button>
              </a>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 pb-16 space-y-10">
        {/* Credentials / Bio */}
        {((educator.bio || educator.description) || educator.educator_credentials) && (
          <div className="grid gap-6 sm:grid-cols-2">
            {(educator.bio || educator.description) && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Про мене</h2>
                <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{educator.bio || educator.description}</p>
              </div>
            )}
            {educator.educator_credentials && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Регалії та досвід</h2>
                <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{educator.educator_credentials}</p>
              </div>
            )}
          </div>
        )}

        {/* Promo video */}
        {educator.educator_video_url && (
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Play className="w-5 h-5 text-indigo-500" />
              Промо-відео
            </h2>
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black">
              <iframe
                src={educator.educator_video_url}
                className="absolute inset-0 w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          </div>
        )}

        {/* Offerings */}
        {offerings.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              Продукти та курси
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {offerings.map((offering) => {
                const typeColor = OFFERING_TYPE_COLORS[offering.type] || OFFERING_TYPE_COLORS.course
                const typeLabel = OFFERING_TYPE_LABELS[offering.type] || offering.type

                return (
                  <Link key={offering.id} href={`/education/${slug}/${offering.slug}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer">
                    {offering.cover_image_url && (
                      <div className="h-32 overflow-hidden">
                        <Image
                          src={offering.cover_image_url}
                          alt={offering.title}
                          width={400}
                          height={128}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardContent className={offering.cover_image_url ? 'pt-4' : 'pt-6'}>
                      <Badge className={`${typeColor} border-0 text-[11px] mb-2`}>{typeLabel}</Badge>
                      <h3 className="font-semibold text-sm leading-tight">{offering.title}</h3>
                      {offering.short_description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{offering.short_description}</p>
                      )}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 dark:border-white/10">
                        <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                          {formatPrice(offering.price)}
                        </span>
                        {offering.duration_hours && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {offering.duration_hours} год
                          </span>
                        )}
                      </div>
                      {offering.upcoming_events_count > 0 && (
                        <p className="text-xs text-indigo-500 mt-1.5">
                          {offering.upcoming_events_count} найближчих подій
                        </p>
                      )}
                      {/* Content links */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {offering.promo_video_url && (
                          <a
                            href={offering.promo_video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="flex items-center gap-1 text-[11px] text-red-500 hover:text-red-600"
                          >
                            <Play className="w-3 h-3" /> Відео
                          </a>
                        )}
                        {offering.content_url && (
                          <a
                            href={offering.content_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="flex items-center gap-1 text-[11px] text-blue-500 hover:text-blue-600"
                          >
                            <LinkIcon className="w-3 h-3" /> Матеріали
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Upcoming events */}
        {upcomingEvents.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" />
              Найближчі події
            </h2>
            <div className="space-y-3">
              {upcomingEvents.map((event) => {
                const startDate = new Date(event.start_at)
                const isEarlyBird = event.early_bird_price && event.early_bird_until && new Date(event.early_bird_until) > new Date()

                return (
                  <Link
                    key={event.id}
                    href={`/education/${slug}/events/${event.id}`}
                    className="flex gap-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a2e] p-4 hover:shadow-lg hover:shadow-indigo-500/10 transition-all group"
                  >
                    {/* Date badge */}
                    <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex flex-col items-center justify-center">
                      <span className="text-[11px] font-semibold text-indigo-400 uppercase">
                        {startDate.toLocaleDateString('uk-UA', { month: 'short' })}
                      </span>
                      <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400 leading-none">
                        {startDate.getDate()}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold group-hover:text-indigo-500 transition-colors truncate">{event.title}</h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {startDate.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {event.city_info && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {event.city_info.name}
                          </span>
                        )}
                        {event.is_online && (
                          <Badge variant="secondary" className="text-[11px]">
                            <Video className="w-3 h-3 mr-1" />Онлайн
                          </Badge>
                        )}
                        {event.registrations_count !== undefined && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {event.registrations_count} реєстрацій
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      {isEarlyBird ? (
                        <div>
                          <p className="text-sm font-bold text-green-600 dark:text-green-400">
                            {formatPrice(event.early_bird_price!)}
                          </p>
                          <p className="text-xs text-muted-foreground line-through">{formatPrice(event.price)}</p>
                        </div>
                      ) : (
                        <p className={`text-sm font-bold ${event.price === 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                          {formatPrice(event.price)}
                        </p>
                      )}
                      {event.spots_left !== null && event.spots_left !== undefined && event.spots_left <= 5 && (
                        <p className="text-[11px] text-red-500 mt-1">{event.spots_left} місць</p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {offerings.length === 0 && events.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Поки що немає опублікованих продуктів або подій</p>
          </div>
        )}
      </div>

      <Footer />
    </main>
  )
}
