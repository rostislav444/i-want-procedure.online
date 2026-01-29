'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format, isToday, isTomorrow } from 'date-fns'
import { uk } from 'date-fns/locale'
import {
  User,
  ChevronRight,
  Users,
  CalendarCheck,
  History,
  Clock,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { clientsApi, specialistsApi, positionsApi, Client, SpecialistListItem, Position } from '@/lib/api'
import { useCompany } from '@/contexts/CompanyContext'

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr)
  if (isToday(date)) return 'Сьогодні'
  if (isTomorrow(date)) return 'Завтра'
  return format(date, 'd MMM', { locale: uk })
}

type AccentColor = 'primary' | 'emerald'

const accentStyles: Record<AccentColor, { bg: string; text: string; textTime: string }> = {
  primary: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    textTime: 'text-primary',
  },
  emerald: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    textTime: 'text-emerald-600 dark:text-emerald-400',
  },
}

function ClientCard({ client, accent = 'primary' }: { client: Client; accent?: AccentColor }) {
  const hasUpcoming = client.upcoming_appointments > 0
  const colors = accentStyles[accent]

  return (
    <Link href={`/admin/clients/${client.id}`}>
      <Card className="h-full hover:shadow-md transition-all cursor-pointer group">
        <CardContent className="p-4">
          {/* Top row: Avatar + Name + Chevron */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              hasUpcoming ? colors.bg : 'bg-muted'
            }`}>
              <User className={`w-5 h-5 ${hasUpcoming ? colors.text : 'text-muted-foreground'}`} />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold group-hover:text-primary transition-colors truncate">
                {client.first_name} {client.last_name}
              </h3>
              {client.telegram_username && (
                <p className="text-xs text-muted-foreground truncate">
                  @{client.telegram_username}
                </p>
              )}
            </div>

            <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors flex-shrink-0" />
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 mt-3 text-xs">
            {client.completed_appointments > 0 && (
              <span className="text-muted-foreground">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{client.completed_appointments}</span> візит{client.completed_appointments === 1 ? '' : client.completed_appointments < 5 ? 'и' : 'ів'}
              </span>
            )}
            {client.upcoming_appointments > 0 && (
              <span className="text-muted-foreground">
                <span className="text-primary font-semibold">{client.upcoming_appointments}</span> заплан.
              </span>
            )}
            {client.total_appointments === 0 && (
              <span className="text-muted-foreground">
                Новий клієнт
              </span>
            )}
          </div>

          {/* Next/Last visit - full width bottom row */}
          {client.next_visit_date ? (
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-baseline gap-2">
                {client.next_visit_time && (
                  <span className={`text-lg font-bold ${colors.textTime}`}>{client.next_visit_time}</span>
                )}
                <span className="text-sm text-muted-foreground">
                  {formatDateLabel(client.next_visit_date)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground truncate mt-0.5">
                {client.next_visit_service}
              </p>
            </div>
          ) : client.last_visit_date ? (
            <div className="mt-3 pt-3 border-t flex items-center gap-2 text-xs text-muted-foreground">
              <span>Останній візит:</span>
              <span>{format(new Date(client.last_visit_date), 'd MMM yyyy', { locale: uk })}</span>
              {client.last_visit_service && (
                <>
                  <span>·</span>
                  <span className="truncate">{client.last_visit_service}</span>
                </>
              )}
            </div>
          ) : (
            <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
              Зареєстровано {format(new Date(client.created_at), 'd MMM yyyy', { locale: uk })}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

export default function ClientsPage() {
  const { selectedCompanyId } = useCompany()
  const [clients, setClients] = useState<Client[]>([])
  const [specialists, setSpecialists] = useState<SpecialistListItem[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [selectedMemberId, setSelectedMemberId] = useState<number | undefined>(undefined)
  const [selectedPositionId, setSelectedPositionId] = useState<number | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  // Load specialists and positions
  useEffect(() => {
    if (!selectedCompanyId) return
    specialistsApi.getAll(selectedCompanyId).then(setSpecialists).catch(console.error)
    positionsApi.getAll().then(setPositions).catch(console.error)
  }, [selectedCompanyId])

  // Load clients
  useEffect(() => {
    const loadClients = async () => {
      setLoading(true)
      try {
        const data = await clientsApi.getAll({ memberId: selectedMemberId, positionId: selectedPositionId })
        setClients(data)
      } catch (error) {
        console.error('Error loading clients:', error)
      } finally {
        setLoading(false)
      }
    }
    loadClients()
  }, [selectedMemberId, selectedPositionId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Split clients into groups (already sorted by backend)
  const clientsToday = clients.filter(c =>
    c.next_visit_date && isToday(new Date(c.next_visit_date))
  )
  const clientsUpcoming = clients.filter(c =>
    c.next_visit_date && !isToday(new Date(c.next_visit_date))
  )
  const clientsWithHistory = clients.filter(c => c.upcoming_appointments === 0 && c.completed_appointments > 0)
  const newClients = clients.filter(c => c.total_appointments === 0)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Клієнти</h1>
          <p className="text-sm text-muted-foreground">{clients.length} клієнтів</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={selectedPositionId?.toString() ?? 'all'}
            onValueChange={(value) => setSelectedPositionId(value === 'all' ? undefined : Number(value))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Всі спеціальності" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всі спеціальності</SelectItem>
              {positions.map((pos) => (
                <SelectItem key={pos.id} value={pos.id.toString()}>
                  {pos.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedMemberId?.toString() ?? 'all'}
            onValueChange={(value) => setSelectedMemberId(value === 'all' ? undefined : Number(value))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Всі спеціалісти" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всі спеціалісти</SelectItem>
              {specialists.map((spec) => (
                <SelectItem key={spec.id} value={spec.id.toString()}>
                  {spec.first_name} {spec.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
     

      {clients.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Поки немає клієнтів. Вони з'являться після першої записи через Telegram бот.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Today's visits */}
          {clientsToday.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-emerald-500" />
                <h2 className="text-xl font-semibold">Візити сьогодні</h2>
                <span className="ml-auto text-sm bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2.5 py-0.5 rounded-full font-medium">
                  {clientsToday.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {clientsToday.map((client) => (
                  <ClientCard key={client.id} client={client} accent="emerald" />
                ))}
              </div>
            </section>
          )}

          {/* Upcoming appointments (not today) */}
          {clientsUpcoming.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <CalendarCheck className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Заплановані візити</h2>
                <span className="ml-auto text-sm bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium">
                  {clientsUpcoming.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {clientsUpcoming.map((client) => (
                  <ClientCard key={client.id} client={client} />
                ))}
              </div>
            </section>
          )}

          {/* Clients with visit history (no upcoming) */}
          {clientsWithHistory.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <History className="h-5 w-5 text-emerald-500" />
                <h2 className="text-lg font-semibold">Пройшли процедури</h2>
                <span className="ml-auto text-sm bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2.5 py-0.5 rounded-full font-medium">
                  {clientsWithHistory.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {clientsWithHistory.map((client) => (
                  <ClientCard key={client.id} client={client} />
                ))}
              </div>
            </section>
          )}

          {/* New clients (no appointments) */}
          {newClients.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Нові клієнти</h2>
                <span className="ml-auto text-sm bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full font-medium">
                  {newClients.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {newClients.map((client) => (
                  <ClientCard key={client.id} client={client} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
