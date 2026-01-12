'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { positionsApi, PositionDetail } from '@/lib/api'
import { useCompany } from '@/contexts/CompanyContext'
import {
  ArrowLeft,
  Scissors,
  Users,
  Clock,
  Check,
  X,
  UserPlus,
  Plus,
} from 'lucide-react'

const POSITION_COLORS: Record<string, string> = {
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  green: 'bg-green-500',
  orange: 'bg-orange-500',
  pink: 'bg-pink-500',
  cyan: 'bg-cyan-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
}

export default function PositionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const positionId = Number(params.id)
  const { companyType } = useCompany()

  const [position, setPosition] = useState<PositionDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (companyType && companyType !== 'clinic') {
      router.push('/admin')
      return
    }
    loadPosition()
  }, [positionId, companyType])

  const loadPosition = async () => {
    try {
      setLoading(true)
      const data = await positionsApi.getById(positionId)
      setPosition(data)
    } catch (error) {
      console.error('Failed to load position:', error)
      router.push('/admin/settings')
    } finally {
      setLoading(false)
    }
  }

  const getColorClass = (color: string | null) => {
    return POSITION_COLORS[color || ''] || 'bg-gray-500'
  }

  if (loading || !position) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className={`w-5 h-5 rounded-full ${getColorClass(position.color)}`} />
          <div>
            <h1 className="text-2xl font-semibold">{position.name}</h1>
            {position.description && (
              <p className="text-muted-foreground">{position.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Scissors className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{position.services_count}</p>
                <p className="text-sm text-muted-foreground">Послуг</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{position.specialists_count}</p>
                <p className="text-sm text-muted-foreground">Спеціалістів</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Scissors className="h-5 w-5" />
              Послуги
            </CardTitle>
            <CardDescription>
              Послуги, які виконують спеціалісти цієї посади
            </CardDescription>
          </div>
          <Link href="/admin/services">
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Призначити послуги
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {position.services.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Scissors className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>До цієї посади ще не прикріплено послуги</p>
              <p className="text-sm">
                Перейдіть на сторінку послуг, щоб призначити послуги до цієї посади
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {position.services.map((service) => (
                <Link key={service.id} href={`/admin/services/${service.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <Scissors className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium group-hover:text-primary transition-colors">
                          {service.name}
                        </p>
                        {service.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {service.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {service.duration_minutes} хв
                      </div>
                      <span className="font-bold text-primary">{service.price} грн</span>
                      {service.is_active ? (
                        <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                          <Check className="h-3 w-3 mr-1" />
                          Активна
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-red-500/10 text-red-600">
                          <X className="h-3 w-3 mr-1" />
                          Неактивна
                        </Badge>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Specialists */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Спеціалісти
            </CardTitle>
            <CardDescription>
              Спеціалісти, які працюють на цій посаді
            </CardDescription>
          </div>
          <Link href="/admin/team">
            <Button variant="outline" size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Призначити спеціалістів
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {position.specialists.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>На цій посаді ще немає спеціалістів</p>
              <p className="text-sm">
                Перейдіть на сторінку команди, щоб призначити посаду спеціалістам
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {position.specialists.map((specialist) => (
                <Link key={specialist.id} href={`/admin/team/${specialist.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                        {specialist.first_name[0]}{specialist.last_name[0]}
                      </div>
                      <div>
                        <p className="font-medium group-hover:text-primary transition-colors">
                          {specialist.first_name} {specialist.last_name}
                        </p>
                        {specialist.email && (
                          <p className="text-sm text-muted-foreground">{specialist.email}</p>
                        )}
                      </div>
                    </div>
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
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
