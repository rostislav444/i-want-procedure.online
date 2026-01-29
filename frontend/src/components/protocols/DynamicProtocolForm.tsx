'use client'

import { useState, useEffect } from 'react'
import {
  Scan,
  Syringe,
  Clipboard,
  Heart,
  Star,
  MessageSquare,
  Activity,
  Pill,
  Sparkles,
  Sun,
  Droplets,
  ThermometerSun,
  Stethoscope,
  Camera,
  Plus,
  Trash2,
  Loader2,
  Wand2,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ProtocolTemplateSection,
  ProtocolTemplateField,
  ProtocolTemplate,
  ProtocolProduct,
  ProtocolProductCreate,
  ProtocolFile,
} from '@/lib/api'
import { ProtocolPhotoUpload } from './ProtocolPhotoUpload'

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  scan: Scan,
  syringe: Syringe,
  clipboard: Clipboard,
  heart: Heart,
  star: Star,
  message: MessageSquare,
  activity: Activity,
  pill: Pill,
  sparkles: Sparkles,
  sun: Sun,
  droplets: Droplets,
  thermometer: ThermometerSun,
  stethoscope: Stethoscope,
  camera: Camera,
  default: Clipboard,
}

// Color mapping for section backgrounds
const colorMap: Record<string, string> = {
  blue: 'from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 border-sky-100 dark:border-sky-900',
  violet: 'from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-violet-100 dark:border-violet-900',
  green: 'from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-emerald-100 dark:border-emerald-900',
  orange: 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-100 dark:border-amber-900',
  pink: 'from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30 border-pink-100 dark:border-pink-900',
  gray: 'from-slate-50 to-gray-50 dark:from-slate-950/30 dark:to-gray-950/30 border-slate-200 dark:border-slate-800',
  red: 'from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border-red-100 dark:border-red-900',
  yellow: 'from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 border-yellow-100 dark:border-yellow-900',
  cyan: 'from-cyan-50 to-teal-50 dark:from-cyan-950/30 dark:to-teal-950/30 border-cyan-100 dark:border-cyan-900',
}

const textColorMap: Record<string, string> = {
  blue: 'text-sky-700 dark:text-sky-400',
  violet: 'text-violet-700 dark:text-violet-400',
  green: 'text-emerald-700 dark:text-emerald-400',
  orange: 'text-amber-700 dark:text-amber-400',
  pink: 'text-pink-700 dark:text-pink-400',
  gray: 'text-slate-700 dark:text-slate-400',
  red: 'text-red-700 dark:text-red-400',
  yellow: 'text-yellow-700 dark:text-yellow-400',
  cyan: 'text-cyan-700 dark:text-cyan-400',
}

const chipColorMap: Record<string, string> = {
  blue: 'bg-sky-500',
  violet: 'bg-violet-500',
  green: 'bg-emerald-500',
  orange: 'bg-amber-500',
  pink: 'bg-pink-500',
  gray: 'bg-slate-500',
  red: 'bg-red-500',
  yellow: 'bg-yellow-500',
  cyan: 'bg-cyan-500',
}

interface DynamicProtocolFormProps {
  template: ProtocolTemplate | null
  data: Record<string, Record<string, unknown>>
  onChange: (sectionId: string, fieldId: string, value: unknown) => void
  onDataChange: (data: Record<string, Record<string, unknown>>) => void
  // Products support
  products?: ProtocolProduct[]
  onAddProduct?: (product: ProtocolProductCreate) => void
  onRemoveProduct?: (productId: number) => void
  canAddProducts?: boolean
  // Photos support
  beforePhotos?: ProtocolFile[]
  afterPhotos?: ProtocolFile[]
  onBeforePhotosChange?: (files: ProtocolFile[]) => void
  onAfterPhotosChange?: (files: ProtocolFile[]) => void
  // Loading state for AI generation
  isGenerating?: boolean
  onGenerateTemplate?: () => void
  serviceName?: string
}

