'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, ExternalLink, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { cn } from '@/lib/utils'
import { inventoryApi, Brand, Collection, getFileUrl } from '@/lib/api'

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedBrands, setExpandedBrands] = useState<Set<number>>(new Set())

  // Brand dialog
  const [brandDialogOpen, setBrandDialogOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [brandForm, setBrandForm] = useState({
    name: '',
    slug: '',
    logo_url: '',
    description: '',
    website: '',
  })
  const [savingBrand, setSavingBrand] = useState(false)

  // Collection dialog
  const [collectionDialogOpen, setCollectionDialogOpen] = useState(false)
  const [editingCollection, setEditingCollection] = useState<{ brandId: number; collection: Collection | null }>({ brandId: 0, collection: null })
  const [collectionForm, setCollectionForm] = useState({
    name: '',
    slug: '',
    image_url: '',
    description: '',
  })
  const [savingCollection, setSavingCollection] = useState(false)

  // Delete dialogs
  const [deleteBrandId, setDeleteBrandId] = useState<number | null>(null)
  const [deleteCollection, setDeleteCollection] = useState<{ brandId: number; collectionId: number } | null>(null)

  useEffect(() => {
    loadBrands()
  }, [])

  const loadBrands = async () => {
    try {
      const data = await inventoryApi.getBrands()
      setBrands(data)
    } catch (error) {
      console.error('Error loading brands:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleBrandExpanded = (id: number) => {
    setExpandedBrands(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Brand operations
  const openBrandDialog = (brand?: Brand) => {
    if (brand) {
      setEditingBrand(brand)
      setBrandForm({
        name: brand.name,
        slug: brand.slug,
        logo_url: brand.logo_url || '',
        description: brand.description || '',
        website: brand.website || '',
      })
    } else {
      setEditingBrand(null)
      setBrandForm({ name: '', slug: '', logo_url: '', description: '', website: '' })
    }
    setBrandDialogOpen(true)
  }

  const saveBrand = async () => {
    setSavingBrand(true)
    try {
      const slug = brandForm.slug || brandForm.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      if (editingBrand) {
        await inventoryApi.updateBrand(editingBrand.id, { ...brandForm, slug })
      } else {
        await inventoryApi.createBrand({ ...brandForm, slug })
      }
      setBrandDialogOpen(false)
      loadBrands()
    } catch (error) {
      console.error('Error saving brand:', error)
    } finally {
      setSavingBrand(false)
    }
  }

  const deleteBrand = async () => {
    if (!deleteBrandId) return
    try {
      await inventoryApi.deleteBrand(deleteBrandId)
      setDeleteBrandId(null)
      loadBrands()
    } catch (error) {
      console.error('Error deleting brand:', error)
    }
  }

  // Collection operations
  const openCollectionDialog = (brandId: number, collection?: Collection) => {
    if (collection) {
      setEditingCollection({ brandId, collection })
      setCollectionForm({
        name: collection.name,
        slug: collection.slug,
        image_url: collection.image_url || '',
        description: collection.description || '',
      })
    } else {
      setEditingCollection({ brandId, collection: null })
      setCollectionForm({ name: '', slug: '', image_url: '', description: '' })
    }
    setCollectionDialogOpen(true)
  }

  const saveCollection = async () => {
    setSavingCollection(true)
    try {
      const slug = collectionForm.slug || collectionForm.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      if (editingCollection.collection) {
        await inventoryApi.updateCollection(editingCollection.collection.id, { ...collectionForm, slug })
      } else {
        await inventoryApi.createCollection({ brand_id: editingCollection.brandId, ...collectionForm, slug })
      }
      setCollectionDialogOpen(false)
      loadBrands()
    } catch (error) {
      console.error('Error saving collection:', error)
    } finally {
      setSavingCollection(false)
    }
  }

  const deleteCollectionHandler = async () => {
    if (!deleteCollection) return
    try {
      await inventoryApi.deleteCollection(deleteCollection.collectionId)
      setDeleteCollection(null)
      loadBrands()
    } catch (error) {
      console.error('Error deleting collection:', error)
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Бренди</h1>
          <p className="text-sm text-muted-foreground">
            {brands.length} бренд{brands.length === 1 ? '' : brands.length < 5 ? 'и' : 'ів'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/inventory">
            <Button variant="outline">Назад до складу</Button>
          </Link>
          <Button onClick={() => openBrandDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Додати бренд
          </Button>
        </div>
      </div>

      {brands.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Брендів ще немає</p>
            <Button onClick={() => openBrandDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Додати перший бренд
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {brands.map((brand) => (
            <Card key={brand.id}>
              <CardHeader className="py-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleBrandExpanded(brand.id)}
                    className="p-1 hover:bg-muted rounded"
                  >
                    {expandedBrands.has(brand.id) ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </button>

                  {brand.logo_url ? (
                    <img
                      src={getFileUrl(brand.logo_url)}
                      alt={brand.name}
                      className="h-10 w-10 object-contain rounded"
                    />
                  ) : (
                    <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}

                  <div className="flex-1">
                    <CardTitle className="text-lg">{brand.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {brand.items_count || 0} товар{brand.items_count === 1 ? '' : brand.items_count && brand.items_count < 5 ? 'и' : 'ів'}
                      {brand.collections && brand.collections.length > 0 && ` · ${brand.collections.length} колекц${brand.collections.length === 1 ? 'ія' : brand.collections.length < 5 ? 'ії' : 'ій'}`}
                    </p>
                  </div>

                  {brand.website && (
                    <a href={brand.website} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}

                  <Button variant="ghost" size="sm" onClick={() => openBrandDialog(brand)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteBrandId(brand.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>

              {expandedBrands.has(brand.id) && (
                <CardContent className="pt-0">
                  {brand.description && (
                    <p className="text-sm text-muted-foreground mb-4">{brand.description}</p>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">Колекції</h4>
                      <Button variant="outline" size="sm" onClick={() => openCollectionDialog(brand.id)}>
                        <Plus className="mr-1 h-3 w-3" />
                        Додати колекцію
                      </Button>
                    </div>

                    {brand.collections && brand.collections.length > 0 ? (
                      <div className="space-y-2 mt-2">
                        {brand.collections.map((collection) => (
                          <div
                            key={collection.id}
                            className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                          >
                            {collection.image_url ? (
                              <img
                                src={getFileUrl(collection.image_url)}
                                alt={collection.name}
                                className="h-8 w-8 object-cover rounded"
                              />
                            ) : (
                              <div className="h-8 w-8 bg-muted rounded flex items-center justify-center">
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-sm">{collection.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {collection.items_count || 0} товар{collection.items_count === 1 ? '' : collection.items_count && collection.items_count < 5 ? 'и' : 'ів'}
                              </p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => openCollectionDialog(brand.id, collection)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setDeleteCollection({ brandId: brand.id, collectionId: collection.id })}>
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Колекцій ще немає
                      </p>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Brand Dialog */}
      <Dialog open={brandDialogOpen} onOpenChange={setBrandDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBrand ? 'Редагувати бренд' : 'Новий бренд'}</DialogTitle>
            <DialogDescription>
              {editingBrand ? 'Змініть дані бренду' : 'Заповніть дані для нового бренду'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="brand-name">Назва *</Label>
              <Input
                id="brand-name"
                value={brandForm.name}
                onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                placeholder="Назва бренду"
              />
            </div>
            <div>
              <Label htmlFor="brand-slug">Slug (URL)</Label>
              <Input
                id="brand-slug"
                value={brandForm.slug}
                onChange={(e) => setBrandForm({ ...brandForm, slug: e.target.value })}
                placeholder="brand-name (згенерується автоматично)"
              />
            </div>
            <div>
              <Label htmlFor="brand-logo">URL логотипу</Label>
              <Input
                id="brand-logo"
                value={brandForm.logo_url}
                onChange={(e) => setBrandForm({ ...brandForm, logo_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label htmlFor="brand-website">Вебсайт</Label>
              <Input
                id="brand-website"
                value={brandForm.website}
                onChange={(e) => setBrandForm({ ...brandForm, website: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label htmlFor="brand-description">Опис</Label>
              <Textarea
                id="brand-description"
                value={brandForm.description}
                onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })}
                placeholder="Опис бренду"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBrandDialogOpen(false)}>
              Скасувати
            </Button>
            <Button onClick={saveBrand} disabled={!brandForm.name || savingBrand}>
              {savingBrand ? 'Збереження...' : 'Зберегти'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Collection Dialog */}
      <Dialog open={collectionDialogOpen} onOpenChange={setCollectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCollection.collection ? 'Редагувати колекцію' : 'Нова колекція'}</DialogTitle>
            <DialogDescription>
              {editingCollection.collection ? 'Змініть дані колекції' : 'Заповніть дані для нової колекції'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="collection-name">Назва *</Label>
              <Input
                id="collection-name"
                value={collectionForm.name}
                onChange={(e) => setCollectionForm({ ...collectionForm, name: e.target.value })}
                placeholder="Назва колекції"
              />
            </div>
            <div>
              <Label htmlFor="collection-slug">Slug (URL)</Label>
              <Input
                id="collection-slug"
                value={collectionForm.slug}
                onChange={(e) => setCollectionForm({ ...collectionForm, slug: e.target.value })}
                placeholder="collection-name (згенерується автоматично)"
              />
            </div>
            <div>
              <Label htmlFor="collection-image">URL зображення</Label>
              <Input
                id="collection-image"
                value={collectionForm.image_url}
                onChange={(e) => setCollectionForm({ ...collectionForm, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label htmlFor="collection-description">Опис</Label>
              <Textarea
                id="collection-description"
                value={collectionForm.description}
                onChange={(e) => setCollectionForm({ ...collectionForm, description: e.target.value })}
                placeholder="Опис колекції"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCollectionDialogOpen(false)}>
              Скасувати
            </Button>
            <Button onClick={saveCollection} disabled={!collectionForm.name || savingCollection}>
              {savingCollection ? 'Збереження...' : 'Зберегти'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Brand Dialog */}
      <AlertDialog open={!!deleteBrandId} onOpenChange={() => setDeleteBrandId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити бренд?</AlertDialogTitle>
            <AlertDialogDescription>
              Ця дія видалить бренд та всі його колекції. Товари залишаться, але втратять прив'язку до бренду.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction onClick={deleteBrand} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Видалити
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Collection Dialog */}
      <AlertDialog open={!!deleteCollection} onOpenChange={() => setDeleteCollection(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити колекцію?</AlertDialogTitle>
            <AlertDialogDescription>
              Ця дія видалить колекцію. Товари залишаться, але втратять прив'язку до колекції.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction onClick={deleteCollectionHandler} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Видалити
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
