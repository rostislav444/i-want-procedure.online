'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { format } from 'date-fns'
import { uk } from 'date-fns/locale'
import {
  Calendar as CalendarIcon,
  Search,
  UserPlus,
  Clock,
  Loader2,
  Plus,
  X,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  appointmentsApi,
  clientsApi,
  servicesApi,
  specialistsApi,
  AvailableSlot,
  ClientSearchResult,
  Service,
  SpecialistListItem,
} from '@/lib/api'
import { useCompany } from '@/contexts/CompanyContext'

interface CreateAppointmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAppointmentCreated: () => void
  preselectedDate?: Date | null
  preselectedTime?: string | null
}

export default function CreateAppointmentModal({
  open,
  onOpenChange,
  onAppointmentCreated,
  preselectedDate,
  preselectedTime,
}: CreateAppointmentModalProps) {
  const { user, companyType, selectedCompanyId } = useCompany()

  // Client state
  const [clientMode, setClientMode] = useState<'search' | 'new'>('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ClientSearchResult[]>([])
  const [selectedClient, setSelectedClient] = useState<ClientSearchResult | null>(null)
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // New client fields
  const [newFirstName, setNewFirstName] = useState('')
  const [newLastName, setNewLastName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newEmail, setNewEmail] = useState('')

  // Service & specialist
  const [services, setServices] = useState<Service[]>([])
  const [specialists, setSpecialists] = useState<SpecialistListItem[]>([])
  const [selectedServiceId, setSelectedServiceId] = useState<string>('')
  const [selectedSpecialistId, setSelectedSpecialistId] = useState<string>('')

  // Date & time
  const [selectedDate, setSelectedDate] = useState('')
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Submission
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Load services and specialists on open
  useEffect(() => {
    if (!open) return
    servicesApi.getAll().then(setServices).catch(console.error)
    if (companyType === 'clinic' && selectedCompanyId) {
      specialistsApi.getAll(selectedCompanyId).then(setSpecialists).catch(console.error)
    }
  }, [open, companyType, selectedCompanyId])

  // Pre-fill date/time
  useEffect(() => {
    if (open && preselectedDate) {
      setSelectedDate(format(preselectedDate, 'yyyy-MM-dd'))
    }
  }, [open, preselectedDate])

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setClientMode('search')
      setSearchQuery('')
      setSearchResults([])
      setSelectedClient(null)
      setNewFirstName('')
      setNewLastName('')
      setNewPhone('')
      setNewEmail('')
      setSelectedServiceId('')
      setSelectedSpecialistId('')
      setSelectedDate('')
      setAvailableSlots([])
      setSelectedSlot(null)
      setError('')
    }
  }, [open])

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced client search
  useEffect(() => {
    if (clientMode !== 'search' || searchQuery.length < 2) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const results = await clientsApi.search(searchQuery)
        setSearchResults(results)
        setShowResults(true)
      } catch {
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, clientMode])

  // Get doctor_id based on company type
  const getDoctorId = useCallback(() => {
    if (companyType === 'clinic' && selectedSpecialistId) {
      const specialist = specialists.find(s => s.id === Number(selectedSpecialistId))
      return specialist?.user_id || user?.id
    }
    return user?.id
  }, [companyType, selectedSpecialistId, specialists, user])

  // Load available slots when service + date + doctor are set
  useEffect(() => {
    if (!selectedServiceId || !selectedDate) {
      setAvailableSlots([])
      return
    }

    const doctorId = getDoctorId()
    if (!doctorId) return

    const loadSlots = async () => {
      setLoadingSlots(true)
      setSelectedSlot(null)
      try {
        const slots = await appointmentsApi.getAvailableSlots({
          doctor_id: doctorId,
          service_id: Number(selectedServiceId),
          date_from: selectedDate,
          date_to: selectedDate,
        })
        setAvailableSlots(slots)

        // Auto-select preselected time if available
        if (preselectedTime) {
          const match = slots.find(s => s.start_time.slice(0, 5) === preselectedTime.slice(0, 5))
          if (match) setSelectedSlot(match)
        }
      } catch {
        setAvailableSlots([])
      } finally {
        setLoadingSlots(false)
      }
    }

    loadSlots()
  }, [selectedServiceId, selectedDate, getDoctorId, preselectedTime])

  const selectClient = (client: ClientSearchResult) => {
    setSelectedClient(client)
    setSearchQuery(`${client.first_name} ${client.last_name || ''}`.trim())
    setShowResults(false)
  }

  const clearClient = () => {
    setSelectedClient(null)
    setSearchQuery('')
  }

  const isFormValid = () => {
    const hasClient = clientMode === 'search'
      ? !!selectedClient
      : newFirstName.trim().length >= 2
    const hasService = !!selectedServiceId
    const hasSpecialist = companyType !== 'clinic' || !!selectedSpecialistId
    const hasSlot = !!selectedSlot
    return hasClient && hasService && hasSpecialist && hasSlot
  }

  const handleSubmit = async () => {
    if (!isFormValid() || submitting) return

    setSubmitting(true)
    setError('')

    try {
      const data: Parameters<typeof appointmentsApi.create>[0] = {
        service_id: Number(selectedServiceId),
        date: selectedDate,
        start_time: selectedSlot!.start_time,
        end_time: selectedSlot!.end_time,
        status: 'confirmed',
      }

      if (companyType === 'clinic' && selectedSpecialistId) {
        data.member_id = Number(selectedSpecialistId)
      }

      if (clientMode === 'search' && selectedClient) {
        data.client_id = selectedClient.id
      } else {
        data.new_client = {
          first_name: newFirstName.trim(),
          last_name: newLastName.trim() || undefined,
          phone: newPhone.trim() || undefined,
          email: newEmail.trim() || undefined,
        }
      }

      await appointmentsApi.create(data)
      onAppointmentCreated()
      onOpenChange(false)
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { detail?: string } } }
      setError(axiosError.response?.data?.detail || 'Помилка при створенні запису')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedService = services.find(s => s.id === Number(selectedServiceId))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-pink-500" />
            Новий запис
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Client Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Клієнт</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={clientMode === 'search' ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setClientMode('search'); setSelectedClient(null) }}
                className="gap-1.5"
              >
                <Search className="h-3.5 w-3.5" />
                Знайти
              </Button>
              <Button
                type="button"
                variant={clientMode === 'new' ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setClientMode('new'); setSelectedClient(null); setSearchQuery('') }}
                className="gap-1.5"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Новий клієнт
              </Button>
            </div>

            {clientMode === 'search' ? (
              <div className="relative" ref={searchRef}>
                {selectedClient ? (
                  <div className="flex items-center gap-2 p-2.5 border rounded-lg bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">
                        {selectedClient.first_name} {selectedClient.last_name || ''}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {selectedClient.phone || selectedClient.email || selectedClient.telegram_username || ''}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={clearClient}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Пошук за ім'ям або телефоном..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => searchResults.length > 0 && setShowResults(true)}
                        className="pl-9"
                      />
                      {searching && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    {showResults && searchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {searchResults.map((client) => (
                          <button
                            key={client.id}
                            className="w-full px-3 py-2 text-left hover:bg-muted/50 transition-colors"
                            onClick={() => selectClient(client)}
                          >
                            <div className="text-sm font-medium">
                              {client.first_name} {client.last_name || ''}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {[client.phone, client.email, client.telegram_username ? `@${client.telegram_username}` : null].filter(Boolean).join(' · ')}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {showResults && searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
                      <div className="absolute z-10 w-full mt-1 bg-background border rounded-lg shadow-lg p-3">
                        <p className="text-sm text-muted-foreground text-center">Клієнтів не знайдено</p>
                        <Button
                          variant="link"
                          size="sm"
                          className="w-full mt-1"
                          onClick={() => {
                            setClientMode('new')
                            setNewFirstName(searchQuery)
                            setShowResults(false)
                          }}
                        >
                          <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                          Створити нового клієнта
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
                <Input
                  placeholder="Ім'я *"
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                />
                <Input
                  placeholder="Прізвище"
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                />
                <Input
                  placeholder="Телефон"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Service Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Послуга</Label>
            <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
              <SelectTrigger>
                <SelectValue placeholder="Оберіть послугу" />
              </SelectTrigger>
              <SelectContent>
                {services.filter(s => s.is_active).map((service) => (
                  <SelectItem key={service.id} value={String(service.id)}>
                    <div className="flex items-center justify-between w-full gap-4">
                      <span>{service.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {service.duration_minutes} хв · {service.price} грн
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Specialist Selection (clinic only) */}
          {companyType === 'clinic' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Спеціаліст</Label>
              <Select value={selectedSpecialistId} onValueChange={setSelectedSpecialistId}>
                <SelectTrigger>
                  <SelectValue placeholder="Оберіть спеціаліста" />
                </SelectTrigger>
                <SelectContent>
                  {specialists.map((sp) => (
                    <SelectItem key={sp.id} value={String(sp.id)}>
                      {sp.first_name} {sp.last_name}
                      {sp.position && <span className="text-muted-foreground"> — {sp.position}</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Дата</Label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => { setSelectedDate(e.target.value); setSelectedSlot(null) }}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="pl-9"
              />
            </div>
            {selectedDate && (
              <p className="text-xs text-muted-foreground">
                {format(new Date(selectedDate + 'T00:00:00'), 'EEEE, d MMMM yyyy', { locale: uk })}
              </p>
            )}
          </div>

          {/* Time Slots */}
          {selectedServiceId && selectedDate && (companyType !== 'clinic' || selectedSpecialistId) && (
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                Час
              </Label>
              {loadingSlots ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : availableSlots.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {availableSlots.map((slot) => (
                    <Button
                      key={`${slot.date}-${slot.start_time}`}
                      type="button"
                      variant={selectedSlot?.start_time === slot.start_time ? 'default' : 'outline'}
                      size="sm"
                      className="text-xs"
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {slot.start_time.slice(0, 5)}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-3">
                  Немає вільних слотів на цю дату
                </p>
              )}
              {selectedSlot && selectedService && (
                <p className="text-xs text-muted-foreground">
                  {selectedSlot.start_time.slice(0, 5)} — {selectedSlot.end_time.slice(0, 5)} ({selectedService.duration_minutes} хв)
                </p>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Скасувати
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid() || submitting}
            className="gap-1.5"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Створити запис
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
