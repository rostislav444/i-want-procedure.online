'use client'

import { useEffect, useState } from 'react'
import { Save, Copy, Check, Instagram, Youtube, Globe, MessageCircle, Upload } from 'lucide-react'
import { companyApi, uploadApi, type Company } from '@/lib/api'
import { referralApi } from '@/lib/api'

export default function EducatorProfilePage() {
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [referralLink, setReferralLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)

  const [form, setForm] = useState({
    name: '',
    educator_tagline: '',
    bio: '',
    educator_credentials: '',
    educator_video_url: '',
    telegram: '',
    instagram_url: '',
    youtube_url: '',
    website_url: '',
    logo_url: '',
    cover_image_url: '',
    students_count: 0,
  })

  useEffect(() => {
    const load = async () => {
      try {
        const [comp, dashboard] = await Promise.all([
          companyApi.getMyCompany(),
          referralApi.getDashboard().catch(() => null),
        ])
        setCompany(comp)
        setForm({
          name: comp.name || '',
          educator_tagline: (comp as any).educator_tagline || '',
          bio: comp.bio || '',
          educator_credentials: (comp as any).educator_credentials || '',
          educator_video_url: (comp as any).educator_video_url || '',
          telegram: comp.telegram || '',
          instagram_url: comp.instagram_url || '',
          youtube_url: comp.youtube_url || '',
          website_url: comp.website_url || '',
          logo_url: comp.logo_url || '',
          cover_image_url: comp.cover_image_url || '',
          students_count: comp.students_count || 0,
        })
        if (dashboard?.referral_link) {
          setReferralLink(dashboard.referral_link)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await companyApi.updateCompany(form as any)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const handleCopyReferral = async () => {
    if (!referralLink) return
    await navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    try {
      const { url } = await uploadApi.uploadLogo(file)
      setForm(f => ({ ...f, logo_url: url }))
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCover(true)
    try {
      const { url } = await uploadApi.uploadCover(file)
      setForm(f => ({ ...f, cover_image_url: url }))
    } finally {
      setUploadingCover(false)
    }
  }

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
    </div>
  )

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Мій профіль</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Публічна сторінка:{' '}
            <a
              href={`/education/${company?.slug}`}
              target="_blank"
              className="text-violet-600 hover:underline"
            >
              /education/{company?.slug}
            </a>
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors"
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Збережено' : saving ? 'Зберігаємо...' : 'Зберегти'}
        </button>
      </div>

      {/* Cover image */}
      <div className="rounded-xl border overflow-hidden">
        <div
          className="h-32 bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/20 dark:to-purple-900/20 relative"
          style={form.cover_image_url ? { backgroundImage: `url(${form.cover_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        >
          <label className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 cursor-pointer transition-colors group">
            <span className="opacity-0 group-hover:opacity-100 flex items-center gap-2 text-white text-sm font-medium transition-opacity">
              <Upload className="w-4 h-4" />
              {uploadingCover ? 'Завантаження...' : 'Змінити обкладинку'}
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={uploadingCover} />
          </label>
        </div>
        <div className="p-4 bg-background flex items-center gap-4">
          <div className="relative -mt-10">
            <div className="w-16 h-16 rounded-full border-4 border-background bg-violet-100 dark:bg-violet-900/30 overflow-hidden flex items-center justify-center">
              {form.logo_url ? (
                <img src={form.logo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-violet-600">{form.name?.[0]?.toUpperCase() || '?'}</span>
              )}
            </div>
            <label className="absolute inset-0 rounded-full flex items-center justify-center bg-black/0 hover:bg-black/40 cursor-pointer transition-colors">
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
            </label>
          </div>
          <div className="text-sm text-muted-foreground">
            Натисніть на аватар або обкладинку, щоб змінити
          </div>
        </div>
      </div>

      {/* Basic info */}
      <div className="rounded-xl border p-5 space-y-4">
        <h2 className="font-medium text-sm">Основна інформація</h2>

        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ім'я / Назва</label>
          <input
            value={form.name}
            onChange={set('name')}
            className="mt-1 w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tagline</label>
          <input
            value={form.educator_tagline}
            onChange={set('educator_tagline')}
            placeholder="Коротко про себе — відображається під іменем"
            className="mt-1 w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Про мене</label>
          <textarea
            value={form.bio}
            onChange={set('bio')}
            rows={5}
            placeholder="Розкажіть про свій досвід, підхід до навчання..."
            className="mt-1 w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Регалії та досягнення</label>
          <textarea
            value={form.educator_credentials}
            onChange={set('educator_credentials')}
            rows={3}
            placeholder="Сертифікати, нагороди, публікації..."
            className="mt-1 w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Кількість студентів</label>
          <input
            type="number"
            value={form.students_count}
            onChange={e => setForm(f => ({ ...f, students_count: parseInt(e.target.value) || 0 }))}
            className="mt-1 w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
        </div>
      </div>

      {/* Media */}
      <div className="rounded-xl border p-5 space-y-4">
        <h2 className="font-medium text-sm">Медіа</h2>
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Відео-презентація (YouTube URL)</label>
          <input
            value={form.educator_video_url}
            onChange={set('educator_video_url')}
            placeholder="https://youtube.com/watch?v=..."
            className="mt-1 w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
        </div>
      </div>

      {/* Social links */}
      <div className="rounded-xl border p-5 space-y-4">
        <h2 className="font-medium text-sm">Контакти та посилання</h2>

        <div className="flex items-center gap-3">
          <MessageCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <input
            value={form.telegram}
            onChange={set('telegram')}
            placeholder="@username або посилання на канал"
            className="flex-1 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
        </div>

        <div className="flex items-center gap-3">
          <Instagram className="w-4 h-4 text-pink-500 flex-shrink-0" />
          <input
            value={form.instagram_url}
            onChange={set('instagram_url')}
            placeholder="https://instagram.com/username"
            className="flex-1 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
        </div>

        <div className="flex items-center gap-3">
          <Youtube className="w-4 h-4 text-red-500 flex-shrink-0" />
          <input
            value={form.youtube_url}
            onChange={set('youtube_url')}
            placeholder="https://youtube.com/@channel"
            className="flex-1 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
        </div>

        <div className="flex items-center gap-3">
          <Globe className="w-4 h-4 text-green-500 flex-shrink-0" />
          <input
            value={form.website_url}
            onChange={set('website_url')}
            placeholder="https://mywebsite.com"
            className="flex-1 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
        </div>
      </div>

      {/* Referral */}
      {referralLink && (
        <div className="rounded-xl border p-5 space-y-3">
          <h2 className="font-medium text-sm">Реферальне посилання</h2>
          <p className="text-xs text-muted-foreground">Поділіться цим посиланням — і отримайте бонус за кожного нового спікера, що зареєструється.</p>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={referralLink}
              className="flex-1 px-3 py-2 rounded-lg border bg-muted text-sm text-muted-foreground"
            />
            <button
              onClick={handleCopyReferral}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm hover:bg-muted transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Скопійовано' : 'Копіювати'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
