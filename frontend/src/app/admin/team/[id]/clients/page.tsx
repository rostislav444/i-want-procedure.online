'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { uk } from 'date-fns/locale'
import { Phone, User, ChevronRight, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { specialistsApi, SpecialistProfile, Client } from '@/lib/api'
import { useCompany } from '@/contexts/CompanyContext'

export default function SpecialistClientsPage() {
  const params = useParams()
  const router = useRouter()
  const specialistId = Number(params.id)
  const { companyType } = useCompany()

  const [specialist, setSpecialist] = useState<SpecialistProfile | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (companyType && companyType !== 'clinic') {
      router.push('/admin')
      return
    }
    loadData()
  }, [specialistId, companyType])

  const loadData = async () => {
    try {
      const [specialistData, clientsData] = await Promise.all([
        specialistsApi.getById(specialistId),
        specialistsApi.getClients(specialistId),
      ])
      setSpecialist(specialistData)
      setClients(clientsData)
    } catch (error) {
      console.error('Failed to load data:', error)
      router.push('/admin/team')
    } finally {
      setLoading(false)
    }
  }

  if (loading || !specialist) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/team/${specialistId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            Клієнти — {specialist.first_name} {specialist.last_name}
          </h1>
          {specialist.position && (
            <p className="text-sm text-muted-foreground">{specialist.position}</p>
          )}
        </div>
        <span className="text-sm text-muted-foreground">{clients.length} клієнтів</span>
      </div>

      {clients.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">
              У цього спеціаліста поки немає клієнтів.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <Link key={client.id} href={`/admin/clients/${client.id}`}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold group-hover:text-primary transition-colors">
                        {client.first_name} {client.last_name}
                      </h3>
                      {client.telegram_username && (
                        <p className="text-sm text-muted-foreground">@{client.telegram_username}</p>
                      )}
                      {client.phone && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Phone className="w-3 h-3" />
                          {client.phone}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Зареєстрований: {format(new Date(client.created_at), 'd MMM yyyy', { locale: uk })}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
