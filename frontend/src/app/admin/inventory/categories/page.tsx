'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Edit2, Trash2, ChevronRight, FolderTree } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { inventoryApi, InventoryCategory } from '@/lib/api'

export default function InventoryCategoriesPage() {
  const [categories, setCategories] = useState<InventoryCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<InventoryCategory | null>(null)
  const [deleteCategory, setDeleteCategory] = useState<InventoryCategory | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [parentId, setParentId] = useState<number | undefined>()
  const [photoLevel, setPhotoLevel] = useState<string>('')

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    setLoading(true)
    try {
      const data = await inventoryApi.getCategoriesTree()
      setCategories(data)
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const openCreateDialog = (parent?: InventoryCategory) => {
    setEditingCategory(null)
    setName('')
    setDescription('')
    setParentId(parent?.id)
    setPhotoLevel('')
    setShowDialog(true)
  }

  const openEditDialog = (category: InventoryCategory) => {
    setEditingCategory(category)
    setName(category.name)
    setDescription(category.description || '')
    setParentId(category.parent_id || undefined)
    setPhotoLevel(category.photo_level?.toString() || '')
    setShowDialog(true)
  }

  const handleSave = async () => {
    if (!name.trim()) return

    setSaving(true)
    try {
      if (editingCategory) {
        await inventoryApi.updateCategory(editingCategory.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          parent_id: parentId,
          photo_level: photoLevel ? parseInt(photoLevel) : undefined,
        })
      } else {
        await inventoryApi.createCategory({
          name: name.trim(),
          description: description.trim() || undefined,
          parent_id: parentId,
          photo_level: photoLevel ? parseInt(photoLevel) : undefined,
        })
      }
      setShowDialog(false)
      loadCategories()
    } catch (error) {
      console.error('Error saving category:', error)
      alert('Помилка при збереженні категорії')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteCategory) return

    try {
      await inventoryApi.deleteCategory(deleteCategory.id)
      setShowDeleteDialog(false)
      setDeleteCategory(null)
      loadCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Помилка при видаленні категорії')
    }
  }

  // Flatten categories for parent select (excluding self and children)
  const flattenForSelect = (
    cats: InventoryCategory[],
    level = 0,
    excludeId?: number
  ): Array<InventoryCategory & { level: number }> => {
    let result: Array<InventoryCategory & { level: number }> = []
    for (const cat of cats) {
      if (cat.id !== excludeId) {
        result.push({ ...cat, level })
        if (cat.children && cat.children.length > 0) {
          result = result.concat(flattenForSelect(cat.children, level + 1, excludeId))
        }
      }
    }
    return result
  }

  const flatCategories = flattenForSelect(categories, 0, editingCategory?.id)

  // Render category tree
  const renderCategory = (category: InventoryCategory, level = 0) => (
    <div key={category.id}>
      <div
        className={`flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg ${level > 0 ? 'ml-' + (level * 6) : ''}`}
        style={{ marginLeft: level * 24 }}
      >
        <div className="flex items-center gap-3">
          <FolderTree className="h-5 w-5 text-muted-foreground" />
          <div>
            <div className="font-medium">{category.name}</div>
            {category.description && (
              <div className="text-sm text-muted-foreground">{category.description}</div>
            )}
          </div>
          <Badge variant="secondary">{category.items_count} товарів</Badge>
          {category.photo_level !== null && category.photo_level !== undefined && (
            <Badge variant="outline">Фото з рівня {category.photo_level}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => openCreateDialog(category)}>
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => openEditDialog(category)}>
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDeleteCategory(category)
              setShowDeleteDialog(true)
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {category.children && category.children.length > 0 && (
        <div>
          {category.children.map(child => renderCategory(child, level + 1))}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/inventory">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Категорії товарів</h1>
            <p className="text-sm text-muted-foreground">
              Управління деревом категорій
            </p>
          </div>
        </div>
        <Button onClick={() => openCreateDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Нова категорія
        </Button>
      </div>

      {/* Categories Tree */}
      <Card>
        <CardHeader>
          <CardTitle>Дерево категорій</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : categories.length > 0 ? (
            <div className="space-y-1">
              {categories.map(cat => renderCategory(cat))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FolderTree className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Категорій ще немає</p>
              <Button className="mt-4" onClick={() => openCreateDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Створити першу категорію
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Редагувати категорію' : 'Нова категорія'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Назва *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Введіть назву категорії"
              />
            </div>

            <div className="space-y-2">
              <Label>Опис</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Опис категорії"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Батьківська категорія</Label>
              <Select
                value={parentId?.toString() || 'none'}
                onValueChange={(v) => setParentId(v === 'none' ? undefined : parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Оберіть категорію" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Кореньова категорія</SelectItem>
                  {flatCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {'  '.repeat(cat.level)}{cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Рівень для фото</Label>
              <Input
                type="number"
                min="0"
                value={photoLevel}
                onChange={(e) => setPhotoLevel(e.target.value)}
                placeholder="Наслідується від батька"
              />
              <p className="text-xs text-muted-foreground">
                На якому рівні вкладеності показувати фото товарів (0 = на цьому рівні)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Скасувати
            </Button>
            <Button onClick={handleSave} disabled={!name.trim() || saving}>
              {saving ? 'Збереження...' : 'Зберегти'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити категорію?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteCategory?.children && deleteCategory.children.length > 0
                ? 'Ця категорія має підкатегорії, які також будуть видалені.'
                : 'Товари в цій категорії залишаться без категорії.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Видалити
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
