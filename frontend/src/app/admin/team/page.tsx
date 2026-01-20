'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { specialistsApi, SpecialistListItem } from '@/lib/api'
import { useCompany } from '@/contexts/CompanyContext'
import { UserPlus, Calendar, Scissors, ChevronRight, Check, X } from 'lucide-react'

export default function TeamPage() {
  const router = useRouter()
  const { companyType, canManageTeam, selectedCompanyId } = useCompany()
  const [specialists, setSpecialists] = useState<SpecialistListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showInactive, setShowInactive] = useState(false)

  useEffect(() => {
    // Redirect if not a clinic
    if (companyType && companyType !== 'clinic') {
      router.push('/admin')
      return
    }

    if (selectedCompanyId) {
      loadSpecialists()
    }
  }, [companyType, showInactive, selectedCompanyId])

  const loadSpecialists = async () => {
    if (!selectedCompanyId) return
    try {
      setLoading(true)
      const data = await specialistsApi.getAll(selectedCompanyId, showInactive)
      setSpecialists(data)
    } catch (error) {
      console.error('Failed to load specialists:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Команда</h1>
          <p className="text-muted-foreground">
            Управління спеціалістами клініки
          </p>
        </div>
        {canManageTeam && (
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Запросити спеціаліста
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded border-gray-300"
          />
          Показати неактивних
        </label>
      </div>

      {/* Specialists Grid */}
      {specialists.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              У вас ще немає спеціалістів
            </p>
            {canManageTeam && (
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Додати першого спеціаліста
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {specialists.map((specialist) => (
            <Link key={specialist.id} href={`/admin/team/${specialist.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-medium">
                        {specialist.first_name[0]}{specialist.last_name[0]}
                      </div>
                      <div>
                        <h3 className="font-medium">
                          {specialist.first_name} {specialist.last_name}
                        </h3>
                        {specialist.position && (
                          <p className="text-sm text-muted-foreground">
                            {specialist.position}
                          </p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Scissors className="h-4 w-4" />
                      <span>{specialist.services_count} послуг</span>
                    </div>
                  </div>

                  {/* Status badges */}
                  <div className="flex items-center gap-2">
                    {specialist.is_active ? (
                      <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                        <Check className="h-3 w-3 mr-1" />
                        Активний
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-red-500/10 text-red-600">
                        <X className="h-3 w-3 mr-1" />
                        Неактивний
                      </Badge>
                    )}
                    {specialist.google_connected && (
                      <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">
                        <Calendar className="h-3 w-3 mr-1" />
                        Google
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
