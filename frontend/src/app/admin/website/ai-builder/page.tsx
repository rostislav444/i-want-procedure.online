'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  Download,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Wand2,
  Code,
  Eye,
  ImageIcon,
  X,
  Plus,
  Save,
  History,
  MessageSquare,
  CheckCircle,
  Trash2,
  ZoomIn,
} from 'lucide-react'
import { sectionTemplatesApi, companyApi, Company, LandingVersionListItem } from '@/lib/api'

interface ReferenceImage {
  file: File
  preview: string
}

export default function AISiteBuilderPage() {
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null)
  const [tokensUsed, setTokensUsed] = useState(0)
  const [copied, setCopied] = useState(false)
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Form state
  const [companyName, setCompanyName] = useState('')
  const [prompt, setPrompt] = useState('')
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([])
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  // Version history
  const [versions, setVersions] = useState<LandingVersionListItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [loadingVersions, setLoadingVersions] = useState(false)
  const [activeVersionId, setActiveVersionId] = useState<number | null>(null)
  const [editingNotesId, setEditingNotesId] = useState<number | null>(null)
  const [notesValue, setNotesValue] = useState('')

  // Improvement mode - when editing based on existing version
  const [baseVersionHtml, setBaseVersionHtml] = useState<string | null>(null)
  const [corrections, setCorrections] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadCompany()
    loadVersions()
  }, [])

  // Global paste handler
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) {
            addImage(file)
          }
          break
        }
      }
    }

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [])

  const addImage = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      setReferenceImages(prev => [...prev, {
        file,
        preview: e.target?.result as string
      }])
    }
    reader.readAsDataURL(file)
  }

  const removeImage = (index: number) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index))
  }

  const loadCompany = async () => {
    try {
      const data = await companyApi.getMyCompany()
      setCompany(data)
      setCompanyName(data.name || '')
    } catch (error) {
      console.error('Failed to load company:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadVersions = async () => {
    setLoadingVersions(true)
    try {
      const data = await sectionTemplatesApi.listVersions()
      setVersions(data)
      const active = data.find(v => v.is_active)
      if (active) {
        setActiveVersionId(active.id)
      }
    } catch (error) {
      console.error('Failed to load versions:', error)
    } finally {
      setLoadingVersions(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      Array.from(files).forEach(file => addImage(file))
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleGenerate = async () => {
    if (!companyName.trim()) {
      alert('Введіть назву компанії')
      return
    }

    if (baseVersionHtml && !corrections.trim()) {
      alert('Введіть замічання для покращення')
      return
    }

    setGenerating(true)
    setGeneratedHtml(null)

    try {
      let result

      if (referenceImages.length > 0) {
        // Always use 'copy' mode with auto-cropping for best results
        result = await sectionTemplatesApi.generateFullSiteFromImage(
          referenceImages.map(img => img.file),
          companyName,
          prompt,
          'copy',  // Always use copy mode with new cropping approach
          true     // auto_crop enabled
        )
      } else if (baseVersionHtml && corrections.trim()) {
        result = await sectionTemplatesApi.improveSite({
          company_name: companyName,
          current_html: baseVersionHtml,
          corrections: corrections,
        })
        setBaseVersionHtml(null)
        setCorrections('')
      } else {
        result = await sectionTemplatesApi.generateFullSite({
          company_name: companyName,
          description: prompt || `Сучасний бізнес ${companyName}`,
          additional_instructions: prompt,
        })
      }

      setGeneratedHtml(result.html)
      setTokensUsed(result.estimated_tokens)
    } catch (error: unknown) {
      console.error('Generation failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Невідома помилка'
      alert(`Помилка генерації: ${errorMessage}`)
    } finally {
      setGenerating(false)
    }
  }

  const handleClearImprovement = () => {
    setBaseVersionHtml(null)
    setCorrections('')
  }

  const handleCopyCode = () => {
    if (generatedHtml) {
      navigator.clipboard.writeText(generatedHtml)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = () => {
    if (generatedHtml) {
      const blob = new Blob([generatedHtml], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${companyName.replace(/\s+/g, '-').toLowerCase()}-landing.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const handleOpenInNewTab = () => {
    if (generatedHtml) {
      const blob = new Blob([generatedHtml], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    }
  }

  const handleSave = async () => {
    if (!generatedHtml) return

    setSaving(true)
    try {
      // Prepare reference images for saving (use preview which is base64 data URL)
      const referenceImagesData = referenceImages.length > 0
        ? referenceImages.map(img => ({
            data: img.preview,  // data URL like "data:image/png;base64,..."
            media_type: img.file.type || 'image/png',
            name: img.file.name,
          }))
        : undefined

      const result = await sectionTemplatesApi.saveLanding({
        html: generatedHtml,
        prompt: prompt || undefined,
        had_reference_image: referenceImages.length > 0,
        reference_images: referenceImagesData,
      })
      setSaved(true)
      setActiveVersionId(result.version_id)
      setTimeout(() => setSaved(false), 3000)
      loadVersions()
    } catch (error) {
      console.error('Save failed:', error)
      alert('Помилка збереження')
    } finally {
      setSaving(false)
    }
  }

  const handleLoadVersion = async (versionId: number) => {
    try {
      const version = await sectionTemplatesApi.getVersion(versionId)
      setGeneratedHtml(version.html)
      setBaseVersionHtml(version.html)
      setCorrections(version.notes || '')
      if (version.prompt) {
        setPrompt(version.prompt)
      }
      // Load reference images if they exist
      if (version.reference_images && version.reference_images.length > 0) {
        const loadedImages: ReferenceImage[] = version.reference_images.map((img, idx) => ({
          // Create a minimal placeholder File (not used for upload, just for type compatibility)
          file: new File([], img.name || `reference_${idx}.jpg`, { type: img.media_type || 'image/jpeg' }),
          preview: img.data,  // The base64 data URL
        }))
        setReferenceImages(loadedImages)
      } else {
        setReferenceImages([])
      }
      setShowHistory(false)
    } catch (error) {
      console.error('Failed to load version:', error)
      alert('Помилка завантаження версії')
    }
  }

  const handleActivateVersion = async (versionId: number) => {
    try {
      await sectionTemplatesApi.activateVersion(versionId)
      setActiveVersionId(versionId)
      loadVersions()
    } catch (error) {
      console.error('Failed to activate version:', error)
      alert('Помилка активації версії')
    }
  }

  const handleStartEditNotes = (version: LandingVersionListItem) => {
    setEditingNotesId(version.id)
    setNotesValue(version.notes || '')
  }

  const handleSaveNotes = async (versionId: number) => {
    try {
      await sectionTemplatesApi.updateVersionNotes(versionId, notesValue)
      setEditingNotesId(null)
      loadVersions()
    } catch (error) {
      console.error('Failed to save notes:', error)
      alert('Помилка збереження нотаток')
    }
  }

  const handleDeleteVersion = async (versionId: number) => {
    if (!confirm('Видалити цю версію?')) return

    try {
      await sectionTemplatesApi.deleteVersion(versionId)
      loadVersions()
      if (activeVersionId === versionId) {
        setActiveVersionId(null)
      }
    } catch (error) {
      console.error('Failed to delete version:', error)
      alert('Помилка видалення версії')
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/website">
            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wand2 className="w-6 h-6 text-purple-500" />
            AI Генератор
          </h1>
          {tokensUsed > 0 && (
            <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
              ~{tokensUsed.toLocaleString()} токенів
            </span>
          )}
        </div>
        <button
          onClick={() => setShowHistory(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-600 transition-colors"
        >
          <History className="w-5 h-5" />
          <span>Історія</span>
          {versions.length > 0 && (
            <span className="bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 text-xs px-2 py-0.5 rounded-full">
              {versions.length}
            </span>
          )}
        </button>
      </div>

      <div>
        {/* Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
          <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_auto] gap-4 items-start">
            {/* Left column: Name + References */}
            <div className="space-y-3">
              {/* Company Name */}
              <div>
                <label className="block text-xs font-medium mb-1.5 text-gray-500 dark:text-gray-400">
                  Назва
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  placeholder="Beauty Studio"
                />
              </div>

              {/* Reference Images */}
              <div>
                <label className="block text-xs font-medium mb-1.5 text-gray-500 dark:text-gray-400">
                  Референси
                </label>
                <div className="flex flex-wrap gap-2">
                  {referenceImages.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative group w-12 h-12 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 cursor-pointer"
                      onClick={() => setPreviewImage(img.preview)}
                    >
                      <img src={img.preview} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ZoomIn className="w-4 h-4 text-white" />
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeImage(idx) }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-12 h-12 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 transition-colors flex items-center justify-center text-gray-400 hover:text-purple-500"
                    title="Додати картинку (або Ctrl+V)"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Ctrl+V щоб вставити</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

            </div>

            {/* Middle: Description textarea */}
            <div className="h-full">
              <div className="flex items-center justify-between mb-1.5">
                <label className={`block text-xs font-medium ${baseVersionHtml ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  {baseVersionHtml ? 'Правки до попереднього дизайну' : 'Опис сайту'}
                </label>
                {baseVersionHtml && (
                  <button
                    onClick={handleClearImprovement}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                  >
                    Скасувати
                  </button>
                )}
              </div>
              <textarea
                value={baseVersionHtml ? corrections : prompt}
                onChange={(e) => baseVersionHtml ? setCorrections(e.target.value) : setPrompt(e.target.value)}
                rows={4}
                className={`w-full h-[calc(100%-24px)] min-h-[120px] px-3 py-2 rounded-lg border bg-white dark:bg-gray-900 focus:ring-2 focus:border-transparent resize-none text-sm ${
                  baseVersionHtml
                    ? 'border-amber-300 dark:border-amber-700 focus:ring-amber-500'
                    : 'border-gray-200 dark:border-gray-700 focus:ring-purple-500'
                }`}
                placeholder={baseVersionHtml
                  ? 'Змінити колір на синій, додати відгуки, зробити кнопки більшими...'
                  : 'Косметологічна клиніка "Аврора". Придумай услуги...'
                }
              />
            </div>

            {/* Right: Generate Button */}
            <div className="flex items-end h-full">
              <button
                onClick={handleGenerate}
                disabled={generating || !companyName.trim() || (!!baseVersionHtml && !corrections.trim())}
                className={`h-10 px-6 rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${
                  baseVersionHtml
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700'
                    : 'bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700'
                }`}
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{baseVersionHtml ? 'Покращую...' : 'Генерую...'}</span>
                  </>
                ) : baseVersionHtml ? (
                  <>
                    <Wand2 className="w-5 h-5" />
                    <span>Покращити</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Згенерувати</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Preview Area */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {generatedHtml ? (
            <>
              {/* Preview Controls */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('preview')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      viewMode === 'preview'
                        ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    Превью
                  </button>
                  <button
                    onClick={() => setViewMode('code')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      viewMode === 'code'
                        ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <Code className="w-4 h-4" />
                    Код
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                    title="Перегенерувати"
                  >
                    <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={handleCopyCode}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Копіювати код"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Завантажити"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleOpenInNewTab}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Відкрити в новій вкладці"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : saved ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {saved ? 'Збережено!' : 'Зберегти'}
                  </button>
                </div>
              </div>

              {/* Preview Content */}
              <div className="h-[600px]">
                {viewMode === 'preview' ? (
                  <iframe
                    srcDoc={generatedHtml}
                    className="w-full h-full border-0"
                    title="Generated Site Preview"
                  />
                ) : (
                  <div className="relative h-full">
                    <button
                      onClick={handleCopyCode}
                      className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors z-10"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Скопійовано' : 'Копіювати'}
                    </button>
                    <pre className="h-full overflow-auto p-6 bg-gray-900 text-gray-100 text-sm font-mono">
                      <code>{generatedHtml}</code>
                    </pre>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center py-32">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-purple-500" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Готові створити сайт?</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Вставте картинки (Ctrl+V) або опишіть бажаний дизайн
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* History Drawer */}
      {showHistory && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-30"
            onClick={() => setShowHistory(false)}
          />

          {/* Drawer */}
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl z-40 flex flex-col">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <History className="w-5 h-5 text-purple-500" />
                Історія генерацій
              </h2>
              <button
                onClick={() => setShowHistory(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingVersions ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                </div>
              ) : versions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Ще немає версій</p>
                  <p className="text-sm mt-1">Згенеруйте та збережіть сайт</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      className={`p-4 rounded-xl border transition-all ${
                        version.is_active
                          ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      {/* Version Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {formatDate(version.created_at)}
                          </span>
                          {version.is_active && (
                            <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-2 py-0.5 rounded-full">
                              <CheckCircle className="w-3 h-3" />
                              Активна
                            </span>
                          )}
                        </div>
                        {(version.has_reference_images || version.had_reference_image) && (
                          <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            version.has_reference_images
                              ? 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/40'
                              : 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700'
                          }`}>
                            <ImageIcon className="w-3 h-3" />
                            {version.has_reference_images ? 'Референс' : 'Був референс'}
                          </span>
                        )}
                      </div>

                      {/* Prompt */}
                      {version.prompt && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                          {version.prompt}
                        </p>
                      )}

                      {/* Notes */}
                      {editingNotesId === version.id ? (
                        <div className="mb-3">
                          <textarea
                            value={notesValue}
                            onChange={(e) => setNotesValue(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-purple-500"
                            rows={2}
                            placeholder="Замічання для наступної генерації..."
                            autoFocus
                          />
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleSaveNotes(version.id)}
                              className="px-3 py-1 text-xs bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                            >
                              Зберегти
                            </button>
                            <button
                              onClick={() => setEditingNotesId(null)}
                              className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                            >
                              Скасувати
                            </button>
                          </div>
                        </div>
                      ) : version.notes ? (
                        <div
                          onClick={() => handleStartEditNotes(version)}
                          className="mb-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm text-amber-800 dark:text-amber-200 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/30"
                        >
                          <MessageSquare className="w-3 h-3 inline mr-1" />
                          {version.notes}
                        </div>
                      ) : null}

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleLoadVersion(version.id)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          Вибрати
                        </button>
                        {!version.is_active && (
                          <button
                            onClick={() => handleActivateVersion(version.id)}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Активувати
                          </button>
                        )}
                        <button
                          onClick={() => handleStartEditNotes(version)}
                          className="p-2 text-gray-500 hover:text-purple-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Замічання"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteVersion(version.id)}
                          className="p-2 text-gray-500 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Видалити"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
