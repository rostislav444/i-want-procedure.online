'use client'

import { useState, useEffect } from 'react'
import {
  ClipboardList,
  Plus,
  Trash2,
  Wand2,
  Loader2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Save,
  Copy,
  Check,
  AlertCircle,
  Scan,
  Syringe,
  Heart,
  Star,
  MessageSquare,
  Activity,
  Pill,
  Stethoscope,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  ProtocolTemplate,
  ProtocolTemplateSection,
  ProtocolTemplateField,
  ProtocolFieldType,
  protocolTemplatesApi,
} from '@/lib/api'

const FIELD_TYPES: { value: ProtocolFieldType; label: string }[] = [
  { value: 'text', label: 'Текст (1 рядок)' },
  { value: 'textarea', label: 'Текст (кілька рядків)' },
  { value: 'chips', label: 'Вибір одного (чіпси)' },
  { value: 'chips_multi', label: 'Вибір кількох (чіпси)' },
  { value: 'rating', label: 'Рейтинг (числовий)' },
  { value: 'number', label: 'Число' },
  { value: 'select', label: 'Випадаючий список' },
  { value: 'checkbox', label: 'Прапорець (так/ні)' },
  { value: 'products', label: 'Препарати (спеціальний)' },
]

const SECTION_COLORS = [
  { value: 'blue', label: 'Синій' },
  { value: 'violet', label: 'Фіолетовий' },
  { value: 'green', label: 'Зелений' },
  { value: 'orange', label: 'Помаранчевий' },
  { value: 'pink', label: 'Рожевий' },
  { value: 'gray', label: 'Сірий' },
  { value: 'red', label: 'Червоний' },
  { value: 'cyan', label: 'Бірюзовий' },
]

const SECTION_ICONS = [
  { value: 'scan', label: 'Сканування' },
  { value: 'syringe', label: 'Шприц' },
  { value: 'clipboard', label: 'Буфер обміну' },
  { value: 'heart', label: 'Серце' },
  { value: 'star', label: 'Зірка' },
  { value: 'message', label: 'Повідомлення' },
  { value: 'activity', label: 'Активність' },
  { value: 'pill', label: 'Таблетка' },
  { value: 'stethoscope', label: 'Стетоскоп' },
]

// Icon component mapping
const ICON_COMPONENTS: Record<string, LucideIcon> = {
  scan: Scan,
  syringe: Syringe,
  clipboard: ClipboardList,
  heart: Heart,
  star: Star,
  message: MessageSquare,
  activity: Activity,
  pill: Pill,
  stethoscope: Stethoscope,
}

