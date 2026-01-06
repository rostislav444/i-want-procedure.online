'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { uk } from 'date-fns/locale'
import { Phone, User, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { clientsApi, Client } from '@/lib/api'

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      const data = await clientsApi.getAll()
      setClients(data)
    } catch (error) {
      console.error('Error loading clients:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Клієнти</h1>
        <span className="text-sm text-gray-500">{clients.length} клієнтів</span>
      </div>

      {clients.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500">
              Поки немає клієнтів. Вони з'являться після першої записи через Telegram бот.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <Link key={client.id} href={`/clients/${client.id}`}>
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
                        <p className="text-sm text-gray-500">@{client.telegram_username}</p>
                      )}
                      {client.phone && (
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <Phone className="w-3 h-3" />
                          {client.phone}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Зареєстрований: {format(new Date(client.created_at), 'd MMM yyyy', { locale: uk })}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
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
