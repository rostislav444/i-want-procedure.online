'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { specialistsApi, positionsApi, SpecialistListItem, Position } from '@/lib/api'
import { useCompany } from '@/contexts/CompanyContext'
import {
  UserPlus,
  Calendar,
  Scissors,
  ChevronRight,
  Check,
  X,
  Copy,
  ExternalLink,
  Plus,
  Pencil,
  Trash2,
  Briefcase,
  Users,
} from 'lucide-react'

const POSITION_COLORS = [
  { value: 'blue', label: 'Синій', class: 'bg-blue-500', light: 'bg-blue-500/10 text-blue-700' },
  { value: 'purple', label: 'Фіолетовий', class: 'bg-purple-500', light: 'bg-purple-500/10 text-purple-700' },
  { value: 'green', label: 'Зелений', class: 'bg-green-500', light: 'bg-green-500/10 text-green-700' },
  { value: 'orange', label: 'Оранжевий', class: 'bg-orange-500', light: 'bg-orange-500/10 text-orange-700' },
  { value: 'pink', label: 'Рожевий', class: 'bg-pink-500', light: 'bg-pink-500/10 text-pink-700' },
  { value: 'cyan', label: 'Бірюзовий', class: 'bg-cyan-500', light: 'bg-cyan-500/10 text-cyan-700' },
  { value: 'yellow', label: 'Жовтий', class: 'bg-yellow-500', light: 'bg-yellow-500/10 text-yellow-700' },
  { value: 'red', label: 'Червоний', class: 'bg-red-500', light: 'bg-red-500/10 text-red-700' },
]

