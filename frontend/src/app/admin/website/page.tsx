'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import {
  Save,
  ExternalLink,
  Instagram,
  Facebook,
  Type,
  Copy,
  Check,
  Image,
  Upload,
  Loader2,
  X,
  Palette,
  Sun,
  Moon,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  companyApi,
  uploadApi,
  Company,
} from '@/lib/api'

// Primary colors
const PRIMARY_COLORS = [
  { value: '#e91e63', label: 'Рожевий' },
  { value: '#9c27b0', label: 'Фіолетовий' },
  { value: '#3f51b5', label: 'Синій' },
  { value: '#009688', label: 'Бірюзовий' },
  { value: '#4caf50', label: 'Зелений' },
  { value: '#ff9800', label: 'Помаранчевий' },
  { value: '#f44336', label: 'Червоний' },
  { value: '#795548', label: 'Коричневий' },
]

// Font options
const ACCENT_FONTS = [
  { value: 'Inter', label: 'Inter', description: 'Сучасний та чистий' },
  { value: 'Playfair Display', label: 'Playfair Display', description: 'Елегантний з засічками' },
  { value: 'Montserrat', label: 'Montserrat', description: 'Геометричний та сильний' },
  { value: 'Lora', label: 'Lora', description: 'Класичний з засічками' },
]

const BODY_FONTS = [
  { value: 'Inter', label: 'Inter', description: 'Чіткий та читабельний' },
  { value: 'Open Sans', label: 'Open Sans', description: 'Нейтральний та дружній' },
  { value: 'Roboto', label: 'Roboto', description: 'Сучасний та універсальний' },
  { value: 'Lato', label: 'Lato', description: 'Теплий та гармонійний' },
]

