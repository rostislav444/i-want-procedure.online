'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, BookOpen, FileText, Award, Presentation, GraduationCap, Eye, EyeOff, MoreHorizontal, Pencil, Trash2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { educationApi, type Offering } from '@/lib/api'

const TYPE_LABELS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  course: { label: 'Курс', icon: BookOpen, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  seminar: { label: 'Семінар', icon: Presentation, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  masterclass: { label: 'Майстер-клас', icon: GraduationCap, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  guide: { label: 'Матеріал', icon: FileText, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  certification: { label: 'Сертифікація', icon: Award, color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
  consultation: { label: 'Консультація', icon: BookOpen, color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
}

function formatPrice(kopecks: number): string {
  return `${(kopecks / 100).toLocaleString('uk-UA')} ₴`
}

export default function OfferingsPage() {
  const [offerings, setOfferings] = useState<Offering[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  useEffect(() => {
    educationApi.getOfferings()
      .then(setOfferings)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(id: number) {
    if (!confirm('Видалити цей продукт?')) return
    try {
      await educationApi.deleteOffering(id)
      setOfferings(prev => prev.filter(o => o.id !== id))
    } catch (err) {
      console.error(err)
      alert('Помилка при видаленні')
    }
  }

  const filtered = offerings.filter(o => {
    const matchSearch = !search || o.title.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'all' || o.type === typeFilter
    return matchSearch && matchType
  })

  const types = ['all', ...Array.from(new Set(offerings.map(o => o.type)))]

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Продукти</h1>
          <p className="text-muted-foreground">Курси, матеріали, консультації</p>
        </div>
        <Link href="/education/admin/offerings/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Додати продукт
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Пошук за назвою..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {types.map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                typeFilter === t
                  ? 'bg-violet-600 text-white'
                  : 'border hover:bg-muted'
              }`}
            >
              {t === 'all' ? 'Всі' : TYPE_LABELS[t]?.label || t}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground mb-4">
              {search || typeFilter !== 'all' ? 'Нічого не знайдено' : 'У вас поки немає продуктів'}
            </p>
            {!search && typeFilter === 'all' && (
              <Link href="/education/admin/offerings/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Створити перший продукт
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(offering => {
            const typeInfo = TYPE_LABELS[offering.type] || TYPE_LABELS.course
            const TypeIcon = typeInfo.icon
            return (
              <Card key={offering.id} className="group">
                {offering.cover_image_url && (
                  <div className="h-32 overflow-hidden rounded-t-lg">
                    <img
                      src={offering.cover_image_url}
                      alt={offering.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardContent className={offering.cover_image_url ? 'pt-4' : 'pt-6'}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant="secondary" className={typeInfo.color}>
                          <TypeIcon className="h-3 w-3 mr-1" />
                          {typeInfo.label}
                        </Badge>
                        {!offering.is_active && (
                          <Badge variant="outline" className="text-muted-foreground">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Приховано
                          </Badge>
                        )}
                        {offering.is_active && (
                          <Badge variant="outline" className="text-green-600 border-green-200">
                            <Eye className="h-3 w-3 mr-1" />
                            Опубліковано
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold truncate">{offering.title}</h3>
                      {offering.short_description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {offering.short_description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-3 text-sm">
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {offering.price === 0 ? 'Безкоштовно' : formatPrice(offering.price)}
                        </span>
                        {offering.duration_hours && (
                          <span className="text-muted-foreground">{offering.duration_hours} год</span>
                        )}
                        {offering.upcoming_events_count > 0 && (
                          <span className="text-muted-foreground">{offering.upcoming_events_count} подій</span>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/education/admin/offerings/${offering.id}/edit`}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Редагувати
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(offering.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Видалити
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