export default function TeamPage() {
  const router = useRouter()
  const { companyType, canManageTeam, selectedCompanyId, company } = useCompany()
  const [specialists, setSpecialists] = useState<SpecialistListItem[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [showInactive, setShowInactive] = useState(false)

  // Invite modal
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  // Position dialog
  const [positionDialogOpen, setPositionDialogOpen] = useState(false)
  const [editingPosition, setEditingPosition] = useState<Position | null>(null)
  const [positionFormData, setPositionFormData] = useState({
    name: '',
    description: '',
    color: 'blue',
  })
  const [savingPosition, setSavingPosition] = useState(false)

  // Delete position dialog
  const [deletePositionDialogOpen, setDeletePositionDialogOpen] = useState(false)
  const [positionToDelete, setPositionToDelete] = useState<Position | null>(null)
  const [deletingPosition, setDeletingPosition] = useState(false)

  const doctorBotName = process.env.NEXT_PUBLIC_DOCTOR_BOT_NAME || 'doctor_i_want_procedure_bot'
  const teamInviteLink = company ? `https://t.me/${doctorBotName}?start=team_${company.team_invite_code}` : ''

  const copyToClipboard = () => {
    navigator.clipboard.writeText(teamInviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    if (companyType && companyType !== 'clinic') {
      router.push('/admin')
      return
    }

    if (selectedCompanyId) {
      loadData()
    }
  }, [companyType, showInactive, selectedCompanyId])

  const loadData = async () => {
    if (!selectedCompanyId) return
    try {
      setLoading(true)
      const [specialistsData, positionsData] = await Promise.all([
        specialistsApi.getAll(selectedCompanyId, showInactive),
        positionsApi.getAll(),
      ])
      setSpecialists(specialistsData)
      setPositions(positionsData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Position management
  const openCreatePositionDialog = () => {
    setEditingPosition(null)
    setPositionFormData({ name: '', description: '', color: 'blue' })
    setPositionDialogOpen(true)
  }

  const openEditPositionDialog = (position: Position) => {
    setEditingPosition(position)
    setPositionFormData({
      name: position.name,
      description: position.description || '',
      color: position.color || 'blue',
    })
    setPositionDialogOpen(true)
  }

  const handleSavePosition = async () => {
    if (!positionFormData.name.trim()) return

    try {
      setSavingPosition(true)
      if (editingPosition) {
        await positionsApi.update(editingPosition.id, positionFormData)
      } else {
        await positionsApi.create(positionFormData)
      }
      await loadData()
      setPositionDialogOpen(false)
    } catch (error) {
      console.error('Failed to save position:', error)
    } finally {
      setSavingPosition(false)
    }
  }

  const openDeletePositionDialog = (position: Position) => {
    setPositionToDelete(position)
    setDeletePositionDialogOpen(true)
  }

  const handleDeletePosition = async () => {
    if (!positionToDelete) return

    try {
      setDeletingPosition(true)
      await positionsApi.delete(positionToDelete.id)
      await loadData()
      setDeletePositionDialogOpen(false)
      setPositionToDelete(null)
    } catch (error) {
      console.error('Failed to delete position:', error)
    } finally {
      setDeletingPosition(false)
    }
  }

  const getColorClass = (colorValue: string | null) => {
    const color = POSITION_COLORS.find(c => c.value === colorValue)
    return color?.class || 'bg-gray-500'
  }

  const getColorLightClass = (colorValue: string | null) => {
    const color = POSITION_COLORS.find(c => c.value === colorValue)
    return color?.light || 'bg-gray-500/10 text-gray-700'
  }

  // Group specialists by position
  const getSpecialistsByPosition = () => {
    const grouped: { position: Position | null; specialists: SpecialistListItem[] }[] = []

    // Add groups for each position
    positions.forEach(position => {
      const positionSpecialists = specialists.filter(s => s.position_id === position.id)
      if (positionSpecialists.length > 0) {
        grouped.push({ position, specialists: positionSpecialists })
      }
    })

    // Add unassigned specialists
    const unassigned = specialists.filter(s => !s.position_id)
    if (unassigned.length > 0) {
      grouped.push({ position: null, specialists: unassigned })
    }

    return grouped
  }

  // Count specialists per position
  const getSpecialistsCountForPosition = (positionId: number) => {
    return specialists.filter(s => s.position_id === positionId).length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const groupedSpecialists = getSpecialistsByPosition()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Команда</h1>
          <p className="text-muted-foreground">
            Управління спеціалістами та посадами
          </p>
        </div>
        {canManageTeam && (
          <Button onClick={() => setInviteModalOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Запросити спеціаліста
          </Button>
        )}
      </div>

      {/* Positions Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Посади
          </h2>
          {canManageTeam && (
            <Button variant="outline" size="sm" onClick={openCreatePositionDialog}>
              <Plus className="h-4 w-4 mr-1" />
              Додати
            </Button>
          )}
        </div>

        {positions.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-muted-foreground">
              <p className="text-sm">Посади ще не створені</p>
              {canManageTeam && (
                <Button variant="link" size="sm" onClick={openCreatePositionDialog}>
                  Створити першу посаду
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {positions.map((position) => {
              const specialistsCount = getSpecialistsCountForPosition(position.id)
              return (
                <div
                  key={position.id}
                  className="relative group"
                >
                  <Link href={`/admin/settings/positions/${position.id}`}>
                    <div className={`p-3 rounded-lg border transition-all hover:shadow-md ${getColorLightClass(position.color)}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2.5 h-2.5 rounded-full ${getColorClass(position.color)}`} />
                        <span className="font-medium text-sm truncate">{position.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs opacity-75">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {specialistsCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Scissors className="h-3 w-3" />
                          {position.services_count}
                        </span>
                      </div>
                    </div>
                  </Link>
                  {canManageTeam && (
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                      <button
                        onClick={(e) => { e.preventDefault(); openEditPositionDialog(position); }}
                        className="p-1 rounded bg-background/80 hover:bg-background shadow-sm"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => { e.preventDefault(); openDeletePositionDialog(position); }}
                        className="p-1 rounded bg-background/80 hover:bg-background shadow-sm"
                        disabled={position.services_count > 0}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
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

      {/* Specialists by Position */}
      {specialists.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              У вас ще немає спеціалістів
            </p>
            {canManageTeam && (
              <Button onClick={() => setInviteModalOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Додати першого спеціаліста
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedSpecialists.map(({ position, specialists: groupSpecialists }) => (
            <div key={position?.id || 'unassigned'} className="space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                {position ? (
                  <>
                    <div className={`w-3 h-3 rounded-full ${getColorClass(position.color)}`} />
                    {position.name}
                    <Badge variant="secondary" className="text-xs">{groupSpecialists.length}</Badge>
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 rounded-full bg-gray-400" />
                    Без посади
                    <Badge variant="secondary" className="text-xs">{groupSpecialists.length}</Badge>
                  </>
                )}
              </h3>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {groupSpecialists.map((specialist) => (
                  <Link key={specialist.id} href={`/admin/team/${specialist.id}`}>
                    <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium flex-shrink-0">
                            {specialist.first_name[0]}{specialist.last_name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">
                              {specialist.first_name} {specialist.last_name}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Scissors className="h-3 w-3" />
                                {specialist.services_count}
                              </span>
                              {specialist.is_active ? (
                                <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600 px-1.5 py-0">
                                  <Check className="h-2.5 w-2.5" />
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs bg-red-500/10 text-red-600 px-1.5 py-0">
                                  <X className="h-2.5 w-2.5" />
                                </Badge>
                              )}
                              {specialist.google_connected && (
                                <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-600 px-1.5 py-0">
                                  <Calendar className="h-2.5 w-2.5" />
                                </Badge>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invite Specialist Modal */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Запросити спеціаліста</DialogTitle>
            <DialogDescription>
              Поділіться цим посиланням зі спеціалістом, щоб він приєднався до вашої команди
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-2">Посилання для запрошення</p>
              <p className="text-sm font-mono break-all select-all">
                {teamInviteLink}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="default"
                className="flex-1"
                onClick={copyToClipboard}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    Скопійовано
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Копіювати
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                asChild
              >
                <a href={teamInviteLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Відкрити
                </a>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Спеціаліст може прив'язати існуючий акаунт або зареєструватися через цей бот.
              Після реєстрації він автоматично з'явиться у вашій команді.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Position Dialog */}
      <Dialog open={positionDialogOpen} onOpenChange={setPositionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPosition ? 'Редагувати посаду' : 'Нова посада'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Назва посади *</Label>
              <Input
                id="name"
                value={positionFormData.name}
                onChange={(e) => setPositionFormData({ ...positionFormData, name: e.target.value })}
                placeholder="Наприклад: Косметолог"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Опис</Label>
              <Textarea
                id="description"
                value={positionFormData.description}
                onChange={(e) => setPositionFormData({ ...positionFormData, description: e.target.value })}
                placeholder="Короткий опис посади..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Колір</Label>
              <div className="flex flex-wrap gap-2">
                {POSITION_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setPositionFormData({ ...positionFormData, color: color.value })}
                    className={`w-8 h-8 rounded-full ${color.class} transition-transform ${
                      positionFormData.color === color.value
                        ? 'ring-2 ring-offset-2 ring-primary scale-110'
                        : 'hover:scale-110'
                    }`}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPositionDialogOpen(false)}>
              Скасувати
            </Button>
            <Button onClick={handleSavePosition} disabled={!positionFormData.name.trim() || savingPosition}>
              {savingPosition ? 'Збереження...' : editingPosition ? 'Зберегти' : 'Створити'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Position Confirmation Dialog */}
      <AlertDialog open={deletePositionDialogOpen} onOpenChange={setDeletePositionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити посаду?</AlertDialogTitle>
            <AlertDialogDescription>
              Ви впевнені, що хочете видалити посаду &quot;{positionToDelete?.name}&quot;?
              Ця дія не може бути скасована.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePosition}
              disabled={deletingPosition}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingPosition ? 'Видалення...' : 'Видалити'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
