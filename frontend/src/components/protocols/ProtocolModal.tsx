'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { uk } from 'date-fns/locale'
import {
  ClipboardList,
  Loader2,
  Save,
  Wand2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { DynamicProtocolForm } from './DynamicProtocolForm'
import {
  Appointment,
  ProcedureProtocol,
  ProtocolTemplate,
  ProtocolProduct,
  ProtocolProductCreate,
  ProtocolFile,
  protocolsApi,
  protocolTemplatesApi,
} from '@/lib/api'

interface ProtocolModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment: Appointment | null
  existingProtocol: ProcedureProtocol | null
  onProtocolSaved: (protocol: ProcedureProtocol) => void
}

export function ProtocolModal({
  open,
  onOpenChange,
  appointment,
  existingProtocol,
  onProtocolSaved,
}: ProtocolModalProps) {
  // Template state
  const [template, setTemplate] = useState<ProtocolTemplate | null>(null)
  const [loadingTemplate, setLoadingTemplate] = useState(false)
  const [generatingTemplate, setGeneratingTemplate] = useState(false)

  // Protocol data state
  const [templateData, setTemplateData] = useState<Record<string, Record<string, unknown>>>({})
  const [products, setProducts] = useState<ProtocolProduct[]>([])
  const [currentProtocol, setCurrentProtocol] = useState<ProcedureProtocol | null>(null)

  // Photos state
  const [beforePhotos, setBeforePhotos] = useState<ProtocolFile[]>([])
  const [afterPhotos, setAfterPhotos] = useState<ProtocolFile[]>([])

  // Saving state
  const [saving, setSaving] = useState(false)

  // Load template when modal opens
  useEffect(() => {
    if (open && appointment?.service_id) {
      loadTemplate()
    }
  }, [open, appointment?.service_id])

  // Initialize data when modal opens
  useEffect(() => {
    if (open) {
      if (existingProtocol) {
        setCurrentProtocol(existingProtocol)
        setProducts(existingProtocol.products_used || [])
        // Use template_data if available, otherwise initialize empty
        if (existingProtocol.template_data) {
          setTemplateData(existingProtocol.template_data)
        } else {
          setTemplateData({})
        }
        // If protocol has template, use it
        if (existingProtocol.template) {
          setTemplate({
            id: existingProtocol.template.id,
            name: existingProtocol.template.name,
            sections: existingProtocol.template.sections,
            company_id: undefined,
            service_id: undefined,
            category_id: undefined,
            description: undefined,
            is_default: false,
            is_system: false,
            tags: [],
            created_at: '',
            updated_at: '',
          })
        }
        // Load existing protocol files
        loadProtocolFiles(existingProtocol.id)
      } else {
        setCurrentProtocol(null)
        setProducts([])
        setTemplateData({})
        setBeforePhotos([])
        setAfterPhotos([])
      }
    }
  }, [open, existingProtocol])

  const loadProtocolFiles = async (protocolId: number) => {
    try {
      const files = await protocolsApi.getFiles(protocolId)
      setBeforePhotos(files.filter(f => f.file_type === 'before'))
      setAfterPhotos(files.filter(f => f.file_type === 'after'))
    } catch (err) {
      console.error('Error loading protocol files:', err)
    }
  }

  const loadTemplate = async () => {
    if (!appointment?.service_id) return

    setLoadingTemplate(true)
    try {
      const tmpl = await protocolTemplatesApi.getForService(appointment.service_id)
      if (tmpl) {
        setTemplate(tmpl)
      }
    } catch (err) {
      console.error('Error loading template:', err)
    } finally {
      setLoadingTemplate(false)
    }
  }

  const handleGenerateTemplate = async () => {
    if (!appointment?.service) return

    setGeneratingTemplate(true)
    try {
      const result = await protocolTemplatesApi.generate({
        service_name: appointment.service.name,
      })

      // Create template from generated data
      const newTemplate = await protocolTemplatesApi.create({
        name: result.name,
        description: result.description,
        sections: result.sections,
        service_id: appointment.service_id,
        tags: result.suggested_tags,
      })

      setTemplate(newTemplate)
    } catch (err) {
      console.error('Error generating template:', err)
    } finally {
      setGeneratingTemplate(false)
    }
  }

  const handleDataChange = useCallback((data: Record<string, Record<string, unknown>>) => {
    setTemplateData(data)
  }, [])

  const handleFieldChange = useCallback((sectionId: string, fieldId: string, value: unknown) => {
    // Already handled by handleDataChange
  }, [])

  const saveProtocol = async () => {
    if (!appointment) return

    setSaving(true)
    try {
      let savedProtocol: ProcedureProtocol

      const protocolData = {
        template_id: template?.id,
        template_data: templateData,
      }

      if (currentProtocol) {
        savedProtocol = await protocolsApi.update(currentProtocol.id, protocolData)
      } else {
        savedProtocol = await protocolsApi.create({
          appointment_id: appointment.id,
          ...protocolData,
        })
      }

      // Attach any unattached files to the protocol
      const allPhotos = [...beforePhotos, ...afterPhotos]
      const unattachedFiles = allPhotos.filter(f => !f.protocol_id)
      if (unattachedFiles.length > 0) {
        await protocolsApi.attachFiles(savedProtocol.id, unattachedFiles.map(f => f.id))
      }

      setCurrentProtocol(savedProtocol)
      onProtocolSaved(savedProtocol)
    } catch (err) {
      console.error('Error saving protocol:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleAddProduct = async (product: ProtocolProductCreate) => {
    if (!currentProtocol) return

    try {
      const newProduct = await protocolsApi.addProduct(currentProtocol.id, product)
      setProducts([...products, newProduct])
    } catch (err) {
      console.error('Error adding product:', err)
    }
  }

  const handleRemoveProduct = async (productId: number) => {
    if (!currentProtocol) return

    try {
      await protocolsApi.removeProduct(currentProtocol.id, productId)
      setProducts(products.filter((p) => p.id !== productId))
    } catch (err) {
      console.error('Error removing product:', err)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span>Протокол процедури</span>
              {appointment && (
                <p className="text-sm font-normal text-muted-foreground">
                  {appointment.service?.name} — {format(new Date(appointment.date), 'd MMMM yyyy', { locale: uk })}
                </p>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {loadingTemplate ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <DynamicProtocolForm
              template={template}
              data={templateData}
              onChange={handleFieldChange}
              onDataChange={handleDataChange}
              products={products}
              onAddProduct={handleAddProduct}
              onRemoveProduct={handleRemoveProduct}
              canAddProducts={!!currentProtocol}
              beforePhotos={beforePhotos}
              afterPhotos={afterPhotos}
              onBeforePhotosChange={setBeforePhotos}
              onAfterPhotosChange={setAfterPhotos}
              isGenerating={generatingTemplate}
              onGenerateTemplate={handleGenerateTemplate}
              serviceName={appointment?.service?.name}
            />
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Закрити
          </Button>
          {template && (
            <Button onClick={saveProtocol} disabled={saving} className="min-w-[140px]">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Збереження...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {currentProtocol ? 'Оновити' : 'Створити'}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
