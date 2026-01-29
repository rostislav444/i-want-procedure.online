'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { uk } from 'date-fns/locale'
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ClipboardList,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DynamicProtocolForm } from '@/components/protocols/DynamicProtocolForm'
import {
  Appointment,
  ProcedureProtocol,
  ProtocolTemplate,
  ProtocolProduct,
  ProtocolProductCreate,
  ProtocolFile,
  appointmentsApi,
  protocolsApi,
  protocolTemplatesApi,
} from '@/lib/api'

const statusConfig = {
  pending: { label: 'Очікує', color: 'bg-amber-100 text-amber-700 border-amber-300', Icon: AlertCircle },
  confirmed: { label: 'Підтверджено', color: 'bg-blue-100 text-blue-700 border-blue-300', Icon: CheckCircle },
  completed: { label: 'Завершено', color: 'bg-emerald-100 text-emerald-700 border-emerald-300', Icon: CheckCircle },
  cancelled: { label: 'Скасовано', color: 'bg-red-100 text-red-700 border-red-300', Icon: XCircle },
}

interface AppointmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment: Appointment | null
  existingProtocol: ProcedureProtocol | null
  onAppointmentUpdated: (appointment: Appointment) => void
  onProtocolSaved: (protocol: ProcedureProtocol) => void
}

export function AppointmentModal({
  open,
  onOpenChange,
  appointment,
  existingProtocol,
  onAppointmentUpdated,
  onProtocolSaved,
}: AppointmentModalProps) {
  // Status state
  const [currentStatus, setCurrentStatus] = useState<string>('')
  const [updatingStatus, setUpdatingStatus] = useState(false)

  // Protocol state
  const [template, setTemplate] = useState<ProtocolTemplate | null>(null)
  const [loadingTemplate, setLoadingTemplate] = useState(false)
  const [generatingTemplate, setGeneratingTemplate] = useState(false)
  const [templateData, setTemplateData] = useState<Record<string, Record<string, unknown>>>({})
  const [products, setProducts] = useState<ProtocolProduct[]>([])
  const [currentProtocol, setCurrentProtocol] = useState<ProcedureProtocol | null>(null)
  const [beforePhotos, setBeforePhotos] = useState<ProtocolFile[]>([])
  const [afterPhotos, setAfterPhotos] = useState<ProtocolFile[]>([])
  const [savingProtocol, setSavingProtocol] = useState(false)

  // Initialize when modal opens
  useEffect(() => {
    if (open && appointment) {
      setCurrentStatus(appointment.status)

      // Load template
      loadTemplate()

      // Initialize protocol data
      if (existingProtocol) {
        setCurrentProtocol(existingProtocol)
        setProducts(existingProtocol.products_used || [])
        setTemplateData(existingProtocol.template_data || {})
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
        loadProtocolFiles(existingProtocol.id)
      } else {
        setCurrentProtocol(null)
        setProducts([])
        setTemplateData({})
        setBeforePhotos([])
        setAfterPhotos([])
      }
    }
  }, [open, appointment, existingProtocol])

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

  const loadProtocolFiles = async (protocolId: number) => {
    try {
      const files = await protocolsApi.getFiles(protocolId)
      setBeforePhotos(files.filter(f => f.file_type === 'before'))
      setAfterPhotos(files.filter(f => f.file_type === 'after'))
    } catch (err) {
      console.error('Error loading protocol files:', err)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!appointment || newStatus === currentStatus) return

    setUpdatingStatus(true)
    try {
      const updated = await appointmentsApi.updateStatus(appointment.id, newStatus)
      setCurrentStatus(newStatus)
      onAppointmentUpdated({ ...appointment, status: newStatus as Appointment['status'] })
    } catch (err) {
      console.error('Error updating status:', err)
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleGenerateTemplate = async () => {
    if (!appointment?.service) return

    setGeneratingTemplate(true)
    try {
      const result = await protocolTemplatesApi.generate({
        service_name: appointment.service.name,
      })

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
    // Handled by handleDataChange
  }, [])

  const saveProtocol = async () => {
    if (!appointment) return

    setSavingProtocol(true)
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

      // Attach any unattached files
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
      setSavingProtocol(false)
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
      setProducts(products.filter(p => p.id !== productId))
    } catch (err) {
      console.error('Error removing product:', err)
    }
  }

  if (!appointment) return null

  const status = statusConfig[currentStatus as keyof typeof statusConfig] || statusConfig.pending
  const StatusIcon = status.Icon
  const isCompleted = currentStatus === 'completed'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <span>{appointment.service?.name || 'Запис'}</span>
              <p className="text-sm font-normal text-muted-foreground">
                {format(new Date(appointment.date), 'd MMMM yyyy', { locale: uk })} о {appointment.start_time.slice(0, 5)}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Appointment Info Section */}
        <div className="border rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Деталі запису
            </h3>

            {/* Status Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className={`gap-2 ${status.color}`}
                  disabled={updatingStatus}
                >
                  {updatingStatus ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <StatusIcon className="h-4 w-4" />
                  )}
                  {status.label}
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {Object.entries(statusConfig).map(([key, config]) => {
                  const Icon = config.Icon
                  return (
                    <DropdownMenuItem
                      key={key}
                      onClick={() => handleStatusChange(key)}
                      className={key === currentStatus ? 'bg-muted' : ''}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {config.label}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Дата</span>
              <p className="font-medium">{format(new Date(appointment.date), 'd MMMM yyyy', { locale: uk })}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Час</span>
              <p className="font-medium">{appointment.start_time.slice(0, 5)} - {appointment.end_time.slice(0, 5)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Послуга</span>
              <p className="font-medium">{appointment.service?.name || '—'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Вартість</span>
              <p className="font-medium">{Number(appointment.service?.price || 0).toLocaleString('uk-UA')} грн</p>
            </div>
          </div>
        </div>

        {/* Protocol Section - only show when completed */}
        {isCompleted && (
          <div className="border-t pt-6 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Протокол процедури</h3>
            </div>

            {loadingTemplate ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
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
                  serviceName={appointment.service?.name}
                />

                {template && (
                  <div className="flex justify-end mt-6">
                    <Button onClick={saveProtocol} disabled={savingProtocol} className="min-w-[140px]">
                      {savingProtocol ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Збереження...
                        </>
                      ) : (
                        currentProtocol ? 'Оновити протокол' : 'Створити протокол'
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Footer for non-completed */}
        {!isCompleted && (
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Закрити
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
