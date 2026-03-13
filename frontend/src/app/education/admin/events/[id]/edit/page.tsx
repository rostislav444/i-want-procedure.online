'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { educationApi, Offering } from '@/lib/api'

function toLocalDatetime(isoString: string): string {
  const d = new Date(isoString)
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

export default function EditEventPage() {
  const router = useRouter()
  const params = useParams()
  const id = Number(params.id)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [offerings, setOfferings] = useState<Offering[]>([])
  const [form, setForm] = useState({
    offering_id: null as number | null,
    title: '',
    description: '',
    cover_image_url: '',
    start_at: '',
    end_at: '',
    is_multi_day: false,
    venue_name: '',
    venue_address: '',
    is_online: false,
    price: '',
    early_bird_price: '',
    early_bird_until: '',
    max_participants: '',
    is_published: false,
    is_cancelled: false,
  })

  useEffect(() => {
    Promise.all([
      educationApi.getEvent(id),
      educationApi.getOfferings(),
    ]).then(([event, offs]) => {
      setOfferings(offs)
      setForm({
        offering_id: event.offering_id || null,
        title: event.title,
        description: event.description || '',
        cover_image_url: event.cover_image_url || '',
        start_at: toLocalDatetime(event.start_at),
        end_at: event.end_at ? toLocalDatetime(event.end_at) : '',
        is_multi_day: event.is_multi_day,
        venue_name: event.venue_name || '',
        venue_address: event.venue_address || '',
        is_online: event.is_online,
        price: event.price ? (event.price / 100).toString() : '',
        early_bird_price: event.early_bird_price ? (event.early_bird_price / 100).toString() : '',
        early_bird_until: event.early_bird_until ? toLocalDatetime(event.early_bird_until) : '',
        max_participants: event.max_participants?.toString() || '',
        is_published: event.is_published,
        is_cancelled: event.is_cancelled,
      })
      setLoading(false)
    }).catch(() => {
      router.push('/education/admin')
    })
  }, [id, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.start_at) return
    setSaving(true)
    try {
      await educationApi.updateEvent(id, {
        offering_id: form.offering_id,
        title: form.title,
        description: form.description || undefined,
        cover_image_url: form.cover_image_url || undefined,
        start_at: new Date(form.start_at).toISOString(),
        end_at: form.end_at ? new Date(form.end_at).toISOString() : undefined,
        is_multi_day: form.is_multi_day,
        venue_name: form.venue_name || undefined,
        venue_address: form.venue_address || undefined,
        is_online: form.is_online,
        price: form.price ? Math.round(parseFloat(form.price) * 100) : 0,
        early_bird_price: form.early_bird_price ? Math.round(parseFloat(form.early_bird_price) * 100) : undefined,
        early_bird_until: form.early_bird_until ? new Date(form.early_bird_until).toISOString() : undefined,
        max_participants: form.max_participants ? parseInt(form.max_participants) : undefined,
        is_published: form.is_published,
        is_cancelled: form.is_cancelled,
      })
      router.push(`/education/admin/events/${id}`)
    } catch (err) {
      console.error('Failed to update event:', err)
      alert('Помилка при оновленні')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Button variant="ghost" className="mb-4" onClick={() => router.push(`/education/admin/events/${id}`)}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Назад
      </Button>

      <h1 className="text-2xl font-bold mb-6">Редагування події</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Основна інформація</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Назва *</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div>
              <Label>Пов'язаний продукт</Label>
              <Select
                value={form.offering_id?.toString() || ''}
                onValueChange={v => setForm({ ...form, offering_id: v ? parseInt(v) : null })}
              >
                <SelectTrigger><SelectValue placeholder="Оберіть" /></SelectTrigger>
                <SelectContent>
                  {offerings.map(o => (
                    <SelectItem key={o.id} value={o.id.toString()}>{o.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Опис</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={5} />
            </div>
            <div>
              <Label>Обкладинка (URL)</Label>
              <Input value={form.cover_image_url} onChange={e => setForm({ ...form, cover_image_url: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Дата та місце</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Початок *</Label>
                <Input type="datetime-local" value={form.start_at} onChange={e => setForm({ ...form, start_at: e.target.value })} required />
              </div>
              <div>
                <Label>Кінець</Label>
                <Input type="datetime-local" value={form.end_at} onChange={e => setForm({ ...form, end_at: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_multi_day" checked={form.is_multi_day} onChange={e => setForm({ ...form, is_multi_day: e.target.checked })} className="rounded" />
                <Label htmlFor="is_multi_day">Багатоденна</Label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_online" checked={form.is_online} onChange={e => setForm({ ...form, is_online: e.target.checked })} className="rounded" />
                <Label htmlFor="is_online">Онлайн</Label>
              </div>
            </div>
            {!form.is_online && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Назва закладу</Label>
                  <Input value={form.venue_name} onChange={e => setForm({ ...form, venue_name: e.target.value })} />
                </div>
                <div>
                  <Label>Адреса</Label>
                  <Input value={form.venue_address} onChange={e => setForm({ ...form, venue_address: e.target.value })} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Ціна та статус</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ціна (₴)</Label>
                <Input type="number" step="0.01" min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
              </div>
              <div>
                <Label>Макс. учасників</Label>
                <Input type="number" min="1" value={form.max_participants} onChange={e => setForm({ ...form, max_participants: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Early Bird ціна (₴)</Label>
                <Input type="number" step="0.01" min="0" value={form.early_bird_price} onChange={e => setForm({ ...form, early_bird_price: e.target.value })} />
              </div>
              <div>
                <Label>Early Bird до</Label>
                <Input type="datetime-local" value={form.early_bird_until} onChange={e => setForm({ ...form, early_bird_until: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_published" checked={form.is_published} onChange={e => setForm({ ...form, is_published: e.target.checked })} className="rounded" />
                <Label htmlFor="is_published">Опубліковано</Label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_cancelled" checked={form.is_cancelled} onChange={e => setForm({ ...form, is_cancelled: e.target.checked })} className="rounded" />
                <Label htmlFor="is_cancelled">Скасовано</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push(`/education/admin/events/${id}`)}>
            Скасувати
          </Button>
          <Button type="submit" disabled={saving || !form.title.trim() || !form.start_at}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Зберегти
          </Button>
        </div>
      </form>
    </div>
  )
}
