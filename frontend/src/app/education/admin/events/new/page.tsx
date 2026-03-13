'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Plus, Trash2, Ticket } from 'lucide-react'
import { educationApi, type Offering, type TicketTypeCreate } from '@/lib/api'

type LocalTicket = TicketTypeCreate & { _key: number }

export default function NewEventPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
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
    online_link: '',
    price: '',
    early_bird_price: '',
    early_bird_until: '',
    max_participants: '',
    is_published: false,
  })

  const [hasTickets, setHasTickets] = useState(false)
  const [tickets, setTickets] = useState<LocalTicket[]>([])
  const [ticketKey, setTicketKey] = useState(0)

  useEffect(() => {
    educationApi.getOfferings().then(setOfferings).catch(() => {})
  }, [])

  const addTicket = () => {
    setTickets(t => [...t, { _key: ticketKey, name: '', price: 0, quantity: null, description: '', is_active: true, order: t.length }])
    setTicketKey(k => k + 1)
  }

  const removeTicket = (key: number) =>
    setTickets(t => t.filter(x => x._key !== key))

  const updateTicket = (key: number, patch: Partial<LocalTicket>) =>
    setTickets(t => t.map(x => x._key === key ? { ...x, ...patch } : x))

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  const setBool = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.checked }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.start_at) return
    setSaving(true)
    try {
      const event = await educationApi.createEvent({
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
        online_link: form.online_link || undefined,
        price: (!hasTickets && form.price) ? Math.round(parseFloat(form.price) * 100) : 0,
        early_bird_price: form.early_bird_price ? Math.round(parseFloat(form.early_bird_price) * 100) : undefined,
        early_bird_until: form.early_bird_until ? new Date(form.early_bird_until).toISOString() : undefined,
        max_participants: form.max_participants ? parseInt(form.max_participants) : undefined,
        is_published: form.is_published,
      })

      if (hasTickets && tickets.length > 0) {
        await Promise.all(
          tickets.filter(t => t.name.trim()).map(t =>
            educationApi.createTicketType(event.id, {
              name: t.name,
              description: t.description || undefined,
              price: t.price,
              quantity: t.quantity ?? undefined,
              is_active: true,
              order: t.order,
            })
          )
        )
      }

      router.push('/education/admin/events')
    } catch (err) {
      console.error(err)
      alert('Помилка при створенні')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-semibold">Нова подія</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic info */}
        <section className="rounded-xl border p-5 space-y-4">
          <h2 className="font-medium text-sm">Основна інформація</h2>

          <div>
            <label className="label">Назва події *</label>
            <input value={form.title} onChange={set('title')} placeholder="Майстер-клас з контурної пластики" required className="field mt-1" />
          </div>

          <div>
            <label className="label">Пов'язаний продукт</label>
            <select
              value={form.offering_id?.toString() || ''}
              onChange={e => setForm(f => ({ ...f, offering_id: e.target.value ? parseInt(e.target.value) : null }))}
              className="field mt-1"
            >
              <option value="">Без продукту</option>
              {offerings.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Опис</label>
            <textarea value={form.description} onChange={set('description')} rows={4} placeholder="Програма, деталі..." className="field mt-1 resize-none" />
          </div>

          <div>
            <label className="label">Обкладинка (URL)</label>
            <input value={form.cover_image_url} onChange={set('cover_image_url')} placeholder="https://..." className="field mt-1" />
          </div>
        </section>

        {/* Date & location */}
        <section className="rounded-xl border p-5 space-y-4">
          <h2 className="font-medium text-sm">Дата та місце</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Початок *</label>
              <input type="datetime-local" value={form.start_at} onChange={set('start_at')} required className="field mt-1" />
            </div>
            <div>
              <label className="label">Кінець</label>
              <input type="datetime-local" value={form.end_at} onChange={set('end_at')} className="field mt-1" />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.is_multi_day} onChange={setBool('is_multi_day')} className="rounded" />
              Багатоденна
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.is_online} onChange={setBool('is_online')} className="rounded" />
              Онлайн
            </label>
          </div>

          {form.is_online ? (
            <div>
              <label className="label">Посилання на трансляцію</label>
              <input value={form.online_link} onChange={set('online_link')} placeholder="https://zoom.us/j/..." className="field mt-1" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Назва закладу</label>
                <input value={form.venue_name} onChange={set('venue_name')} placeholder="Beauty Hub" className="field mt-1" />
              </div>
              <div>
                <label className="label">Адреса</label>
                <input value={form.venue_address} onChange={set('venue_address')} placeholder="вул. Хрещатик, 22" className="field mt-1" />
              </div>
            </div>
          )}
        </section>

        {/* Tickets */}
        <section className="rounded-xl border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-sm flex items-center gap-2">
              <Ticket className="w-4 h-4 text-violet-500" />
              Квитки
            </h2>
            <div className="flex rounded-lg overflow-hidden border text-sm">
              <button
                type="button"
                onClick={() => setHasTickets(false)}
                className={`px-3 py-1.5 transition-colors ${!hasTickets ? 'bg-violet-500 text-white' : 'hover:bg-muted'}`}
              >
                Безкоштовно
              </button>
              <button
                type="button"
                onClick={() => { setHasTickets(true); if (tickets.length === 0) addTicket() }}
                className={`px-3 py-1.5 transition-colors ${hasTickets ? 'bg-violet-500 text-white' : 'hover:bg-muted'}`}
              >
                Платно
              </button>
            </div>
          </div>

          {!hasTickets ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Ціна (₴)</label>
                <input type="number" step="0.01" min="0" value={form.price} onChange={set('price')} placeholder="0 = безкоштовно" className="field mt-1" />
              </div>
              <div>
                <label className="label">Макс. учасників</label>
                <input type="number" min="1" value={form.max_participants} onChange={set('max_participants')} placeholder="Без обмежень" className="field mt-1" />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div key={ticket._key} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Тип квитка</p>
                    <button type="button" onClick={() => removeTicket(ticket._key)} className="text-muted-foreground hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Назва *</label>
                      <input
                        value={ticket.name}
                        onChange={e => updateTicket(ticket._key, { name: e.target.value })}
                        placeholder="Стандарт / VIP / Онлайн"
                        className="field mt-1"
                      />
                    </div>
                    <div>
                      <label className="label">Ціна (₴)</label>
                      <input
                        type="number"
                        min="0"
                        value={ticket.price / 100 || ''}
                        onChange={e => updateTicket(ticket._key, { price: Math.round(parseFloat(e.target.value || '0') * 100) })}
                        placeholder="0"
                        className="field mt-1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Кількість місць</label>
                      <input
                        type="number"
                        min="1"
                        value={ticket.quantity ?? ''}
                        onChange={e => updateTicket(ticket._key, { quantity: e.target.value ? parseInt(e.target.value) : null })}
                        placeholder="∞ необмежено"
                        className="field mt-1"
                      />
                    </div>
                    <div>
                      <label className="label">Опис</label>
                      <input
                        value={ticket.description || ''}
                        onChange={e => updateTicket(ticket._key, { description: e.target.value })}
                        placeholder="Що включено"
                        className="field mt-1"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addTicket}
                className="w-full py-2.5 border-2 border-dashed border-violet-200 dark:border-violet-500/30 rounded-lg text-sm text-violet-600 hover:border-violet-400 hover:bg-violet-50/50 dark:hover:bg-violet-500/5 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Додати тип квитка
              </button>
            </div>
          )}

          {hasTickets && (
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <label className="label">Early Bird ціна (₴)</label>
                <input type="number" step="0.01" min="0" value={form.early_bird_price} onChange={set('early_bird_price')} placeholder="Рання знижка" className="field mt-1" />
              </div>
              <div>
                <label className="label">Early Bird до</label>
                <input type="datetime-local" value={form.early_bird_until} onChange={set('early_bird_until')} className="field mt-1" />
              </div>
            </div>
          )}
        </section>

        {/* Publish */}
        <label className="flex items-center gap-2 text-sm cursor-pointer px-1">
          <input type="checkbox" checked={form.is_published} onChange={setBool('is_published')} className="rounded" />
          Опублікувати одразу (буде видно в афіші)
        </label>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm border rounded-lg hover:bg-muted transition-colors">
            Скасувати
          </button>
          <button
            type="submit"
            disabled={saving || !form.title.trim() || !form.start_at}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Зберігаємо...' : 'Створити подію'}
          </button>
        </div>
      </form>
    </div>
  )
}