export default function WebsiteSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [company, setCompany] = useState<Company | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)

  // Settings state
  const [settings, setSettings] = useState({
    is_dark_theme: false,
    primary_color: '#e91e63',
    accent_font: 'Playfair Display',
    body_font: 'Inter',
    instagram: '',
    facebook: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const companyData = await companyApi.getMyCompany()
      setCompany(companyData)

      // Parse social links
      let socialLinks = { instagram: '', facebook: '' }
      if (companyData.social_links) {
        try {
          socialLinks = JSON.parse(companyData.social_links)
        } catch {}
      }

      // Determine if dark theme based on background color
      const isDark = companyData.background_color?.startsWith('#1') ||
                     companyData.background_color?.startsWith('#0') ||
                     companyData.background_color === '#171717'

      setSettings({
        is_dark_theme: isDark,
        primary_color: companyData.accent_color || companyData.primary_color || '#e91e63',
        accent_font: companyData.accent_font || 'Playfair Display',
        body_font: companyData.body_font || 'Inter',
        instagram: socialLinks.instagram || '',
        facebook: socialLinks.facebook || '',
      })
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const showSuccess = (message: string) => {
    setSuccess(message)
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      const socialLinks = JSON.stringify({
        instagram: settings.instagram,
        facebook: settings.facebook,
      })

      // Set background based on theme
      const backgroundColor = settings.is_dark_theme ? '#1a1a2e' : '#ffffff'

      await companyApi.updateCompany({
        accent_color: settings.primary_color,
        primary_color: settings.primary_color,
        background_color: backgroundColor,
        accent_font: settings.accent_font,
        body_font: settings.body_font,
        social_links: socialLinks,
      })

      showSuccess('Налаштування збережено!')
      await loadData()
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const siteUrl = company
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/site/${company.slug}`
    : ''

  const handleCopyUrl = async () => {
    if (siteUrl) {
      await navigator.clipboard.writeText(siteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showSuccess('Будь ласка, оберіть зображення')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      showSuccess('Розмір файлу не повинен перевищувати 10MB')
      return
    }

    setUploadingCover(true)
    try {
      const { url } = await uploadApi.uploadCover(file)
      await companyApi.updateCompany({ cover_image_url: url })
      showSuccess('Фонове зображення завантажено!')
      await loadData()
    } catch (error) {
      console.error('Error uploading cover:', error)
      showSuccess('Помилка при завантаженні')
    } finally {
      setUploadingCover(false)
      if (coverInputRef.current) {
        coverInputRef.current.value = ''
      }
    }
  }

  const handleRemoveCover = async () => {
    try {
      setSaving(true)
      await companyApi.updateCompany({ cover_image_url: '' })
      showSuccess('Фонове зображення видалено')
      await loadData()
    } catch (error) {
      console.error('Error removing cover:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
              <div className="animate-pulse space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 bg-muted rounded" style={{ opacity: 1 - i * 0.15 }} />
                ))}
              </div>
            </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Налаштування сайту</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Налаштуйте вигляд вашої публічної сторінки
          </p>
        </div>
        <div className="flex items-center gap-2">
          {success && (
            <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
              {success}
            </span>
          )}
          <Button variant="outline" onClick={() => window.open(siteUrl, '_blank')}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Переглянути
          </Button>
        </div>
      </div>

      {/* Site URL */}
      {siteUrl && (
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <span className="text-sm text-muted-foreground">Адреса:</span>
          <code className="flex-1 text-sm font-mono bg-background px-2 py-1 rounded border truncate">
            {siteUrl}
          </code>
          <Button variant="ghost" size="sm" onClick={handleCopyUrl}>
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}

      {/* AI Site Builder */}
      <Link href="/admin/website/ai-builder">
        <Card className="border-2 border-dashed border-blue-200 dark:border-blue-900 hover:border-blue-400 dark:hover:border-blue-700 transition-colors cursor-pointer group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">AI Генератор сайту</h3>
                  <p className="text-sm text-muted-foreground">
                    Створіть повний лендінг за допомогою AI з опису бізнесу
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-blue-500 transition-colors" />
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Template info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Тип сайту</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-lg">{company?.type === 'clinic' ? '🏥' : '👤'}</span>
            </div>
            <div>
              <p className="font-medium">
                {company?.type === 'clinic' ? 'Клініка / Салон' : 'Індивідуальний спеціаліст'}
              </p>
              <p className="text-xs text-muted-foreground">
                Визначається автоматично при створенні компанії
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cover Image */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Image className="h-4 w-4" />
            Фонове зображення
          </CardTitle>
          <CardDescription>
            Зображення для головної секції сайту
          </CardDescription>
        </CardHeader>
        <CardContent>
          {company?.cover_image_url ? (
            <div className="relative rounded-lg overflow-hidden border">
              <div className="aspect-[21/9] relative">
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'}${company.cover_image_url}`}
                  alt="Фонове зображення"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
              <div className="absolute bottom-3 right-3 flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingCover}
                >
                  {uploadingCover ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-1" />
                      Замінити
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveCover}
                  disabled={saving}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadingCover}
              className="w-full aspect-[21/9] rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer"
            >
              {uploadingCover ? (
                <>
                  <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                  <span className="text-sm text-muted-foreground">Завантаження...</span>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Натисніть, щоб завантажити
                  </span>
                  <span className="text-xs text-muted-foreground">
                    PNG, JPG до 10MB
                  </span>
                </>
              )}
            </button>
          )}

          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverUpload}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Theme & Color */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4" />
            Тема та колір
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Light/Dark Theme Toggle */}
          <div className="space-y-3">
            <Label>Тема сайту</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSettings({ ...settings, is_dark_theme: false })}
                className={`p-4 rounded-lg border-2 text-center transition-all ${
                  !settings.is_dark_theme
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-muted-foreground/30'
                }`}
              >
                <Sun className="h-6 w-6 mx-auto mb-2 text-amber-500" />
                <div className="font-medium">Світла</div>
              </button>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, is_dark_theme: true })}
                className={`p-4 rounded-lg border-2 text-center transition-all ${
                  settings.is_dark_theme
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-muted-foreground/30'
                }`}
              >
                <Moon className="h-6 w-6 mx-auto mb-2 text-indigo-500" />
                <div className="font-medium">Темна</div>
              </button>
            </div>
          </div>

          {/* Primary Color */}
          <div className="space-y-3">
            <Label>Основний колір</Label>
            <div className="flex gap-2 flex-wrap">
              {PRIMARY_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSettings({ ...settings, primary_color: color.value })}
                  className={`w-10 h-10 rounded-full border-2 transition-transform ${
                    settings.primary_color === color.value
                      ? 'border-foreground scale-110'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fonts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Type className="h-4 w-4" />
            Шрифти
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accent_font">Акцентний шрифт (заголовки)</Label>
            <select
              id="accent_font"
              value={settings.accent_font}
              onChange={(e) => setSettings({ ...settings, accent_font: e.target.value })}
              className="w-full h-10 px-3 border rounded-md bg-background"
            >
              {ACCENT_FONTS.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.label} - {font.description}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="body_font">Основний шрифт (текст)</Label>
            <select
              id="body_font"
              value={settings.body_font}
              onChange={(e) => setSettings({ ...settings, body_font: e.target.value })}
              className="w-full h-10 px-3 border rounded-md bg-background"
            >
              {BODY_FONTS.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.label} - {font.description}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Соціальні мережі</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instagram" className="flex items-center gap-1">
              <Instagram className="h-4 w-4" /> Instagram
            </Label>
            <Input
              id="instagram"
              value={settings.instagram}
              onChange={(e) => setSettings({ ...settings, instagram: e.target.value })}
              placeholder="@username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="facebook" className="flex items-center gap-1">
              <Facebook className="h-4 w-4" /> Facebook
            </Label>
            <Input
              id="facebook"
              value={settings.facebook}
              onChange={(e) => setSettings({ ...settings, facebook: e.target.value })}
              placeholder="facebook.com/page"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Збереження...' : 'Зберегти налаштування'}
        </Button>
      </div>
    </div>
  )
}