export function DynamicProtocolForm({
  template,
  data,
  onChange,
  onDataChange,
  products = [],
  onAddProduct,
  onRemoveProduct,
  canAddProducts = false,
  beforePhotos = [],
  afterPhotos = [],
  onBeforePhotosChange,
  onAfterPhotosChange,
  isGenerating = false,
  onGenerateTemplate,
  serviceName,
}: DynamicProtocolFormProps) {
  const [newProduct, setNewProduct] = useState<ProtocolProductCreate>({
    name: '',
    manufacturer: '',
    quantity: '',
    batch_number: '',
  })

  // No template - show AI generation button
  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Wand2 className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Шаблон протоколу не знайдено</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          {serviceName
            ? `Для послуги "${serviceName}" ще немає шаблону протоколу. Згенеруйте його за допомогою ШІ.`
            : 'Для цієї послуги ще немає шаблону протоколу.'}
        </p>
        {onGenerateTemplate && (
          <Button onClick={onGenerateTemplate} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Генерація...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Згенерувати шаблон
              </>
            )}
          </Button>
        )}
      </div>
    )
  }

  const getValue = (sectionId: string, fieldId: string): unknown => {
    return data[sectionId]?.[fieldId]
  }

  const handleChange = (sectionId: string, fieldId: string, value: unknown) => {
    const newData = {
      ...data,
      [sectionId]: {
        ...data[sectionId],
        [fieldId]: value,
      },
    }
    onDataChange(newData)
    onChange(sectionId, fieldId, value)
  }

  const renderField = (section: ProtocolTemplateSection, field: ProtocolTemplateField) => {
    const value = getValue(section.id, field.id)
    const color = section.color || 'gray'

    switch (field.type) {
      case 'text':
        return (
          <Input
            placeholder={field.placeholder || field.label}
            value={(value as string) || ''}
            onChange={(e) => handleChange(section.id, field.id, e.target.value)}
            className="bg-white dark:bg-gray-800"
          />
        )

      case 'textarea':
        return (
          <Textarea
            placeholder={field.placeholder || field.label}
            value={(value as string) || ''}
            onChange={(e) => handleChange(section.id, field.id, e.target.value)}
            rows={3}
            className="bg-white dark:bg-gray-800"
          />
        )

      case 'chips':
        return (
          <div className="flex flex-wrap gap-2">
            {field.options?.map((option) => {
              const isSelected = value === option
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleChange(section.id, field.id, isSelected ? '' : option)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    isSelected
                      ? `${chipColorMap[color] || 'bg-primary'} text-white`
                      : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border'
                  }`}
                >
                  {option}
                </button>
              )
            })}
          </div>
        )

      case 'chips_multi':
        const selectedArray = (value as string[]) || []
        return (
          <div className="flex flex-wrap gap-2">
            {field.options?.map((option) => {
              const isSelected = selectedArray.includes(option)
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    const newValue = isSelected
                      ? selectedArray.filter((v) => v !== option)
                      : [...selectedArray, option]
                    handleChange(section.id, field.id, newValue)
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    isSelected
                      ? `${chipColorMap[color] || 'bg-primary'} text-white`
                      : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border'
                  }`}
                >
                  {option}
                </button>
              )
            })}
          </div>
        )

      case 'rating':
        const max = field.max || 5
        const ratingValue = (value as number) || 0
        return (
          <div className="flex gap-1">
            {Array.from({ length: max }, (_, i) => i + 1).map((rating) => {
              const isSelected = ratingValue === rating
              // Color based on rating value for 10-scale
              let ratingColor = chipColorMap[color] || 'bg-primary'
              if (max === 10) {
                if (rating <= 3) ratingColor = 'bg-red-500'
                else if (rating <= 6) ratingColor = 'bg-amber-500'
                else ratingColor = 'bg-emerald-500'
              }
              return (
                <button
                  key={rating}
                  type="button"
                  onClick={() => handleChange(section.id, field.id, rating)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                    isSelected
                      ? `${ratingColor} text-white`
                      : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border'
                  }`}
                >
                  {rating}
                </button>
              )
            })}
          </div>
        )

      case 'number':
        return (
          <Input
            type="number"
            placeholder={field.placeholder || field.label}
            value={(value as number) ?? ''}
            onChange={(e) => handleChange(section.id, field.id, e.target.value ? Number(e.target.value) : null)}
            min={field.min}
            max={field.max}
            step={field.step}
            className="bg-white dark:bg-gray-800 w-32"
          />
        )

      case 'select':
        return (
          <Select
            value={(value as string) || ''}
            onValueChange={(v) => handleChange(section.id, field.id, v)}
          >
            <SelectTrigger className="bg-white dark:bg-gray-800">
              <SelectValue placeholder={field.placeholder || `Оберіть ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'checkbox':
        return (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={(value as boolean) || false}
              onCheckedChange={(checked) => handleChange(section.id, field.id, checked)}
            />
            <span className="text-sm">{field.label}</span>
          </div>
        )

      case 'products':
        // Special products field - render products list and add form
        return (
          <div className="space-y-3">
            {products.length > 0 && (
              <div className="space-y-2">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border"
                  >
                    <Syringe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 grid grid-cols-4 gap-2 text-sm">
                      <span className="font-medium">{product.name}</span>
                      <span className="text-muted-foreground">{product.manufacturer || '—'}</span>
                      <span className="text-muted-foreground">{product.quantity || '—'}</span>
                      <span className="text-muted-foreground text-xs">{product.batch_number || '—'}</span>
                    </div>
                    {onRemoveProduct && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => onRemoveProduct(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {canAddProducts && onAddProduct ? (
              <div className="grid grid-cols-5 gap-2">
                <Input
                  placeholder="Назва"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="bg-white dark:bg-gray-800"
                />
                <Input
                  placeholder="Виробник"
                  value={newProduct.manufacturer}
                  onChange={(e) => setNewProduct({ ...newProduct, manufacturer: e.target.value })}
                  className="bg-white dark:bg-gray-800"
                />
                <Input
                  placeholder="Кількість"
                  value={newProduct.quantity}
                  onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
                  className="bg-white dark:bg-gray-800"
                />
                <Input
                  placeholder="Серія"
                  value={newProduct.batch_number}
                  onChange={(e) => setNewProduct({ ...newProduct, batch_number: e.target.value })}
                  className="bg-white dark:bg-gray-800"
                />
                <Button
                  onClick={() => {
                    if (newProduct.name.trim()) {
                      onAddProduct(newProduct)
                      setNewProduct({ name: '', manufacturer: '', quantity: '', batch_number: '' })
                    }
                  }}
                  disabled={!newProduct.name.trim()}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Додати
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">
                Збережіть протокол, щоб додати препарати
              </p>
            )}
          </div>
        )

      case 'photos':
        // Photo upload section with before/after
        return (
          <div className="grid md:grid-cols-2 gap-6">
            <ProtocolPhotoUpload
              fileType="before"
              files={beforePhotos}
              onFilesChange={onBeforePhotosChange || (() => {})}
              label="Фото до процедури"
              maxFiles={10}
            />
            <ProtocolPhotoUpload
              fileType="after"
              files={afterPhotos}
              onFilesChange={onAfterPhotosChange || (() => {})}
              label="Фото після процедури"
              maxFiles={10}
            />
          </div>
        )

      default:
        return (
          <Input
            placeholder={field.placeholder || field.label}
            value={(value as string) || ''}
            onChange={(e) => handleChange(section.id, field.id, e.target.value)}
            className="bg-white dark:bg-gray-800"
          />
        )
    }
  }

  // Track if photos section has been rendered (to avoid duplicates)
  let photosRendered = false

  return (
    <div className="space-y-6">
      {template.sections.map((section) => {
        const IconComponent = iconMap[section.icon || 'default'] || iconMap.default
        const bgColor = colorMap[section.color || 'gray'] || colorMap.gray
        const txtColor = textColorMap[section.color || 'gray'] || textColorMap.gray

        // Filter out duplicate photos fields
        const filteredFields = section.fields.filter((field) => {
          if (field.type === 'photos') {
            if (photosRendered) return false
            photosRendered = true
          }
          return true
        })

        // Skip section if all fields were filtered out
        if (filteredFields.length === 0) return null

        return (
          <div
            key={section.id}
            className={`space-y-4 p-4 rounded-xl bg-gradient-to-br ${bgColor} border`}
          >
            <div className={`flex items-center gap-2 ${txtColor}`}>
              <IconComponent className="h-5 w-5" />
              <h3 className="font-semibold">{section.title}</h3>
            </div>

            {filteredFields.map((field) => (
              <div key={field.id} className="space-y-2">
                {field.type !== 'checkbox' && field.type !== 'products' && field.type !== 'photos' && (
                  <Label className="text-sm text-muted-foreground">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                )}
                {renderField(section, field)}
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
