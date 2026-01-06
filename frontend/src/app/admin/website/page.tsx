'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  Settings2,
  Palette,
  ExternalLink,
  RotateCcw,
  Save,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Upload,
  Image,
  FileText,
  Clock,
  Instagram,
  Facebook,
  Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  websiteApi,
  companyApi,
  uploadApi,
  WebsiteSection,
  SectionTypeInfo,
  IndustryThemeInfo,
  Company,
} from '@/lib/api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

const SECTION_ICONS: Record<string, string> = {
  hero: '🏠',
  about: '👤',
  services: '💅',
  team: '👥',
  benefits: '✨',
  gallery: '🖼️',
  testimonials: '💬',
  contact: '📞',
  map: '📍',
  faq: '❓',
  cta: '🎯',
  pricing: '💰',
  schedule: '📅',
  custom_text: '📝',
}

const TEMPLATE_OPTIONS = [
  { value: 'solo', label: 'Solo', description: 'Для індивідуального спеціаліста' },
  { value: 'clinic', label: 'Clinic', description: 'Для клініки або салону' },
  { value: 'premium', label: 'Premium', description: 'Розширений шаблон' },
]

const COLOR_OPTIONS = [
  { value: '#e91e63', label: 'Рожевий' },
  { value: '#9c27b0', label: 'Фіолетовий' },
  { value: '#3f51b5', label: 'Синій' },
  { value: '#009688', label: 'Бірюзовий' },
  { value: '#4caf50', label: 'Зелений' },
  { value: '#ff9800', label: 'Помаранчевий' },
  { value: '#f44336', label: 'Червоний' },
]

