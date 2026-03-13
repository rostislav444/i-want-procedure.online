'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft, Clock, Users, Award, Globe, CheckCircle2,
  Play, ChevronDown, ChevronUp, BookOpen, FileText, Wrench, HelpCircle,
  MessageCircle, Calendar, Send, CheckCircle,
} from 'lucide-react'
import Header from '@/components/site/Header'
import Footer from '@/components/site/Footer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { publicApi, type EducatorOffering, type EducatorDetail, type CurriculumSection, type OfferingQuestion } from '@/lib/public-api'

const TYPE_LABELS: Record<string, string> = {
  course: 'Курс', guide: 'Матеріал', consultation: 'Консультація',
  seminar: 'Семінар', masterclass: 'Майстер-клас', certification: 'Сертифікація',
}
const TYPE_COLORS: Record<string, string> = {
  course: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  guide: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  consultation: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  seminar: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  masterclass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  certification: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
}
const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Початковий', intermediate: 'Середній', advanced: 'Просунутий', all: 'Для всіх',
}
const LESSON_ICONS: Record<string, React.ElementType> = {
  video: Play, text: FileText, practice: Wrench, quiz: HelpCircle,
}

function formatPrice(kopecks: number) {
  if (kopecks === 0) return 'Безкоштовно'
  return `${(kopecks / 100).toLocaleString('uk-UA')} ₴`
}

function totalMinutes(curriculum: CurriculumSection[]) {
  return curriculum.reduce((sum, s) => sum + s.lessons.reduce((ls, l) => ls + (l.duration_min || 0), 0), 0)
}
function totalLessons(curriculum: CurriculumSection[]) {
  return curriculum.reduce((sum, s) => sum + s.lessons.length, 0)
}