// Color classes for section backgrounds and icons
const COLOR_CLASSES: Record<string, { bg: string; icon: string; border: string; inputBorder: string; focusBorder: string }> = {
  blue: { bg: 'bg-blue-50 dark:bg-blue-950/30', icon: 'text-blue-500', border: 'border-blue-200 dark:border-blue-800', inputBorder: 'border-blue-300 dark:border-blue-700', focusBorder: 'focus:border-blue-500 focus-visible:border-blue-500' },
  violet: { bg: 'bg-violet-50 dark:bg-violet-950/30', icon: 'text-violet-500', border: 'border-violet-200 dark:border-violet-800', inputBorder: 'border-violet-300 dark:border-violet-700', focusBorder: 'focus:border-violet-500 focus-visible:border-violet-500' },
  green: { bg: 'bg-green-50 dark:bg-green-950/30', icon: 'text-green-500', border: 'border-green-200 dark:border-green-800', inputBorder: 'border-green-300 dark:border-green-700', focusBorder: 'focus:border-green-500 focus-visible:border-green-500' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-950/30', icon: 'text-orange-500', border: 'border-orange-200 dark:border-orange-800', inputBorder: 'border-orange-300 dark:border-orange-700', focusBorder: 'focus:border-orange-500 focus-visible:border-orange-500' },
  pink: { bg: 'bg-pink-50 dark:bg-pink-950/30', icon: 'text-pink-500', border: 'border-pink-200 dark:border-pink-800', inputBorder: 'border-pink-300 dark:border-pink-700', focusBorder: 'focus:border-pink-500 focus-visible:border-pink-500' },
  gray: { bg: 'bg-gray-50 dark:bg-gray-900/50', icon: 'text-gray-500', border: 'border-gray-200 dark:border-gray-700', inputBorder: 'border-gray-300 dark:border-gray-600', focusBorder: 'focus:border-gray-500 focus-visible:border-gray-500' },
  red: { bg: 'bg-red-50 dark:bg-red-950/30', icon: 'text-red-500', border: 'border-red-200 dark:border-red-800', inputBorder: 'border-red-300 dark:border-red-700', focusBorder: 'focus:border-red-500 focus-visible:border-red-500' },
  cyan: { bg: 'bg-cyan-50 dark:bg-cyan-950/30', icon: 'text-cyan-500', border: 'border-cyan-200 dark:border-cyan-800', inputBorder: 'border-cyan-300 dark:border-cyan-700', focusBorder: 'focus:border-cyan-500 focus-visible:border-cyan-500' },
}

interface ProtocolTemplateEditorProps {
  serviceId: number
  serviceName: string
  categoryName?: string
}

export function ProtocolTemplateEditor({
  serviceId,
  serviceName,
  categoryName,
}: ProtocolTemplateEditorProps) {
  const [template, setTemplate] = useState<ProtocolTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

  // Local editing state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [sections, setSections] = useState<ProtocolTemplateSection[]>([])
  const [expandedSections, setExpandedSections] = useState<string[]>([])

  useEffect(() => {
    loadTemplate()
  }, [serviceId])

  const loadTemplate = async () => {
    setLoading(true)
    try {
      const tmpl = await protocolTemplatesApi.getForService(serviceId)
      if (tmpl) {
        setTemplate(tmpl)
        setName(tmpl.name)
        setDescription(tmpl.description || '')
        setSections(tmpl.sections)
      }
    } catch (err) {
      console.error('Error loading template:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const result = await protocolTemplatesApi.generate({
        service_name: serviceName,
        category_name: categoryName,
      })

      // Create template from generated data
      const newTemplate = await protocolTemplatesApi.create({
        name: result.name,
        description: result.description,
        sections: result.sections,
        service_id: serviceId,
        tags: result.suggested_tags,
      })

      setTemplate(newTemplate)
      setName(newTemplate.name)
      setDescription(newTemplate.description || '')
      setSections(newTemplate.sections)
      setExpandedSections(newTemplate.sections.map(s => s.id))
    } catch (err) {
      console.error('Error generating template:', err)
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!template) return

    setSaving(true)
    setSaveStatus('idle')
    try {
      const updated = await protocolTemplatesApi.update(template.id, {
        name,
        description,
        sections,
      })
      setTemplate(updated)
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err) {
      console.error('Error saving template:', err)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 5000)
    } finally {
      setSaving(false)
    }
  }

  const addSection = () => {
    const newSection: ProtocolTemplateSection = {
      id: `section_${Date.now()}`,
      title: 'Нова секція',
      icon: 'clipboard',
      color: 'gray',
      fields: [],
    }
    setSections([...sections, newSection])
    setExpandedSections([...expandedSections, newSection.id])
  }

  const removeSection = (sectionId: string) => {
    setSections(sections.filter(s => s.id !== sectionId))
  }

  const updateSection = (sectionId: string, updates: Partial<ProtocolTemplateSection>) => {
    setSections(sections.map(s =>
      s.id === sectionId ? { ...s, ...updates } : s
    ))
  }

  const addField = (sectionId: string) => {
    const newField: ProtocolTemplateField = {
      id: `field_${Date.now()}`,
      type: 'text',
      label: 'Нове поле',
    }
    setSections(sections.map(s =>
      s.id === sectionId ? { ...s, fields: [...s.fields, newField] } : s
    ))
  }

  const removeField = (sectionId: string, fieldId: string) => {
    setSections(sections.map(s =>
      s.id === sectionId
        ? { ...s, fields: s.fields.filter(f => f.id !== fieldId) }
        : s
    ))
  }

  const updateField = (sectionId: string, fieldId: string, updates: Partial<ProtocolTemplateField>) => {
    setSections(sections.map(s =>
      s.id === sectionId
        ? {
            ...s,
            fields: s.fields.map(f =>
              f.id === fieldId ? { ...f, ...updates } : f
            ),
          }
        : s
    ))
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!template) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Шаблон протоколу
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Wand2 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Шаблон не створено</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Для цієї послуги ще немає шаблону протоколу. Згенеруйте його за допомогою ШІ.
            </p>
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? (
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
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Шаблон протоколу
        </CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            Перегенерувати
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            variant={saveStatus === 'success' ? 'outline' : saveStatus === 'error' ? 'destructive' : 'default'}
            className={saveStatus === 'success' ? 'border-green-500 text-green-600' : ''}
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : saveStatus === 'success' ? (
              <Check className="mr-2 h-4 w-4" />
            ) : saveStatus === 'error' ? (
              <AlertCircle className="mr-2 h-4 w-4" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {saveStatus === 'success' ? 'Збережено' : saveStatus === 'error' ? 'Помилка' : 'Зберегти'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Template info */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Назва шаблону</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Назва шаблону"
            />
          </div>
          <div className="space-y-2">
            <Label>Опис</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Короткий опис"
            />
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Секції ({sections.length})</h4>
            <Button variant="outline" size="sm" onClick={addSection}>
              <Plus className="mr-1 h-4 w-4" />
              Додати секцію
            </Button>
          </div>

          <Accordion
            type="multiple"
            value={expandedSections}
            onValueChange={setExpandedSections}
            className="space-y-2"
          >
            {sections.map((section, sectionIndex) => {
              const colorClasses = COLOR_CLASSES[section.color || 'gray']
              const IconComponent = ICON_COMPONENTS[section.icon || 'clipboard'] || ClipboardList
              return (
              <AccordionItem
                key={section.id}
                value={section.id}
                className={`border rounded-lg overflow-hidden ${colorClasses.border}`}
              >
                <AccordionTrigger className={`px-4 hover:no-underline ${colorClasses.bg}`}>
                  <div className="flex items-center gap-3 flex-1">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span className={`w-7 h-7 rounded-lg ${colorClasses.bg} border ${colorClasses.border} flex items-center justify-center`}>
                      <IconComponent className={`h-4 w-4 ${colorClasses.icon}`} />
                    </span>
                    <span className="font-medium">{section.title}</span>
                    <span className="text-sm text-muted-foreground">
                      ({section.fields.length} полів)
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className={`px-4 pb-4 ${colorClasses.bg}`}>
                  <div className="space-y-4">
                    {/* Section settings */}
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Назва</Label>
                        <Input
                          value={section.title}
                          onChange={(e) => updateSection(section.id, { title: e.target.value })}
                          placeholder="Назва секції"
                          className={`bg-white dark:bg-gray-950 ${colorClasses.inputBorder} focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 ${colorClasses.focusBorder}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Колір</Label>
                        <Select
                          value={section.color || 'gray'}
                          onValueChange={(v) => updateSection(section.id, { color: v })}
                        >
                          <SelectTrigger className={`bg-white dark:bg-gray-950 ${colorClasses.inputBorder} focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 ${colorClasses.focusBorder}`}>
                            <div className="flex items-center gap-2">
                              <span className={`w-4 h-4 rounded-full ${COLOR_CLASSES[section.color || 'gray'].icon.replace('text-', 'bg-')}`} />
                              <span>{SECTION_COLORS.find(c => c.value === (section.color || 'gray'))?.label}</span>
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {SECTION_COLORS.map(c => (
                              <SelectItem key={c.value} value={c.value}>
                                <div className="flex items-center gap-2">
                                  <span className={`w-3 h-3 rounded-full ${COLOR_CLASSES[c.value].icon.replace('text-', 'bg-')}`} />
                                  {c.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Іконка</Label>
                        <Select
                          value={section.icon || 'clipboard'}
                          onValueChange={(v) => updateSection(section.id, { icon: v })}
                        >
                          <SelectTrigger className={`bg-white dark:bg-gray-950 ${colorClasses.inputBorder} focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 ${colorClasses.focusBorder}`}>
                            <div className="flex items-center gap-2">
                              {(() => {
                                const Icon = ICON_COMPONENTS[section.icon || 'clipboard'] || ClipboardList
                                return <Icon className={`h-4 w-4 ${colorClasses.icon}`} />
                              })()}
                              <span>{SECTION_ICONS.find(i => i.value === (section.icon || 'clipboard'))?.label}</span>
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {SECTION_ICONS.map(i => {
                              const Icon = ICON_COMPONENTS[i.value] || ClipboardList
                              return (
                                <SelectItem key={i.value} value={i.value}>
                                  <div className="flex items-center gap-2">
                                    <Icon className="h-4 w-4" />
                                    {i.label}
                                  </div>
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Fields */}
                    {section.fields.length > 0 ? (
                    <div className={`border rounded-lg overflow-hidden ${colorClasses.border}`}>
                      {section.fields.map((field, fieldIndex) => (
                        <div
                          key={field.id}
                          className={`flex items-center gap-3 px-4 py-3 ${fieldIndex > 0 ? `border-t ${colorClasses.border}` : ''}`}
                        >
                          <div className="flex-1 grid gap-3 sm:grid-cols-4 items-center">
                            <Input
                              value={field.label}
                              onChange={(e) => updateField(section.id, field.id, { label: e.target.value })}
                              placeholder="Підпис поля"
                              className={`bg-white dark:bg-gray-950 ${colorClasses.inputBorder} focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 ${colorClasses.focusBorder}`}
                            />
                            <Select
                              value={field.type}
                              onValueChange={(v) => updateField(section.id, field.id, { type: v as ProtocolFieldType })}
                            >
                              <SelectTrigger className={`bg-white dark:bg-gray-950 ${colorClasses.inputBorder} focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 ${colorClasses.focusBorder}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {FIELD_TYPES.map(t => (
                                  <SelectItem key={t.value} value={t.value}>
                                    {t.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {(field.type === 'chips' || field.type === 'chips_multi' || field.type === 'select') && (
                              <div className="sm:col-span-2 flex flex-wrap gap-1.5 items-center">
                                {(field.options || []).map((opt, optIndex) => (
                                  <div key={optIndex} className={`flex items-center gap-0.5 bg-white dark:bg-gray-950 border ${colorClasses.inputBorder} rounded-md px-1`}>
                                    <Input
                                      value={opt}
                                      onChange={(e) => {
                                        const newOptions = [...(field.options || [])]
                                        newOptions[optIndex] = e.target.value
                                        updateField(section.id, field.id, { options: newOptions })
                                      }}
                                      className="h-6 w-20 text-xs border-0 bg-transparent px-1 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                                      placeholder="..."
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newOptions = (field.options || []).filter((_, i) => i !== optIndex)
                                        updateField(section.id, field.id, { options: newOptions })
                                      }}
                                      className="text-muted-foreground hover:text-destructive"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newOptions = [...(field.options || []), '']
                                    updateField(section.id, field.id, { options: newOptions })
                                  }}
                                  className={`h-6 px-2 text-xs rounded-md border ${colorClasses.inputBorder} ${colorClasses.icon} bg-white dark:bg-gray-950 hover:opacity-80`}
                                >
                                  +
                                </button>
                              </div>
                            )}
                            {field.type === 'rating' && (
                              <Input
                                type="number"
                                value={field.max || 5}
                                onChange={(e) => updateField(section.id, field.id, { max: parseInt(e.target.value) || 5 })}
                                min={1}
                                max={10}
                                className={`w-20 h-8 bg-white dark:bg-gray-950 ${colorClasses.inputBorder}`}
                              />
                            )}
                          </div>
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => removeField(section.id, field.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    ) : (
                      <div className={`text-center py-4 text-muted-foreground text-sm`}>
                        Полів ще немає
                      </div>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      className={`w-full mt-2 ${colorClasses.icon}`}
                      onClick={() => addField(section.id)}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Додати поле
                    </Button>

                    {/* Delete section button */}
                    <div className="pt-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeSection(section.id)}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Видалити секцію
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )})}
          </Accordion>

          {sections.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Секції не додано. Натисніть "Додати секцію" або "Перегенерувати".
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
