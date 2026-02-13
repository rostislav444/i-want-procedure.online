'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { uk } from 'date-fns/locale'
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MessageCircle,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ClipboardList,
  ChevronDown,
  ExternalLink,
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
import { Badge } from '@/components/ui/badge'
import { Appointment, SpecialistListItem } from '@/lib/api'
import Link from 'next/link'

const statusConfig = {
  pending: { label: 'Очікує', color: 'bg-amber-100 text-amber-700 border-amber-300', Icon: AlertCircle },
  confirmed: { label: 'Підтверджено', color: 'bg-blue-100 text-blue-700 border-blue-300', Icon: CheckCircle },
  completed: { label: 'Завершено', color: 'bg-emerald-100 text-emerald-700 border-emerald-300', Icon: CheckCircle },
  cancelled: { label: 'Скасовано', color: 'bg-red-100 text-red-700 border-red-300', Icon: XCircle },
}

interface AppointmentDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment: Appointment | null
  specialists?: SpecialistListItem[]
  specialistColorMap?: Map<number, { bg: string; border: string; text: string }>
  onStatusChange: (id: number, status: string) => Promise<void>
  onViewProtocol?: (appointment: Appointment) => void
}

export default function AppointmentDetailModal({
  open,
  onOpenChange,
  appointment,
  specialists,
  specialistColorMap,
  onStatusChange,
  onViewProtocol,
}: AppointmentDetailModalProps) {
  const [updatingStatus, setUpdatingStatus] = useState(false)

  if (!appointment) return null

  const status = statusConfig[appointment.status]
  const StatusIcon = status.Icon

  const specialist = appointment.specialist_profile_id
    ? specialists?.find(s => s.id === appointment.specialist_profile_id)
    : null
  const specialistColor = appointment.specialist_profile_id
    ? specialistColorMap?.get(appointment.specialist_profile_id)
    : null

  const handleStatusChange = async (newStatus: string) => {
    if (updatingStatus) return
    setUpdatingStatus(true)
    try {
      await onStatusChange(appointment.id, newStatus)
    } finally {
      setUpdatingStatus(false)
    }
  }

  const appointmentDate = new Date(appointment.date + 'T00:00:00')
  const durationMinutes = appointment.service?.duration_minutes || 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-pink-500" />
            {appointment.service?.name || 'Запис'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Status */}
          <div className="flex items-center justify-between">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`gap-2 border ${status.color}`}
                  disabled={updatingStatus}
                >
                  {updatingStatus ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <StatusIcon className="h-4 w-4" />
                  )}
                  {status.label}
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => handleStatusChange(key)}
                    disabled={key === appointment.status}
                  >
                    <config.Icon className="h-4 w-4 mr-2" />
                    {config.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {appointment.status === 'completed' && onViewProtocol && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => onViewProtocol(appointment)}
              >
                <ClipboardList className="h-4 w-4" />
                Протокол
              </Button>
            )}
          </div>

          {/* Date & Time */}
          <div className="rounded-xl border p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-pink-100 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-pink-600" />
              </div>
              <div>
                <div className="text-sm font-medium">
                  {format(appointmentDate, 'EEEE, d MMMM yyyy', { locale: uk })}
                </div>
                <div className="text-xs text-muted-foreground">Дата</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-medium">
                  {appointment.start_time.slice(0, 5)} — {appointment.end_time.slice(0, 5)}
                  <span className="text-muted-foreground font-normal"> ({durationMinutes} хв)</span>
                </div>
                <div className="text-xs text-muted-foreground">Час</div>
              </div>
            </div>
          </div>

          {/* Service Info */}
          {appointment.service && (
            <div className="rounded-xl border p-4">
              <div className="text-xs text-muted-foreground mb-1">Послуга</div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{appointment.service.name}</div>
                <Badge variant="secondary">{appointment.service.price} грн</Badge>
              </div>
            </div>
          )}

          {/* Client Info */}
          {appointment.client && (
            <div className="rounded-xl border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">Клієнт</div>
                <Link
                  href={`/admin/clients/${appointment.client.id}`}
                  className="text-xs text-pink-500 hover:underline flex items-center gap-1"
                >
                  Профіль
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-sm font-medium">
                  {appointment.client.first_name} {appointment.client.last_name || ''}
                </div>
              </div>
              <div className="space-y-1 pl-10">
                {appointment.client.phone && (
                  <a href={`tel:${appointment.client.phone}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Phone className="h-3.5 w-3.5" />
                    {appointment.client.phone}
                  </a>
                )}
                {appointment.client.email && (
                  <a href={`mailto:${appointment.client.email}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Mail className="h-3.5 w-3.5" />
                    {appointment.client.email}
                  </a>
                )}
                {appointment.client.telegram_username && (
                  <a
                    href={`https://t.me/${appointment.client.telegram_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    @{appointment.client.telegram_username}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Specialist Info (clinic) */}
          {specialist && (
            <div className="rounded-xl border p-4">
              <div className="text-xs text-muted-foreground mb-1">Спеціаліст</div>
              <div className="flex items-center gap-2">
                {specialistColor && (
                  <div className={`w-3 h-3 rounded-full ${specialistColor.border}`} />
                )}
                <div className="text-sm font-medium">
                  {specialist.first_name} {specialist.last_name}
                </div>
                {specialist.position && (
                  <span className="text-xs text-muted-foreground">({specialist.position})</span>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
            <div className="flex gap-2">
              {appointment.status === 'pending' && (
                <Button
                  size="sm"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => handleStatusChange('confirmed')}
                  disabled={updatingStatus}
                >
                  <CheckCircle className="h-4 w-4 mr-1.5" />
                  Підтвердити
                </Button>
              )}
              {appointment.status === 'confirmed' && (
                <Button
                  size="sm"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => handleStatusChange('completed')}
                  disabled={updatingStatus}
                >
                  <CheckCircle className="h-4 w-4 mr-1.5" />
                  Завершити
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-red-600 hover:bg-red-50 border-red-200"
                onClick={() => handleStatusChange('cancelled')}
                disabled={updatingStatus}
              >
                <XCircle className="h-4 w-4 mr-1.5" />
                Скасувати
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
