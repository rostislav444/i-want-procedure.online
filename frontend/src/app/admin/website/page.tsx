'use client'

import { useEffect, useState } from 'react'
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  websiteApi,
  companyApi,
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

export default function WebsiteBuilderPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [company, setCompany] = useState<Company | null>(null)
  const [sections, setSections] = useState<WebsiteSection[]>([])
  const [sectionTypes, setSectionTypes] = useState<SectionTypeInfo[]>([])
  const [themes, setThemes] = useState<IndustryThemeInfo[]>([])
  const [selectedTheme, setSelectedTheme] = useState<string>('')
  const [success, setSuccess] = useState<string | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<WebsiteSection | null>(null)
  const [expandedSection, setExpandedSection] = useState<number | null>(null)

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