function CurriculumBlock({ curriculum }: { curriculum: CurriculumSection[] }) {
  const [openSections, setOpenSections] = useState<Set<number>>(new Set([0]))
  const toggle = (i: number) => setOpenSections(prev => {
    const next = new Set(prev)
    next.has(i) ? next.delete(i) : next.add(i)
    return next
  })
  const mins = totalMinutes(curriculum)
  const lessons = totalLessons(curriculum)

  return (
    <div>
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
        <span>{curriculum.length} розділів</span>
        <span>·</span>
        <span>{lessons} уроків</span>
        {mins > 0 && <><span>·</span><span>{Math.floor(mins / 60)} год {mins % 60} хв</span></>}
      </div>
      <div className="space-y-2">
        {curriculum.map((section, si) => {
          const isOpen = openSections.has(si)
          const sectionMins = section.lessons.reduce((s, l) => s + (l.duration_min || 0), 0)
          return (
            <div key={si} className="border rounded-xl overflow-hidden">
              <button
                onClick={() => toggle(si)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
              >
                <div>
                  <span className="font-medium text-sm">{section.section_title}</span>
                  {section.section_description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{section.section_description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0 ml-4">
                  <span>{section.lessons.length} уроків</span>
                  {sectionMins > 0 && <span>{sectionMins} хв</span>}
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>
              {isOpen && (
                <div className="border-t divide-y">
                  {section.lessons.map((lesson, li) => {
                    const Icon = LESSON_ICONS[lesson.type] || Play
                    return (
                      <div key={li} className="flex items-start gap-3 px-4 py-3 bg-muted/20">
                        <Icon className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{lesson.title}</p>
                          {lesson.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{lesson.description}</p>
                          )}
                        </div>
                        {lesson.duration_min > 0 && (
                          <span className="text-xs text-muted-foreground flex-shrink-0">{lesson.duration_min} хв</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function OfferingDetailPage() {
  const { slug, offeringSlug } = useParams<{ slug: string; offeringSlug: string }>()
  const [offering, setOffering] = useState<EducatorOffering | null>(null)
  const [educator, setEducator] = useState<EducatorDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [questions, setQuestions] = useState<OfferingQuestion[]>([])
  const [qForm, setQForm] = useState({ visitor_name: '', visitor_email: '', question: '' })
  const [qSubmitting, setQSubmitting] = useState(false)
  const [qSubmitted, setQSubmitted] = useState(false)
  const [qError, setQError] = useState('')

  useEffect(() => {
    Promise.all([
      publicApi.getEducatorOffering(slug, offeringSlug),
      publicApi.getEducator(slug),
      publicApi.getOfferingQuestions(slug, offeringSlug).catch(() => []),
    ])
      .then(([off, edu, qs]) => { setOffering(off); setEducator(edu); setQuestions(qs) })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug, offeringSlug])

  const handleQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!qForm.question.trim() || !qForm.visitor_name.trim()) return
    setQSubmitting(true)
    setQError('')
    try {
      const newQ = await publicApi.postOfferingQuestion(slug, offeringSlug, {
        visitor_name: qForm.visitor_name,
        visitor_email: qForm.visitor_email || undefined,
        question: qForm.question,
      })
      setQuestions(prev => [newQ, ...prev])
      setQSubmitted(true)
      setQForm({ visitor_name: '', visitor_email: '', question: '' })
    } catch {
      setQError('Не вдалося надіслати питання. Спробуйте ще раз.')
    } finally {
      setQSubmitting(false)
    }
  }

  if (loading) return (
    <main className="min-h-screen bg-background">
      <Header />
      <div className="max-w-6xl mx-auto px-4 pt-24 pb-16 grid lg:grid-cols-[1fr,360px] gap-8 animate-pulse">
        <div className="space-y-6">
          <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
        </div>
        <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
      </div>
    </main>
  )

  if (notFound || !offering) return (
    <main className="min-h-screen bg-background">
      <Header />
      <div className="pt-32 max-w-4xl mx-auto px-4 text-center">
        <h1 className="text-2xl font-bold">Матеріал не знайдено</h1>
        <Link href={`/education/${slug}`}><Button className="mt-6"><ArrowLeft className="w-4 h-4 mr-2" />Назад до профілю</Button></Link>
      </div>
      <Footer />
    </main>
  )

  const curriculum = offering.curriculum || []
  const mins = totalMinutes(curriculum)

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="max-w-6xl mx-auto px-4 pt-20 pb-16">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 pt-4">
          <Link href="/education" className="hover:text-foreground">Навчання</Link>
          <span>/</span>
          <Link href={`/education/${slug}`} className="hover:text-foreground">{educator?.name}</Link>
          <span>/</span>
          <span className="text-foreground truncate">{offering.title}</span>
        </div>

        <div className="grid lg:grid-cols-[1fr,360px] gap-10 items-start">
          {/* ── Left column ── */}
          <div className="space-y-10">
            {/* Hero */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge className={`${TYPE_COLORS[offering.type] || TYPE_COLORS.course} border-0`}>
                  {TYPE_LABELS[offering.type] || offering.type}
                </Badge>
                {offering.level && (
                  <Badge variant="outline" className="text-xs">{LEVEL_LABELS[offering.level] || offering.level}</Badge>
                )}
                {offering.certificate_included && (
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    <Award className="w-3 h-3" /> Сертифікат
                  </Badge>
                )}
                {offering.language && offering.language !== 'uk' && (
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    <Globe className="w-3 h-3" /> {offering.language.toUpperCase()}
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{offering.title}</h1>
              {offering.short_description && (
                <p className="text-muted-foreground mt-3 text-lg leading-relaxed">{offering.short_description}</p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                {offering.duration_hours && (
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{offering.duration_hours} годин</span>
                )}
                {curriculum.length > 0 && mins > 0 && (
                  <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" />{totalLessons(curriculum)} уроків</span>
                )}
              </div>
            </div>

            {/* Learning outcomes */}
            {offering.learning_outcomes && offering.learning_outcomes.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4">Що ви навчитесь</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {offering.learning_outcomes.map((item, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Curriculum */}
            {curriculum.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4">Програма курсу</h2>
                <CurriculumBlock curriculum={curriculum} />
              </div>
            )}

            {/* Target audience */}
            {offering.target_audience && (
              <div>
                <h2 className="text-xl font-bold mb-3">Для кого цей матеріал</h2>
                <p className="text-muted-foreground leading-relaxed">{offering.target_audience}</p>
              </div>
            )}

            {/* Full description */}
            {offering.description && (
              <div>
                <h2 className="text-xl font-bold mb-3">Детальний опис</h2>
                <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{offering.description}</p>
              </div>
            )}

            {/* Prerequisites */}
            {offering.prerequisites && (
              <div>
                <h2 className="text-xl font-bold mb-3">Передумови</h2>
                <p className="text-muted-foreground leading-relaxed">{offering.prerequisites}</p>
              </div>
            )}

            {/* Q&A Section */}
            <div>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-indigo-500" />
                Запитання та відповіді
              </h2>

              {/* Existing questions */}
              {questions.length > 0 && (
                <div className="space-y-4 mb-8">
                  {questions.map((q) => (
                    <div key={q.id} className="border rounded-xl p-5 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            {q.visitor_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{q.visitor_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(q.created_at).toLocaleDateString('uk-UA')}
                            </span>
                          </div>
                          <p className="text-sm mt-1 leading-relaxed">{q.question}</p>
                        </div>
                      </div>

                      {q.is_answered && q.answer && (
                        <div className="ml-11 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 flex gap-3">
                          <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-[10px] font-bold text-white">A</span>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-1">
                              {educator?.name}
                            </p>
                            <p className="text-sm leading-relaxed">{q.answer}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Ask a question form */}
              <div className="border rounded-xl p-5">
                <h3 className="font-semibold text-sm mb-4">Задати питання спікеру</h3>
                {qSubmitted ? (
                  <div className="flex items-center gap-3 py-4 text-green-600 dark:text-green-400">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm">Ваше питання надіслано! Спікер відповість найближчим часом.</p>
                  </div>
                ) : (
                  <form onSubmit={handleQuestion} className="space-y-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <input
                        value={qForm.visitor_name}
                        onChange={e => setQForm(f => ({ ...f, visitor_name: e.target.value }))}
                        placeholder="Ваше ім'я *"
                        required
                        className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                      <input
                        type="email"
                        value={qForm.visitor_email}
                        onChange={e => setQForm(f => ({ ...f, visitor_email: e.target.value }))}
                        placeholder="Email (необов'язково)"
                        className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                    </div>
                    <textarea
                      value={qForm.question}
                      onChange={e => setQForm(f => ({ ...f, question: e.target.value }))}
                      placeholder="Ваше питання..."
                      required
                      rows={3}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
                    />
                    {qError && <p className="text-sm text-red-500">{qError}</p>}
                    <Button type="submit" disabled={qSubmitting} className="bg-indigo-500 hover:bg-indigo-600">
                      {qSubmitting ? (
                        <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Надсилання...</span>
                      ) : (
                        <span className="flex items-center gap-2"><Send className="w-4 h-4" />Надіслати питання</span>
                      )}
                    </Button>
                  </form>
                )}
              </div>
            </div>

            {/* Educator card */}
            {educator && (
              <div className="border rounded-2xl p-5 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                  {educator.logo_url ? (
                    <Image src={educator.logo_url} alt={educator.name} width={56} height={56} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl font-bold text-indigo-400">{educator.name.charAt(0)}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/education/${slug}`} className="font-semibold hover:text-indigo-500 transition-colors">{educator.name}</Link>
                  {educator.educator_tagline && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{educator.educator_tagline}</p>}
                </div>
                <Link href={`/education/${slug}`}>
                  <Button variant="outline" size="sm">Профіль</Button>
                </Link>
              </div>
            )}
          </div>

          {/* ── Right sticky sidebar ── */}
          <div className="lg:sticky lg:top-24 space-y-4">
            <div className="border rounded-2xl overflow-hidden shadow-sm">
              {/* Cover / promo video */}
              {offering.promo_video_url ? (
                <div className="relative aspect-video bg-black">
                  <iframe src={offering.promo_video_url} className="absolute inset-0 w-full h-full" allowFullScreen />
                </div>
              ) : offering.cover_image_url ? (
                <div className="relative h-48">
                  <Image src={offering.cover_image_url} alt={offering.title} fill className="object-cover" />
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-br from-violet-400 via-purple-400 to-indigo-500 flex items-center justify-center">
                  <BookOpen className="w-16 h-16 text-white/60" />
                </div>
              )}

              <div className="p-5 space-y-4">
                {/* Price */}
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {formatPrice(offering.price)}
                </div>

                {/* CTA */}
                {offering.content_url ? (
                  <a href={offering.content_url} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full bg-violet-500 hover:bg-violet-600 text-white">
                      {offering.price === 0 ? 'Отримати безкоштовно' : 'Придбати'}
                    </Button>
                  </a>
                ) : educator?.telegram ? (
                  <a href={`https://t.me/${educator.telegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full bg-violet-500 hover:bg-violet-600 text-white">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Написати спікеру
                    </Button>
                  </a>
                ) : (
                  <Button className="w-full bg-violet-500 hover:bg-violet-600 text-white">
                    {offering.price === 0 ? 'Отримати безкоштовно' : 'Придбати'}
                  </Button>
                )}

                {/* What includes */}
                {offering.what_includes && offering.what_includes.length > 0 && (
                  <div className="border-t pt-4 space-y-2">
                    <p className="text-sm font-medium">Що включено:</p>
                    {offering.what_includes.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        {item}
                      </div>
                    ))}
                  </div>
                )}

                {/* Upcoming events */}
                {offering.upcoming_events_count > 0 && (
                  <div className="border-t pt-4">
                    <Link href={`/education/${slug}`} className="flex items-center gap-2 text-sm text-indigo-500 hover:text-indigo-600">
                      <Calendar className="w-4 h-4" />
                      {offering.upcoming_events_count} найближчих подій
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
