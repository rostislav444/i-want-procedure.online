'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { specialistsApi, SpecialistProfile } from '@/lib/api'
import { useCompany } from '@/contexts/CompanyContext'
import {
  ArrowLeft,
  Calendar,
  Scissors,
  Users,
  Mail,
  Phone,
  Check,
  X,
  Save,
  ChevronRight,
} from 'lucide-react'

export default function SpecialistDetailPage() {
  const params = useParams()
  const router = useRouter()
  const specialistId = Number(params.id)
  const { canManageTeam, companyType } = useCompany()

  const [specialist, setSpecialist] = useState<SpecialistProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Edit form
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({
    position: '',
    bio: '',
  })

  useEffect(() => {
    if (companyType && companyType !== 'clinic') {
      router.push('/admin')
      return
    }
    loadData()
  }, [specialistId, companyType])

  const loadData = async () => {
    try {
      setLoading(true)
      const specialistData = await specialistsApi.getById(specialistId)
      setSpecialist(specialistData)
      setEditForm({
        position: specialistData.position || '',
        bio: specialistData.bio || '',
      })
    } catch (error) {
      console.error('Failed to load specialist:', error)
      router.push('/admin/team')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!specialist) return

    try {
      setSaving(true)
      await specialistsApi.update(specialistId, editForm)
      setSpecialist({ ...specialist, ...editForm })
      setEditMode(false)
    } catch (error) {
      console.error('Failed to save profile:', error)
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

  const navigationItems = [
    {
      title: 'Записи',
      description: 'Перегляд записів спеціаліста',
      href: `/admin/team/${specialistId}/appointments`,
      icon: Calendar,
      count: specialist.appointments_today,
      countLabel: 'сьогодні',
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Клієнти',
      description: 'Клієнти, які записувались до спеціаліста',
      href: `/admin/team/${specialistId}/clients`,
      icon: Users,
      count: specialist.clients_count,
      countLabel: 'всього',
      color: 'text-green-600',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Послуги',
      description: 'Призначені послуги спеціаліста',
      href: `/admin/team/${specialistId}/services`,
      icon: Scissors,
      count: specialist.services_count,
      countLabel: 'призначено',
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/team">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">
            {specialist.first_name} {specialist.last_name}
          </h1>
          {specialist.position && (
            <p className="text-muted-foreground">{specialist.position}</p>
          )}
        </div>
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

      {/* Stats Cards with Navigation */}
      <div className="grid gap-4 md:grid-cols-3">
        {navigationItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${item.bgColor}`}>
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-semibold">{item.count}</p>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-sm text-muted-foreground">{item.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Профіль</CardTitle>
          {canManageTeam && !editMode && (
            <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
              Редагувати
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {editMode ? (
            <>
              <div className="space-y-2">
                <Label>Посада</Label>
                <Input
                  value={editForm.position}
                  onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                  placeholder="Наприклад: Косметолог"
                />
              </div>
              <div className="space-y-2">
                <Label>Про себе</Label>
                <Textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder="Коротко про спеціаліста..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveProfile} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Зберегти
                </Button>
                <Button variant="outline" onClick={() => setEditMode(false)}>
                  Скасувати
                </Button>
              </div>
            </>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{specialist.email || 'Не вказано'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{specialist.phone || 'Не вказано'}</span>
              </div>
              {specialist.bio && (
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">{specialist.bio}</p>
                </div>
              )}
              <div className="md:col-span-2">
                <Badge variant={specialist.google_connected ? 'default' : 'secondary'}>
                  <Calendar className="h-3 w-3 mr-1" />
                  Google Calendar: {specialist.google_connected ? 'Підключено' : 'Не підключено'}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Navigation */}
      <Card>
        <CardHeader>
          <CardTitle>Швидка навігація</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {navigationItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${item.bgColor}`}>
                      <item.icon className={`h-4 w-4 ${item.color}`} />
                    </div>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {item.count} {item.countLabel}
                    </span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
