'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { servicesApi, categoriesApi, ServiceCategory } from '@/lib/api'

export default function NewServicePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_minutes: 60,
    price: 0,
    category_id: null as number | null,
  })

  useEffect(() => {
    categoriesApi.getTree().then(setCategories).catch(console.error)
  }, [])

  // Flatten categories tree for dropdown with indentation levels
  const getFlatCategories = (cats: ServiceCategory[], level = 0): { id: number; name: string; level: number }[] => {
    const result: { id: number; name: string; level: number }[] = []
    cats.forEach(c => {
      result.push({ id: c.id, name: c.name, level })
      if (c.children && c.children.length > 0) {
        result.push(...getFlatCategories(c.children, level + 1))
      }
    })
    return result
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const service = await servicesApi.create({
        ...formData,
        category_id: formData.category_id || undefined,
      })
      router.push(`/admin/services/${service.id}`)
    } catch (error) {
      console.error('Error creating service:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/services">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Нова послуга</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Основна інформація</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Категорія</Label>
              <select
                id="category"
                value={formData.category_id || ''}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value ? Number(e.target.value) : null })}
                className="w-full h-10 px-3 border rounded-md bg-background text-sm"
              >
                <option value="">Без категорії</option>
                {getFlatCategories(categories).map(c => (
                  <option key={c.id} value={c.id}>
                    {'—'.repeat(c.level)} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Назва *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Назва послуги"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Опис</Label>
              <textarea
                id="description"
                className="w-full min-h-[120px] px-3 py-2 border rounded-md text-sm"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Детальний опис процедури, показання, протипоказання..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Тривалість (хв) *</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                  min={15}
                  step={15}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Ціна (грн) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  min={0}
                  step={0.01}
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={saving}>
                {saving ? 'Збереження...' : 'Створити послугу'}
              </Button>
              <Link href="/admin/services">
                <Button type="button" variant="outline">
                  Скасувати
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-gray-500">
            Після створення послуги ви зможете додати етапи процедури та препарати, які використовуються.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
