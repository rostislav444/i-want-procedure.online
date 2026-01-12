'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
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
import { positionsApi, Position } from '@/lib/api'
import { useCompany } from '@/contexts/CompanyContext'
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Briefcase,
  Scissors,
  Settings,
} from 'lucide-react'

const POSITION_COLORS = [
  { value: 'blue', label: 'Синій', class: 'bg-blue-500' },
  { value: 'purple', label: 'Фіолетовий', class: 'bg-purple-500' },
  { value: 'green', label: 'Зелений', class: 'bg-green-500' },
  { value: 'orange', label: 'Оранжевий', class: 'bg-orange-500' },
  { value: 'pink', label: 'Рожевий', class: 'bg-pink-500' },
  { value: 'cyan', label: 'Бірюзовий', class: 'bg-cyan-500' },
  { value: 'yellow', label: 'Жовтий', class: 'bg-yellow-500' },
  { value: 'red', label: 'Червоний', class: 'bg-red-500' },
]

export default function SettingsPage() {
  const router = useRouter()
  const { companyType, canManageTeam } = useCompany()

  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPosition, setEditingPosition] = useState<Position | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: 'blue',
  })
  const [saving, setSaving] = useState(false)

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [positionToDelete, setPositionToDelete] = useState<Position | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (companyType && companyType !== 'clinic') {
      router.push('/admin')
      return
    }
    loadPositions()
  }, [companyType])

  const loadPositions = async () => {
    try {
      setLoading(true)
      const data = await positionsApi.getAll()
      setPositions(data)
    } catch (error) {
      console.error('Failed to load positions:', error)
    } finally {
      setLoading(false)
    }
  }

  const openCreateDialog = () => {
    setEditingPosition(null)
    setFormData({ name: '', description: '', color: 'blue' })
    setDialogOpen(true)
  }

  const openEditDialog = (position: Position) => {
    setEditingPosition(position)
    setFormData({
      name: position.name,
      description: position.description || '',
      color: position.color || 'blue',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) return

    try {
      setSaving(true)
      if (editingPosition) {
        await positionsApi.update(editingPosition.id, formData)
      } else {
        await positionsApi.create(formData)
      }
      await loadPositions()
      setDialogOpen(false)
    } catch (error) {
      console.error('Failed to save position:', error)
    } finally {
      setSaving(false)
    }
  }

  const openDeleteDialog = (position: Position) => {
    setPositionToDelete(position)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!positionToDelete) return

    try {
      setDeleting(true)
      await positionsApi.delete(positionToDelete.id)
      await loadPositions()
      setDeleteDialogOpen(false)
      setPositionToDelete(null)
    } catch (error) {
      console.error('Failed to delete position:', error)
    } finally {
      setDeleting(false)
    }
  }

  const getColorClass = (colorValue: string | null) => {
    const color = POSITION_COLORS.find(c => c.value === colorValue)
    return color?.class || 'bg-gray-500'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Only clinic managers/owners can access this page
  if (companyType !== 'clinic') {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Налаштування клініки
        </h1>
        <p className="text-muted-foreground">
          Управління посадами та структурою клініки
        </p>
      </div>

      {/* Positions Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Посади
            </CardTitle>
            <CardDescription>
              Посади визначають ролі спеціалістів та послуги, які вони можуть надавати
            </CardDescription>
          </div>
          {canManageTeam && (
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Додати посаду
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {positions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Посади ще не створені</p>
              <p className="text-sm">
                Створіть посади, щоб призначати їх спеціалістам та прив&apos;язувати послуги
              </p>
              {canManageTeam && (
                <Button variant="outline" className="mt-4" onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Створити першу посаду
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {positions.map((position) => (
                <div
                  key={position.id}
                  className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors group"
                >
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                  <div className={`w-4 h-4 rounded-full ${getColorClass(position.color)}`} />
                  <Link href={`/admin/settings/positions/${position.id}`} className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium group-hover:text-primary transition-colors">{position.name}</p>
                      <Badge variant="secondary" className="text-xs">
                        <Scissors className="h-3 w-3 mr-1" />
                        {position.services_count} послуг
                      </Badge>
                    </div>
                    {position.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {position.description}
                      </p>
                    )}
                  </Link>
                  {canManageTeam && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.preventDefault(); openEditDialog(position); }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.preventDefault(); openDeleteDialog(position); }}
                        disabled={position.services_count > 0}
                        title={position.services_count > 0 ? 'Спочатку видаліть або перенесіть послуги' : ''}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Як працюють посади</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
              1
            </div>
            <div>
              <p className="font-medium text-foreground">Створіть посади</p>
              <p>Визначте ролі в вашій клініці: Косметолог, Масажист, Лікар тощо</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
              2
            </div>
            <div>
              <p className="font-medium text-foreground">Прив&apos;яжіть послуги</p>
              <p>На сторінці послуг оберіть, до якої посади належить кожна послуга</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
              3
            </div>
            <div>
              <p className="font-medium text-foreground">Призначте спеціалістів</p>
              <p>Спеціалісти з певною посадою автоматично отримують доступ до відповідних послуг</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Наприклад: Косметолог"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Опис</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`w-8 h-8 rounded-full ${color.class} transition-transform ${
                      formData.color === color.value
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
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Скасувати
            </Button>
            <Button onClick={handleSave} disabled={!formData.name.trim() || saving}>
              {saving ? 'Збереження...' : editingPosition ? 'Зберегти' : 'Створити'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
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
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Видалення...' : 'Видалити'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
