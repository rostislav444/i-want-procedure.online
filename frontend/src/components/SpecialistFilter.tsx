'use client'

import { useEffect, useState } from 'react'
import { specialistsApi, SpecialistListItem } from '@/lib/api'
import { useCompany } from '@/contexts/CompanyContext'
import { Users } from 'lucide-react'

interface SpecialistFilterProps {
  value: number | null
  onChange: (specialistId: number | null) => void
  className?: string
}

export function SpecialistFilter({ value, onChange, className = '' }: SpecialistFilterProps) {
  const { companyType, canViewAllAppointments, selectedCompanyId } = useCompany()
  const [specialists, setSpecialists] = useState<SpecialistListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Only load for clinics with proper permissions
    if (companyType !== 'clinic' || !canViewAllAppointments || !selectedCompanyId) {
      setLoading(false)
      return
    }

    loadSpecialists()
  }, [companyType, canViewAllAppointments, selectedCompanyId])

  const loadSpecialists = async () => {
    if (!selectedCompanyId) return
    try {
      const data = await specialistsApi.getAll(selectedCompanyId)
      setSpecialists(data)
    } catch (error) {
      console.error('Failed to load specialists:', error)
    } finally {
      setLoading(false)
    }
  }

  // Don't render for solo companies or specialists (who can only see their own data)
  if (companyType !== 'clinic' || !canViewAllAppointments) {
    return null
  }

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="h-10 w-48 bg-muted animate-pulse rounded-md"></div>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Users className="h-4 w-4 text-muted-foreground" />
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <option value="">Всі спеціалісти</option>
        {specialists.map((specialist) => (
          <option key={specialist.id} value={specialist.id}>
            {specialist.first_name} {specialist.last_name}
            {specialist.position && ` (${specialist.position})`}
          </option>
        ))}
      </select>
    </div>
  )
}
