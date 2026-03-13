'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Loader2, Plus, Trash2, ChevronUp, ChevronDown, Upload } from 'lucide-react'
import { educationApi, TopicCategory, OfferingType, uploadApi } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

type CurriculumLesson = {
  title: string
  description: string
  duration_min: number
  type: 'video' | 'text' | 'practice' | 'quiz'
}

type CurriculumSection = {
  section_title: string
  section_description: string
  lessons: CurriculumLesson[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const OFFERING_TYPES = [
  { value: 'course', label: 'Курс' },
  { value: 'guide', label: 'Матеріали / Гайд' },
  { value: 'consultation', label: 'Консультація' },
  { value: 'seminar', label: 'Семінар' },
  { value: 'masterclass', label: 'Майстер-клас' },
]

const LEVEL_OPTIONS = [
  { value: '', label: 'Не вказано' },
  { value: 'beginner', label: 'Початковий' },
  { value: 'intermediate', label: 'Середній' },
  { value: 'advanced', label: 'Просунутий' },
  { value: 'all', label: 'Для всіх' },
]

const LESSON_TYPES = [
  { value: 'video', label: 'Відео' },
  { value: 'text', label: 'Текст' },
  { value: 'practice', label: 'Практика' },
  { value: 'quiz', label: 'Тест' },
]

const TABS = ['Основне', 'Деталі', 'Програма', 'Ціна']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function flattenCats(cats: TopicCategory[], level = 0): { id: number; name: string; level: number }[] {
  return cats.flatMap(c => [
    { id: c.id, name: c.name, level },
    ...flattenCats(c.children || [], level + 1),
  ])
}

function typeBadgeClass(type: string) {
  if (type === 'course') return 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300'
  if (type === 'consultation') return 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300'
  return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
}

function typeLabel(type: string) {
  return OFFERING_TYPES.find(t => t.value === type)?.label || type
}

function levelLabel(level: string) {
  return LEVEL_OPTIONS.find(l => l.value === level)?.label || ''
}

// ─── Field wrapper ─────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EditOfferingPage() {
  const router = useRouter()
  const params = useParams()
  const id = Number(params.id)

  const [activeTab, setActiveTab] = useState(0)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [categories, setCategories] = useState<TopicCategory[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    title: '',
    type: 'course' as OfferingType,
    topic_category_id: null as number | null,
    description: '',
    short_description: '',
    cover_image_url: '',
    promo_video_url: '',
    content_url: '',
    price: '',
    is_digital: false,
    digital_file_url: '',
    prerequisites: '',
    duration_hours: '',
    is_active: true,
    level: '',
    language: 'uk',
    certificate_included: false,
    learning_outcomes: [] as string[],
    target_audience: '',
    what_includes: [] as string[],
    curriculum: [] as CurriculumSection[],
  })

  useEffect(() => {
    Promise.all([
      educationApi.getOffering(id),
      educationApi.getCategoriesTree(),
    ]).then(([offering, cats]) => {
      setCategories(cats)
      setForm({
        title: offering.title,
        type: offering.type,
        topic_category_id: offering.topic_category_id || null,
        description: offering.description || '',
        short_description: offering.short_description || '',
        cover_image_url: offering.cover_image_url || '',
        promo_video_url: offering.promo_video_url || '',
        content_url: offering.content_url || '',
        price: offering.price ? (offering.price / 100).toString() : '',
        is_digital: offering.is_digital,
        digital_file_url: offering.digital_file_url || '',
        prerequisites: offering.prerequisites || '',
        duration_hours: offering.duration_hours?.toString() || '',
        is_active: offering.is_active,
        level: (offering as any).level || '',
        language: (offering as any).language || 'uk',
        certificate_included: (offering as any).certificate_included || false,
        learning_outcomes: (offering as any).learning_outcomes || [],
        target_audience: (offering as any).target_audience || '',
        what_includes: (offering as any).what_includes || [],
        curriculum: (offering as any).curriculum || [],
      })
      setLoading(false)
    }).catch(() => {
      router.push('/education/admin/offerings')
    })
  }, [id, router])

  const flatCats = flattenCats(categories)
  const isCourseLike = form.type === 'course'
  const visibleTabs = isCourseLike ? TABS : TABS.filter(t => t !== 'Програма')

  // ── curriculum helpers
  const addSection = () =>
    setForm(f => ({ ...f, curriculum: [...f.curriculum, { section_title: '', section_description: '', lessons: [] }] }))

  const removeSection = (si: number) =>
    setForm(f => ({ ...f, curriculum: f.curriculum.filter((_, i) => i !== si) }))

  const updateSection = (si: number, patch: Partial<CurriculumSection>) =>
    setForm(f => ({ ...f, curriculum: f.curriculum.map((s, i) => i === si ? { ...s, ...patch } : s) }))

  const moveSection = (si: number, dir: -1 | 1) =>
    setForm(f => {
      const arr = [...f.curriculum]
      const to = si + dir
      if (to < 0 || to >= arr.length) return f
      ;[arr[si], arr[to]] = [arr[to], arr[si]]
      return { ...f, curriculum: arr }
    })

  const addLesson = (si: number) =>
    setForm(f => ({
      ...f,
      curriculum: f.curriculum.map((s, i) => i === si
        ? { ...s, lessons: [...s.lessons, { title: '', description: '', duration_min: 0, type: 'video' as const }] }
        : s),
    }))

  const removeLesson = (si: number, li: number) =>
    setForm(f => ({
      ...f,
      curriculum: f.curriculum.map((s, i) => i === si
        ? { ...s, lessons: s.lessons.filter((_, j) => j !== li) }
        : s),
    }))

  const updateLesson = (si: number, li: number, patch: Partial<CurriculumLesson>) =>
    setForm(f => ({
      ...f,
      curriculum: f.curriculum.map((s, i) => i === si
        ? { ...s, lessons: s.lessons.map((l, j) => j === li ? { ...l, ...patch } : l) }
        : s),
    }))

  // ── dynamic list helpers
  const updateListItem = (field: 'learning_outcomes' | 'what_includes', idx: number, val: string) =>
    setForm(f => ({ ...f, [field]: (f[field] as string[]).map((item, i) => i === idx ? val : item) }))

  const addListItem = (field: 'learning_outcomes' | 'what_includes') =>
    setForm(f => ({ ...f, [field]: [...(f[field] as string[]), ''] }))

  const removeListItem = (field: 'learning_outcomes' | 'what_includes', idx: number) =>
    setForm(f => ({ ...f, [field]: (f[field] as string[]).filter((_, i) => i !== idx) }))

  // ── image upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const result = await uploadApi.uploadOfferingCover(file)
      setForm(f => ({ ...f, cover_image_url: result.url }))
    } catch {
      alert('Помилка завантаження зображення')
    } finally {
      setUploading(false)
    }
  }

  // ── stats
  const totalSections = form.curriculum.length
  const totalLessons = form.curriculum.reduce((s, sec) => s + sec.lessons.length, 0)
  const totalMinutes = form.curriculum.reduce((s, sec) => s + sec.lessons.reduce((ls, l) => ls + (l.duration_min || 0), 0), 0)

  // ── submit
  async function handleSubmit() {
    if (!form.title.trim()) { setActiveTab(0); return }
    setSaving(true)
    try {
      await educationApi.updateOffering(id, {
        title: form.title,
        type: form.type,
        topic_category_id: form.topic_category_id,
        description: form.description || undefined,
        short_description: form.short_description || undefined,
        cover_image_url: form.cover_image_url || undefined,
        promo_video_url: form.promo_video_url || undefined,
        content_url: form.content_url || undefined,
        price: form.price ? Math.round(parseFloat(form.price) * 100) : 0,
        is_digital: form.is_digital,
        digital_file_url: form.digital_file_url || undefined,
        prerequisites: form.prerequisites || undefined,
        duration_hours: form.duration_hours ? parseInt(form.duration_hours) : undefined,
        level: form.level || undefined,
        language: form.language,
        certificate_included: form.certificate_included,
        learning_outcomes: form.learning_outcomes.filter(Boolean),
        target_audience: form.target_audience || undefined,
        what_includes: form.what_includes.filter(Boolean),
        curriculum: isCourseLike ? form.curriculum : [],
      } as any)
      router.push('/education/admin/offerings')
    } catch (err) {
      console.error('Failed to update offering:', err)
      alert('Помилка при оновленні')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const priceNum = parseFloat(form.price) || 0

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push('/education/admin/offerings')}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-semibold">Редагування продукту</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,360px] gap-6">
        {/* ── Left: tabbed form ── */}
        <div>
          {/* Tabs */}
          <div className="flex gap-0 border-b mb-6">
            {visibleTabs.map(label => {
              const idx = TABS.indexOf(label)
              return (
                <button
                  key={label}
                  onClick={() => setActiveTab(idx)}
                  className={`px-4 py-2 text-sm border-b-2 transition-colors -mb-px ${
                    activeTab === idx
                      ? 'border-violet-500 text-violet-600 font-medium'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>

          {/* ── Tab 0: Основне ── */}
          {activeTab === 0 && (
            <div className="space-y-5">
              <Field label="Тип продукту">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {OFFERING_TYPES.map(ot => (
                    <button
                      key={ot.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, type: ot.value as OfferingType }))}
                      className={`px-3 py-2 rounded-lg border-2 text-sm text-left transition-all ${
                        form.type === ot.value
                          ? 'border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300 font-medium'
                          : 'border-transparent bg-muted/40 text-foreground hover:border-muted-foreground/30'
                      }`}
                    >
                      {ot.label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Назва *">
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Наприклад: Курс з мікроблейдингу для початківців"
                  className="field"
                />
              </Field>

              <Field label="Категорія">
                <select
                  value={form.topic_category_id?.toString() || ''}
                  onChange={e => setForm(f => ({ ...f, topic_category_id: e.target.value ? parseInt(e.target.value) : null }))}
                  className="field"
                >
                  <option value="">Без категорії</option>
                  {flatCats.map(c => (
                    <option key={c.id} value={c.id}>{'  '.repeat(c.level)}{c.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="Короткий опис">
                <input
                  value={form.short_description}
                  onChange={e => setForm(f => ({ ...f, short_description: e.target.value }))}
                  placeholder="До 200 символів — для картки в каталозі"
                  maxLength={200}
                  className="field"
                />
              </Field>

              <Field label="Обкладинка">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                    >
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      Завантажити обкладинку
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </div>
                  <input
                    value={form.cover_image_url}
                    onChange={e => setForm(f => ({ ...f, cover_image_url: e.target.value }))}
                    placeholder="або вставте URL зображення"
                    className="field"
                  />
                  {form.cover_image_url && (
                    <img src={form.cover_image_url} alt="preview" className="h-24 w-auto rounded-lg object-cover border" />
                  )}
                </div>
              </Field>

              <Field label="Промо-відео (YouTube/Vimeo URL)">
                <input
                  value={form.promo_video_url}
                  onChange={e => setForm(f => ({ ...f, promo_video_url: e.target.value }))}
                  placeholder="https://youtube.com/watch?v=..."
                  className="field"
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Мова">
                  <select
                    value={form.language}
                    onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
                    className="field"
                  >
                    <option value="uk">Українська</option>
                    <option value="ru">Російська</option>
                    <option value="en">English</option>
                  </select>
                </Field>
                {isCourseLike && (
                  <Field label="Рівень">
                    <select
                      value={form.level}
                      onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
                      className="field"
                    >
                      {LEVEL_OPTIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                  </Field>
                )}
              </div>

              {isCourseLike && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.certificate_included}
                    onChange={e => setForm(f => ({ ...f, certificate_included: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Сертифікат включено</span>
                </label>
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm">Активний (видимий у каталозі)</span>
              </label>
            </div>
          )}

          {/* ── Tab 1: Деталі ── */}
          {activeTab === 1 && (
            <div className="space-y-5">
              <Field label="Повний опис">
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={5}
                  placeholder="Детальний опис продукту..."
                  className="field resize-none"
                />
              </Field>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Що ви навчитесь</p>
                {form.learning_outcomes.map((item, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={item}
                      onChange={e => updateListItem('learning_outcomes', i, e.target.value)}
                      placeholder={`Пункт ${i + 1}`}
                      className="field flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => removeListItem('learning_outcomes', i)}
                      className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addListItem('learning_outcomes')}
                  className="text-sm text-violet-600 hover:text-violet-700 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Додати
                </button>
              </div>

              <Field label="Для кого цей продукт">
                <textarea
                  value={form.target_audience}
                  onChange={e => setForm(f => ({ ...f, target_audience: e.target.value }))}
                  rows={3}
                  placeholder="Опишіть цільову аудиторію..."
                  className="field resize-none"
                />
              </Field>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Що включено</p>
                {form.what_includes.map((item, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={item}
                      onChange={e => updateListItem('what_includes', i, e.target.value)}
                      placeholder="Наприклад: Доступ на 12 місяців"
                      className="field flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => removeListItem('what_includes', i)}
                      className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addListItem('what_includes')}
                  className="text-sm text-violet-600 hover:text-violet-700 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Додати
                </button>
              </div>

              <Field label="Вимоги / Передумови">
                <textarea
                  value={form.prerequisites}
                  onChange={e => setForm(f => ({ ...f, prerequisites: e.target.value }))}
                  rows={3}
                  placeholder="Що потрібно знати перед записом..."
                  className="field resize-none"
                />
              </Field>
            </div>
          )}

          {/* ── Tab 2: Програма (course only) ── */}
          {activeTab === 2 && isCourseLike && (
            <div className="space-y-4">
              {totalLessons > 0 && (
                <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-4 py-2">
                  {totalSections} розділів · {totalLessons} уроків · {totalMinutes} хв
                </div>
              )}

              {form.curriculum.map((section, si) => (
                <div key={si} className="border rounded-xl p-4 mb-3 bg-muted/30">
                  {/* Section header */}
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      value={section.section_title}
                      onChange={e => updateSection(si, { section_title: e.target.value })}
                      placeholder={`Розділ ${si + 1}: назва`}
                      className="flex-1 text-sm font-medium bg-transparent border-b border-transparent focus:border-border focus:outline-none py-0.5"
                    />
                    <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                      <button
                        type="button"
                        onClick={() => moveSection(si, -1)}
                        disabled={si === 0}
                        className="p-1 hover:text-foreground transition-colors disabled:opacity-30"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSection(si, 1)}
                        disabled={si === form.curriculum.length - 1}
                        className="p-1 hover:text-foreground transition-colors disabled:opacity-30"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSection(si)}
                        className="p-1 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <input
                    value={section.section_description}
                    onChange={e => updateSection(si, { section_description: e.target.value })}
                    placeholder="Короткий опис розділу (необов'язково)"
                    className="field text-sm mb-3"
                  />

                  {/* Lessons */}
                  <div className="space-y-2">
                    {section.lessons.map((lesson, li) => (
                      <div key={li} className="grid grid-cols-[1fr,1fr,auto,auto,auto] gap-2 items-center bg-background rounded-lg px-3 py-2 border">
                        <input
                          value={lesson.title}
                          onChange={e => updateLesson(si, li, { title: e.target.value })}
                          placeholder="Назва уроку"
                          className="text-sm bg-transparent focus:outline-none min-w-0"
                        />
                        <input
                          value={lesson.description}
                          onChange={e => updateLesson(si, li, { description: e.target.value })}
                          placeholder="Опис"
                          className="text-sm bg-transparent focus:outline-none min-w-0"
                        />
                        <div className="flex items-center gap-1 w-20">
                          <input
                            type="number"
                            min={0}
                            value={lesson.duration_min || ''}
                            onChange={e => updateLesson(si, li, { duration_min: parseInt(e.target.value) || 0 })}
                            placeholder="0"
                            className="w-full text-xs text-right border rounded px-2 py-1 bg-background focus:outline-none"
                          />
                          <span className="text-xs text-muted-foreground shrink-0">хв</span>
                        </div>
                        <select
                          value={lesson.type}
                          onChange={e => updateLesson(si, li, { type: e.target.value as CurriculumLesson['type'] })}
                          className="w-28 text-xs border rounded px-2 py-1 bg-background focus:outline-none"
                        >
                          {LESSON_TYPES.map(lt => (
                            <option key={lt.value} value={lt.value}>{lt.label}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => removeLesson(si, li)}
                          className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => addLesson(si)}
                    className="mt-2 text-xs text-violet-600 hover:text-violet-700 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Додати урок
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addSection}
                className="w-full py-3 border-2 border-dashed border-violet-200 dark:border-violet-500/30 rounded-xl text-sm text-violet-600 hover:border-violet-400 hover:bg-violet-50/50 dark:hover:bg-violet-500/5 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Додати розділ
              </button>
            </div>
          )}

          {/* ── Tab 3: Ціна ── */}
          {activeTab === 3 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Ціна (₴) — 0 = безкоштовно">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="1500"
                    className="field"
                  />
                </Field>
                <Field label="Тривалість (годин)">
                  <input
                    type="number"
                    min="1"
                    value={form.duration_hours}
                    onChange={e => setForm(f => ({ ...f, duration_hours: e.target.value }))}
                    className="field"
                  />
                </Field>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_digital}
                  onChange={e => setForm(f => ({ ...f, is_digital: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm">Цифровий продукт (PDF, архів тощо)</span>
              </label>

              {form.is_digital && (
                <Field label="Пряме посилання на файл">
                  <input
                    value={form.digital_file_url}
                    onChange={e => setForm(f => ({ ...f, digital_file_url: e.target.value }))}
                    placeholder="https://drive.google.com/... або Dropbox link"
                    className="field"
                  />
                </Field>
              )}

              <Field label="Посилання на контент">
                <input
                  value={form.content_url}
                  onChange={e => setForm(f => ({ ...f, content_url: e.target.value }))}
                  placeholder="Google Doc, Notion, відеокурс..."
                  className="field"
                />
                <p className="text-xs text-muted-foreground mt-1">Буде доступне учасникам після оплати</p>
              </Field>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 mt-6 border-t">
            <button
              type="button"
              onClick={() => router.push('/education/admin/offerings')}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-muted transition-colors"
            >
              Скасувати
            </button>
            <div className="flex gap-2">
              {activeTab > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab(t => Math.max(0, t - 1))}
                  className="px-4 py-2 text-sm border rounded-lg hover:bg-muted transition-colors"
                >
                  ← Назад
                </button>
              )}
              {activeTab < visibleTabs.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setActiveTab(t => t + 1)}
                  className="px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                >
                  Далі →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving || !form.title.trim()}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Зберігаємо...' : 'Зберегти'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: live preview card ── */}
        <div className="lg:sticky lg:top-6 h-fit">
          <div className="border rounded-xl overflow-hidden bg-card shadow-sm">
            {/* Cover */}
            {form.cover_image_url ? (
              <img
                src={form.cover_image_url}
                alt="cover"
                className="w-full h-40 object-cover"
              />
            ) : (
              <div className="w-full h-40 bg-gradient-to-br from-violet-100 to-blue-100 dark:from-violet-900/30 dark:to-blue-900/30 flex items-center justify-center">
                <span className="text-3xl">🎓</span>
              </div>
            )}

            <div className="p-4 space-y-3">
              {/* Type badge */}
              <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${typeBadgeClass(form.type)}`}>
                {typeLabel(form.type)}
              </span>

              {/* Title */}
              <p className="font-semibold leading-snug">
                {form.title || <span className="text-muted-foreground italic">Назва продукту</span>}
              </p>

              {/* Short description */}
              {form.short_description && (
                <p className="text-sm text-muted-foreground leading-snug line-clamp-3">{form.short_description}</p>
              )}

              {/* Level & Duration */}
              <div className="flex flex-wrap gap-2">
                {form.level && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {levelLabel(form.level)}
                  </span>
                )}
                {form.duration_hours && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {form.duration_hours} год
                  </span>
                )}
              </div>

              {/* Price */}
              <p className={`text-xl font-bold ${priceNum === 0 ? 'text-green-600' : ''}`}>
                {form.price === '' ? '—' : priceNum === 0 ? 'Безкоштовно' : `₴${priceNum.toLocaleString('uk-UA')}`}
              </p>

              {/* What includes count */}
              {form.what_includes.filter(Boolean).length > 0 && (
                <p className="text-xs text-green-600 font-medium">
                  ✓ {form.what_includes.filter(Boolean).length} бонусів включено
                </p>
              )}

              {/* Curriculum summary */}
              {isCourseLike && totalSections > 0 && (
                <p className="text-xs text-muted-foreground">
                  {totalSections} розділів · {totalLessons} уроків
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
