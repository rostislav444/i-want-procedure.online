'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { uk } from 'date-fns/locale'
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ClipboardList,
  ChevronDown,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DynamicProtocolForm } from '@/components/protocols/DynamicProtocolForm'
import { ProcedureFinancialCard } from '@/components/appointments/ProcedureFinancialCard'
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
  pending: { label: 'Очікує', color: 'bg-amber-50 text-amber-700 border-amber-200', Icon: AlertCircle },
  confirmed: { label: 'Підтверджено', color: 'bg-blue-50 text-blue-700 border-blue-200', Icon: CheckCircle },
  completed: { label: 'Завершено', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: CheckCircle },
  cancelled: { label: 'Скасовано', color: 'bg-red-50 text-red-700 border-red-200', Icon: XCircle },
}

export default function AppointmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const appointmentId = Number(params.id)

  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  // Protocol state
  const [protocol, setProtocol] = useState<ProcedureProtocol | null>(null)
  const [template, setTemplate] = useState<ProtocolTemplate | null>(null)
  const [loadingTemplate, setLoadingTemplate] = useState(false)
  const [generatingTemplate, setGeneratingTemplate] = useState(false)
  const [templateData, setTemplateData] = useState<Record<string, Record<string, unknown>>>({})
  const [products, setProducts] = useState<ProtocolProduct[]>([])
  const [beforePhotos, setBeforePhotos] = useState<ProtocolFile[]>([])
  const [afterPhotos, setAfterPhotos] = useState<ProtocolFile[]>([])
  const [savingProtocol, setSavingProtocol] = useState(false)

  useEffect(() => {
    if (isNaN(appointmentId)) {
      router.push('/admin/appointments')
      return
    }
    loadData()
  }, [appointmentId])

  const loadData = async () => {
    try {
      setLoading(true)
      const appt = await appointmentsApi.getById(appointmentId)
      setAppointment(appt)

      // Load protocol if completed
      if (appt.status === 'completed') {
        try {
          const proto = await protocolsApi.getByAppointment(appointmentId)
          if (proto) {
            setProtocol(proto)
            setProducts(proto.products_used || [])
            setTemplateData(proto.template_data || {})
            if (proto.template) {
              setTemplate({
                id: proto.template.id,
                name: proto.template.name,
                sections: proto.template.sections,
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
            // Load files
            const files = await protocolsApi.getFiles(proto.id)
            setBeforePhotos(files.filter((f: ProtocolFile) => f.file_type === 'before'))
            setAfterPhotos(files.filter((f: ProtocolFile) => f.file_type === 'after'))
          }
        } catch (err) {
          // No protocol yet - that's okay
        }

        // Load template for service
        if (appt.service_id) {
          setLoadingTemplate(true)
          try {
            const tmpl = await protocolTemplatesApi.getForService(appt.service_id)
            if (tmpl) setTemplate(tmpl)
          } catch (err) {
            console.error('Error loading template:', err)
          } finally {
            setLoadingTemplate(false)
          }
        }
      }
    } catch (err) {
      console.error('Error loading appointment:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!appointment || newStatus === appointment.status) return
    setUpdatingStatus(true)
    try {
      const updated = await appointmentsApi.updateStatus(appointment.id, newStatus)
      setAppointment({ ...appointment, status: newStatus as Appointment['status'] })
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
      const protocolData = {
        template_id: template?.id,
        template_data: templateData,
      }
      let savedProtocol: ProcedureProtocol
      if (protocol) {
        savedProtocol = await protocolsApi.update(protocol.id, protocolData)
      } else {
        savedProtocol = await protocolsApi.create({
          appointment_id: appointment.id,
          ...protocolData,
        })
      }
      const allPhotos = [...beforePhotos, ...afterPhotos]
      const unattachedFiles = allPhotos.filter(f => !f.protocol_id)
      if (unattachedFiles.length > 0) {
        await protocolsApi.attachFiles(savedProtocol.id, unattachedFiles.map(f => f.id))
      }
      setProtocol(savedProtocol)
    } catch (err) {
      console.error('Error saving protocol:', err)
    } finally {
      setSavingProtocol(false)
    }
  }

  const handleAddProduct = async (product: ProtocolProductCreate) => {
    if (!protocol) return
    try {
      const newProduct = await protocolsApi.addProduct(protocol.id, product)
      setProducts([...products, newProduct])
    } catch (err) {
      console.error('Error adding product:', err)
    }
  }

  const handleRemoveProduct = async (productId: number) => {
    if (!protocol) return
    try {
      await protocolsApi.removeProduct(protocol.id, productId)
      setProducts(products.filter(p => p.id !== productId))
    } catch (err) {
      console.error('Error removing product:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Запис не знайдено</p>
        <Button variant="link" onClick={() => router.push('/admin/appointments')}>
          Повернутися до записів
        </Button>
      </div>
    )
  }

  const status = statusConfig[appointment.status as keyof typeof statusConfig] || statusConfig.pending
  const StatusIcon = status.Icon
  const isCompleted = appointment.status === 'completed'

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Назад
        </Button>
      </div>

      {/* Appointment Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-xl font-semibold">{appointment.service?.name || 'Запис'}</h1>
              <p className="text-muted-foreground mt-1">
                {format(new Date(appointment.date), 'd MMMM yyyy', { locale: uk })} о {appointment.start_time.slice(0, 5)} - {appointment.end_time.slice(0, 5)}
              </p>
            </div>

            {/* Status Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className={`gap-2 ${status.color}`} disabled={updatingStatus}>
                  {updatingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <StatusIcon className="h-4 w-4" />}
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
                      className={key === appointment.status ? 'bg-muted' : ''}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {config.label}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Клієнт</span>
              {appointment.client ? (
                <Link
                  href={`/admin/clients/${appointment.client_id}`}
                  className="font-medium hover:underline flex items-center gap-1"
                >
                  {appointment.client.first_name} {appointment.client.last_name || ''}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              ) : (
                <p className="font-medium">—</p>
              )}
            </div>
            <div>
              <span className="text-muted-foreground">Послуга</span>
              {appointment.service ? (
                <Link
                  href={`/admin/services/${appointment.service_id}`}
                  className="font-medium hover:underline flex items-center gap-1"
                >
                  {appointment.service.name}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              ) : (
                <p className="font-medium">—</p>
              )}
            </div>
            <div>
              <span className="text-muted-foreground">Тривалість</span>
              <p className="font-medium">{appointment.service?.duration_minutes || '—'} хв</p>
            </div>
            <div>
              <span className="text-muted-foreground">Вартість</span>
              <p className="font-medium">{Number(appointment.service?.price || 0).toLocaleString('uk-UA')} грн</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two-column layout for completed appointments */}
      {isCompleted && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Protocol - takes 2 cols */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold text-lg">Протокол процедури</h2>
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
                      canAddProducts={!!protocol}
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
                            protocol ? 'Оновити протокол' : 'Створити протокол'
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Financials */}
          <div>
            <ProcedureFinancialCard appointmentId={appointment.id} />
          </div>
        </div>
      )}
    </div>
  )
}