export default function WebsiteBuilderPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingBranding, setSavingBranding] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [company, setCompany] = useState<Company | null>(null)
  const [sections, setSections] = useState<WebsiteSection[]>([])
  const [sectionTypes, setSectionTypes] = useState<SectionTypeInfo[]>([])
  const [themes, setThemes] = useState<IndustryThemeInfo[]>([])
  const [selectedTheme, setSelectedTheme] = useState<string>('')
  const [success, setSuccess] = useState<string | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<WebsiteSection | null>(null)
  const [expandedSection, setExpandedSection] = useState<number | null>(null)

  // Branding settings state
  const [brandingData, setBrandingData] = useState({
    template_type: 'solo',
    primary_color: '#e91e63',
    specialization: '',
    working_hours: '',
    instagram: '',
    facebook: '',
  })

  const logoInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [companyData, sectionsData, typesData, themesData] = await Promise.all([
        companyApi.getMyCompany(),
        websiteApi.getSections(),
        websiteApi.getSectionTypes(),
        websiteApi.getThemes(),
      ])
      setCompany(companyData)
      setSections(sectionsData.sort((a, b) => a.order - b.order))
      setSectionTypes(typesData)
      setThemes(themesData)
      setSelectedTheme(companyData.industry_theme || 'cosmetology')

      // Parse social links if exists
      let socialLinks = { instagram: '', facebook: '' }
      if (companyData.social_links) {
        try {
          socialLinks = JSON.parse(companyData.social_links)
        } catch {}
      }

      setBrandingData({
        template_type: companyData.template_type || 'solo',
        primary_color: companyData.primary_color || '#e91e63',
        specialization: companyData.specialization || '',
        working_hours: companyData.working_hours || '',
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

  const handleAddSection = async (sectionType: string) => {
    try {
      setSaving(true)
      await websiteApi.createSection({ section_type: sectionType })
      await loadData()
      setAddDialogOpen(false)
      showSuccess('Секцію додано!')
    } catch (error) {
      console.error('Error adding section:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSection = async (id: number) => {
    try {
      setSaving(true)
      await websiteApi.deleteSection(id)
      await loadData()
      showSuccess('Секцію видалено!')
    } catch (error) {
      console.error('Error deleting section:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleVisibility = async (section: WebsiteSection) => {
    try {
      setSaving(true)
      await websiteApi.updateSection(section.id, { is_visible: !section.is_visible })
      await loadData()
    } catch (error) {
      console.error('Error toggling visibility:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleMoveSection = async (id: number, direction: 'up' | 'down') => {
    const currentIndex = sections.findIndex((s) => s.id === id)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= sections.length) return

    const newSections = [...sections]
    const [removed] = newSections.splice(currentIndex, 1)
    newSections.splice(newIndex, 0, removed)

    // Update orders
    const reorderData = newSections.map((s, i) => ({ id: s.id, order: i }))

    try {
      setSaving(true)
      await websiteApi.reorderSections(reorderData)
      setSections(newSections)
    } catch (error) {
      console.error('Error reordering sections:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateSectionContent = async (id: number, content: Record<string, unknown>) => {
    try {
      setSaving(true)
      await websiteApi.updateSection(id, { content })
      await loadData()
      setEditingSection(null)
      showSuccess('Секцію оновлено!')
    } catch (error) {
      console.error('Error updating section:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleResetToDefaults = async () => {
    try {
      setSaving(true)
      await websiteApi.resetToDefaults()
      await loadData()
      showSuccess('Секції скинуто до початкових!')
    } catch (error) {
      console.error('Error resetting sections:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleThemeChange = async (themeId: string) => {
    try {
      setSaving(true)
      await companyApi.updateCompany({ industry_theme: themeId })
      setSelectedTheme(themeId)
      showSuccess('Тему змінено!')
    } catch (error) {
      console.error('Error changing theme:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveBranding = async () => {
    try {
      setSavingBranding(true)
      const socialLinks = JSON.stringify({
        instagram: brandingData.instagram,
        facebook: brandingData.facebook,
      })

      await companyApi.updateCompany({
        template_type: brandingData.template_type,
        primary_color: brandingData.primary_color,
        specialization: brandingData.specialization || undefined,
        working_hours: brandingData.working_hours || undefined,
        social_links: socialLinks,
      })
      showSuccess('Налаштування збережено!')
      await loadData()
    } catch (error) {
      console.error('Error saving branding:', error)
    } finally {
      setSavingBranding(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    try {
      const { url } = await uploadApi.uploadLogo(file)
      await companyApi.updateCompany({ logo_url: url })
      showSuccess('Логотип завантажено!')
      await loadData()
    } catch (error) {
      console.error('Error uploading logo:', error)
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
      await companyApi.updateCompany({ cover_image_url: url })
      showSuccess('Обкладинку завантажено!')
      await loadData()
    } catch (error) {
      console.error('Error uploading cover:', error)
    } finally {
      setUploadingCover(false)
    }
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const siteUrl = company
    ? `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/site/${company.slug}`
    : ''

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const currentTheme = themes.find((t) => t.id === selectedTheme)

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Конструктор сайту</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Налаштуйте свою публічну сторінку
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
            Переглянути сайт
          </Button>
        </div>
      </div>

      {/* Theme Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Тема оформлення
          </CardTitle>
          <CardDescription>
            Оберіть стиль, який найкраще підходить вашій діяльності
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleThemeChange(theme.id)}
                disabled={saving}
                className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                  selectedTheme === theme.id
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-muted-foreground/30'
                }`}
              >
                <div
                  className="w-full h-2 rounded-full mb-3"
                  style={{
                    background: `linear-gradient(to right, ${theme.gradient_from}, ${theme.gradient_to})`,
                  }}
                />
                <div className="font-medium">{theme.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{theme.description}</div>
                {selectedTheme === theme.id && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-primary-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Branding & Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Брендинг та інформація
          </CardTitle>
          <CardDescription>
            Налаштуйте вигляд та додаткову інформацію про вашу компанію
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template Selection */}
          <div className="space-y-3">
            <Label className="flex items-center gap-1">
              <FileText className="h-4 w-4" /> Шаблон сайту
            </Label>
            <div className="grid grid-cols-3 gap-3">
              {TEMPLATE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setBrandingData({ ...brandingData, template_type: option.value })}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    brandingData.template_type === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-muted-foreground/30'
                  }`}
                >
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div className="space-y-3">
            <Label className="flex items-center gap-1">
              <Palette className="h-4 w-4" /> Основний колір
            </Label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setBrandingData({ ...brandingData, primary_color: color.value })}
                  className={`w-10 h-10 rounded-full border-2 transition-transform ${
                    brandingData.primary_color === color.value
                      ? 'border-foreground scale-110'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          {/* Logo Upload */}
          <div className="space-y-3">
            <Label className="flex items-center gap-1">
              <Upload className="h-4 w-4" /> Логотип
            </Label>
            <div className="flex items-center gap-4">
              {company?.logo_url ? (
                <img
                  src={`${apiUrl}${company.logo_url}`}
                  alt="Logo"
                  className="w-20 h-20 object-cover rounded-lg border"
                />
              ) : (
                <div className="w-20 h-20 bg-muted rounded-lg border flex items-center justify-center">
                  <Image className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                >
                  {uploadingLogo ? 'Завантаження...' : 'Завантажити логотип'}
                </Button>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG до 5MB</p>
              </div>
            </div>
          </div>

          {/* Cover Upload */}
          <div className="space-y-3">
            <Label className="flex items-center gap-1">
              <Image className="h-4 w-4" /> Обкладинка
            </Label>
            <div className="space-y-2">
              {company?.cover_image_url ? (
                <img
                  src={`${apiUrl}${company.cover_image_url}`}
                  alt="Cover"
                  className="w-full h-32 object-cover rounded-lg border"
                />
              ) : (
                <div className="w-full h-32 bg-muted rounded-lg border flex items-center justify-center">
                  <Image className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
              >
                {uploadingCover ? 'Завантаження...' : 'Завантажити обкладинку'}
              </Button>
            </div>
          </div>

          {/* Specialization & Working Hours */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="specialization">Спеціалізація</Label>
              <Input
                id="specialization"
                value={brandingData.specialization}
                onChange={(e) => setBrandingData({ ...brandingData, specialization: e.target.value })}
                placeholder="Косметолог, Масажист, Стоматолог..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="working_hours" className="flex items-center gap-1">
                <Clock className="h-4 w-4" /> Години роботи
              </Label>
              <Input
                id="working_hours"
                value={brandingData.working_hours}
                onChange={(e) => setBrandingData({ ...brandingData, working_hours: e.target.value })}
                placeholder="Пн-Пт: 9:00-18:00"
              />
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-3">
            <Label>Соціальні мережі</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="instagram" className="text-sm flex items-center gap-1">
                  <Instagram className="h-4 w-4" /> Instagram
                </Label>
                <Input
                  id="instagram"
                  value={brandingData.instagram}
                  onChange={(e) => setBrandingData({ ...brandingData, instagram: e.target.value })}
                  placeholder="@username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facebook" className="text-sm flex items-center gap-1">
                  <Facebook className="h-4 w-4" /> Facebook
                </Label>
                <Input
                  id="facebook"
                  value={brandingData.facebook}
                  onChange={(e) => setBrandingData({ ...brandingData, facebook: e.target.value })}
                  placeholder="facebook.com/page"
                />
              </div>
            </div>
          </div>

          <Button onClick={handleSaveBranding} disabled={savingBranding}>
            <Save className="mr-2 h-4 w-4" />
            {savingBranding ? 'Збереження...' : 'Зберегти налаштування'}
          </Button>
        </CardContent>
      </Card>

      {/* Sections List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Секції сайту
              </CardTitle>
              <CardDescription>
                Додавайте, видаляйте та змінюйте порядок секцій
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={saving}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Скинути
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Скинути секції?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Всі поточні секції будуть видалені та замінені на стандартні для обраної теми.
                      Цю дію неможливо скасувати.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Скасувати</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetToDefaults}>
                      Скинути
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Додати секцію
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Додати нову секцію</DialogTitle>
                    <DialogDescription>
                      Оберіть тип секції для додавання на сайт
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {sectionTypes.map((type) => (
                      <button
                        key={type.type}
                        onClick={() => handleAddSection(type.type)}
                        disabled={saving}
                        className="p-4 rounded-lg border hover:border-primary hover:bg-primary/5 text-left transition-all"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{SECTION_ICONS[type.type] || '📄'}</span>
                          <span className="font-medium">{type.name}</span>
                          {type.is_premium && (
                            <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                              <Sparkles className="h-3 w-3" />
                              Premium
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{type.description}</p>
                      </button>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sections.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Settings2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Секцій ще немає</p>
              <p className="text-sm mb-4">Додайте першу секцію для вашого сайту</p>
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Додати секцію
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {sections.map((section, index) => (
                <div
                  key={section.id}
                  className={`border rounded-lg transition-all ${
                    section.is_visible ? 'bg-card' : 'bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-2 p-3">
                    <div className="text-muted-foreground cursor-move">
                      <GripVertical className="h-5 w-5" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {SECTION_ICONS[section.section_type] || '📄'}
                        </span>
                        <span className="font-medium">
                          {sectionTypes.find((t) => t.type === section.section_type)?.name ||
                            section.section_type}
                        </span>
                        {!section.is_visible && (
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            Приховано
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMoveSection(section.id, 'up')}
                        disabled={index === 0 || saving}
                        title="Вгору"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMoveSection(section.id, 'down')}
                        disabled={index === sections.length - 1 || saving}
                        title="Вниз"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleVisibility(section)}
                        disabled={saving}
                        title={section.is_visible ? 'Приховати' : 'Показати'}
                      >
                        {section.is_visible ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setExpandedSection(
                            expandedSection === section.id ? null : section.id
                          )
                        }
                        title="Налаштувати"
                      >
                        <Settings2 className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            disabled={saving}
                            title="Видалити"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Видалити секцію?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Ця дія видалить секцію та весь її вміст. Цю дію неможливо
                              скасувати.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Скасувати</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteSection(section.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Видалити
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  {/* Expanded Section Editor */}
                  {expandedSection === section.id && (
                    <div className="border-t p-4 bg-muted/30">
                      <SectionEditor
                        section={section}
                        onSave={(content) => handleUpdateSectionContent(section.id, content)}
                        onCancel={() => setExpandedSection(null)}
                        saving={saving}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Hint */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">Готові переглянути результат?</h3>
              <p className="text-sm text-muted-foreground">
                Відкрийте вашу публічну сторінку, щоб побачити зміни
              </p>
            </div>
            <Button onClick={() => window.open(siteUrl, '_blank')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Переглянути сайт
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface SectionEditorProps {
  section: WebsiteSection
  onSave: (content: Record<string, unknown>) => void
  onCancel: () => void
  saving: boolean
}

function SectionEditor({ section, onSave, onCancel, saving }: SectionEditorProps) {
  const [content, setContent] = useState<Record<string, unknown>>(section.content || {})

  const handleChange = (key: string, value: unknown) => {
    setContent((prev) => ({ ...prev, [key]: value }))
  }

  // Render different editors based on section type
  switch (section.section_type) {
    case 'hero':
      return (
        <HeroEditor
          content={content}
          onChange={handleChange}
          onSave={() => onSave(content)}
          onCancel={onCancel}
          saving={saving}
        />
      )
    case 'about':
      return (
        <AboutEditor
          content={content}
          onChange={handleChange}
          onSave={() => onSave(content)}
          onCancel={onCancel}
          saving={saving}
        />
      )
    case 'services':
      return (
        <ServicesEditor
          content={content}
          onChange={handleChange}
          onSave={() => onSave(content)}
          onCancel={onCancel}
          saving={saving}
        />
      )
    case 'contact':
      return (
        <ContactEditor
          content={content}
          onChange={handleChange}
          onSave={() => onSave(content)}
          onCancel={onCancel}
          saving={saving}
        />
      )
    case 'map':
      return (
        <MapEditor
          content={content}
          onChange={handleChange}
          onSave={() => onSave(content)}
          onCancel={onCancel}
          saving={saving}
        />
      )
    default:
      return (
        <GenericEditor
          content={content}
          onChange={handleChange}
          onSave={() => onSave(content)}
          onCancel={onCancel}
          saving={saving}
        />
      )
  }
}

interface EditorProps {
  content: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
}

function HeroEditor({ content, onChange, onSave, onCancel, saving }: EditorProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="hero-title">Заголовок</Label>
          <Input
            id="hero-title"
            value={(content.title as string) || ''}
            onChange={(e) => onChange('title', e.target.value)}
            placeholder="Ваш заголовок"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hero-variant">Варіант</Label>
          <select
            id="hero-variant"
            value={(content.variant as string) || 'gradient'}
            onChange={(e) => onChange('variant', e.target.value)}
            className="w-full h-10 px-3 border rounded-md bg-background"
          >
            <option value="gradient">Градієнт</option>
            <option value="minimal">Мінімалістичний</option>
            <option value="image-bg">З фоновим зображенням</option>
            <option value="split">Розділений</option>
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="hero-subtitle">Підзаголовок</Label>
        <Textarea
          id="hero-subtitle"
          value={(content.subtitle as string) || ''}
          onChange={(e) => onChange('subtitle', e.target.value)}
          placeholder="Короткий опис"
          rows={2}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="hero-cta">Текст кнопки</Label>
        <Input
          id="hero-cta"
          value={(content.cta_text as string) || ''}
          onChange={(e) => onChange('cta_text', e.target.value)}
          placeholder="Записатися"
        />
      </div>
      <EditorActions onSave={onSave} onCancel={onCancel} saving={saving} />
    </div>
  )
}

function AboutEditor({ content, onChange, onSave, onCancel, saving }: EditorProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="about-title">Заголовок</Label>
        <Input
          id="about-title"
          value={(content.title as string) || ''}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder="Про нас"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="about-text">Текст</Label>
        <Textarea
          id="about-text"
          value={(content.text as string) || ''}
          onChange={(e) => onChange('text', e.target.value)}
          placeholder="Розкажіть про себе..."
          rows={4}
        />
      </div>
      <EditorActions onSave={onSave} onCancel={onCancel} saving={saving} />
    </div>
  )
}

function ServicesEditor({ content, onChange, onSave, onCancel, saving }: EditorProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="services-title">Заголовок</Label>
          <Input
            id="services-title"
            value={(content.title as string) || ''}
            onChange={(e) => onChange('title', e.target.value)}
            placeholder="Наші послуги"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="services-display">Відображення</Label>
          <select
            id="services-display"
            value={(content.display_mode as string) || 'grid'}
            onChange={(e) => onChange('display_mode', e.target.value)}
            className="w-full h-10 px-3 border rounded-md bg-background"
          >
            <option value="grid">Сітка</option>
            <option value="list">Список</option>
            <option value="cards">Картки</option>
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="services-subtitle">Підзаголовок</Label>
        <Textarea
          id="services-subtitle"
          value={(content.subtitle as string) || ''}
          onChange={(e) => onChange('subtitle', e.target.value)}
          placeholder="Опис секції послуг"
          rows={2}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="services-prices"
          checked={(content.show_prices as boolean) !== false}
          onChange={(e) => onChange('show_prices', e.target.checked)}
          className="w-4 h-4"
        />
        <Label htmlFor="services-prices" className="text-sm">
          Показувати ціни
        </Label>
      </div>
      <EditorActions onSave={onSave} onCancel={onCancel} saving={saving} />
    </div>
  )
}

function ContactEditor({ content, onChange, onSave, onCancel, saving }: EditorProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="contact-title">Заголовок</Label>
        <Input
          id="contact-title"
          value={(content.title as string) || ''}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder="Контакти"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-subtitle">Підзаголовок</Label>
        <Input
          id="contact-subtitle"
          value={(content.subtitle as string) || ''}
          onChange={(e) => onChange('subtitle', e.target.value)}
          placeholder="Зв'яжіться з нами"
        />
      </div>
      <EditorActions onSave={onSave} onCancel={onCancel} saving={saving} />
    </div>
  )
}

function MapEditor({ content, onChange, onSave, onCancel, saving }: EditorProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="map-title">Заголовок</Label>
        <Input
          id="map-title"
          value={(content.title as string) || ''}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder="Як нас знайти"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="map-address">Адреса (буде показана на карті)</Label>
        <Input
          id="map-address"
          value={(content.address as string) || ''}
          onChange={(e) => onChange('address', e.target.value)}
          placeholder="м. Київ, вул. Хрещатик, 1"
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="map-lat">Широта</Label>
          <Input
            id="map-lat"
            type="number"
            step="0.0001"
            value={((content.coordinates as any)?.lat as number) || ''}
            onChange={(e) =>
              onChange('coordinates', {
                ...((content.coordinates as any) || {}),
                lat: parseFloat(e.target.value) || 0,
              })
            }
            placeholder="50.4501"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="map-lng">Довгота</Label>
          <Input
            id="map-lng"
            type="number"
            step="0.0001"
            value={((content.coordinates as any)?.lng as number) || ''}
            onChange={(e) =>
              onChange('coordinates', {
                ...((content.coordinates as any) || {}),
                lng: parseFloat(e.target.value) || 0,
              })
            }
            placeholder="30.5234"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="map-zoom">Масштаб</Label>
          <Input
            id="map-zoom"
            type="number"
            min="10"
            max="18"
            value={(content.zoom as number) || 15}
            onChange={(e) => onChange('zoom', parseInt(e.target.value) || 15)}
          />
        </div>
      </div>
      <EditorActions onSave={onSave} onCancel={onCancel} saving={saving} />
    </div>
  )
}

function GenericEditor({ content, onChange, onSave, onCancel, saving }: EditorProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="generic-title">Заголовок</Label>
        <Input
          id="generic-title"
          value={(content.title as string) || ''}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder="Заголовок секції"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="generic-text">Текст</Label>
        <Textarea
          id="generic-text"
          value={(content.text as string) || ''}
          onChange={(e) => onChange('text', e.target.value)}
          placeholder="Вміст секції..."
          rows={4}
        />
      </div>
      <EditorActions onSave={onSave} onCancel={onCancel} saving={saving} />
    </div>
  )
}

function EditorActions({
  onSave,
  onCancel,
  saving,
}: {
  onSave: () => void
  onCancel: () => void
  saving: boolean
}) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <Button variant="outline" onClick={onCancel} disabled={saving}>
        Скасувати
      </Button>
      <Button onClick={onSave} disabled={saving}>
        <Save className="h-4 w-4 mr-2" />
        {saving ? 'Збереження...' : 'Зберегти'}
      </Button>
    </div>
  )
}
