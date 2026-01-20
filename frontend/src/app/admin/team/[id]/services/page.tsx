'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, Check, Save, Scissors } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  specialistsApi,
  servicesApi,
  SpecialistProfile,
  SpecialistService,
  Service,
} from '@/lib/api'
import { useCompany } from '@/contexts/CompanyContext'

export default function SpecialistServicesPage() {
  const params = useParams()
  const router = useRouter()
  const specialistId = Number(params.id)
  const { companyType, canManageTeam, selectedCompanyId } = useCompany()

  const [specialist, setSpecialist] = useState<SpecialistProfile | null>(null)
  const [specialistServices, setSpecialistServices] = useState<SpecialistService[]>([])
  const [allServices, setAllServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Service assignment
  const [selectedServices, setSelectedServices] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (companyType && companyType !== 'clinic') {
      router.push('/admin')
      return
    }
    if (selectedCompanyId) {
      loadData()
    }
  }, [specialistId, companyType, selectedCompanyId])

  const loadData = async () => {
    if (!selectedCompanyId) return
    try {
      const [specialistData, servicesData, allServicesData] = await Promise.all([
        specialistsApi.getById(specialistId, selectedCompanyId),
        specialistsApi.getServices(specialistId, selectedCompanyId),
        servicesApi.getAll(),
      ])

      setSpecialist(specialistData)
      setSpecialistServices(servicesData)
      setAllServices(allServicesData)
      setSelectedServices(new Set(servicesData.map(s => s.service_id)))
    } catch (error) {
      console.error('Failed to load data:', error)
      router.push('/admin/team')
    } finally {
      setLoading(false)
    }
  }

  const handleServiceToggle = (serviceId: number) => {
    const newSelected = new Set(selectedServices)
    if (newSelected.has(serviceId)) {
      newSelected.delete(serviceId)
    } else {
      newSelected.add(serviceId)
    }
    setSelectedServices(newSelected)
  }

  const handleSaveServices = async () => {
    if (!selectedCompanyId) return
    try {
      setSaving(true)
      const updatedServices = await specialistsApi.assignServices(
        specialistId,
        selectedCompanyId,
        Array.from(selectedServices)
      )
      setSpecialistServices(updatedServices)
    } catch (error) {
      console.error('Failed to save services:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading || !specialist) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const hasServiceChanges =
    selectedServices.size !== specialistServices.length ||
    !specialistServices.every(s => selectedServices.has(s.service_id))

  // Get assigned services with full details
  const assignedServices = allServices.filter(s => selectedServices.has(s.id))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/team/${specialistId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            Послуги — {specialist.first_name} {specialist.last_name}
          </h1>
          {specialist.position && (
            <p className="text-sm text-muted-foreground">{specialist.position}</p>
          )}
        </div>
        {canManageTeam && hasServiceChanges && (
          <Button onClick={handleSaveServices} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            Зберегти зміни
          </Button>
        )}
      </div>

      {/* Assigned Services Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5" />
            Призначені послуги ({assignedServices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignedServices.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Спеціалісту не призначено жодної послуги
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {assignedServices.map((service) => (
                <Card key={service.id} className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{service.name}</h3>
                    {service.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {service.description}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="px-4 py-3 border-t bg-muted/30">
                    <div className="flex items-center justify-between w-full">
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {service.duration_minutes} хв
                      </span>
                      <span className="font-bold text-primary">
                        {service.price} грн
                      </span>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Services Selection */}
      {canManageTeam && (
        <Card>
          <CardHeader>
            <CardTitle>Керування послугами</CardTitle>
          </CardHeader>
          <CardContent>
            {allServices.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Спочатку створіть послуги в розділі &quot;Послуги&quot;
              </p>
            ) : (
              <div className="space-y-2">
                {allServices.map((service) => {
                  const isAssigned = selectedServices.has(service.id)
                  return (
                    <div
                      key={service.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        isAssigned ? 'bg-primary/5 border-primary/20' : 'bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isAssigned}
                          onChange={() => handleServiceToggle(service.id)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <div>
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {service.duration_minutes} хв &bull; {service.price} грн
                          </p>
                        </div>
                      </div>
                      {isAssigned && (
                        <Badge variant="secondary">
                          <Check className="h-3 w-3 mr-1" />
                          Призначено
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
