'use client'

import { useEffect, useState } from 'react'
import { Search, Building2, Users, Calendar, ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { superadminApi, CompanyListItem } from '@/lib/superadmin-api'

const STATUS_COLORS: Record<string, string> = {
  trial: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  expired: 'bg-red-500/20 text-red-400 border-red-500/30',
  cancelled: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
}

const PLAN_LABELS: Record<string, string> = {
  individual: 'Individual',
  company_small: 'Small Team',
  company_large: 'Enterprise',
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  const loadCompanies = async () => {
    setLoading(true)
    try {
      const data = await superadminApi.getCompanies({
        search: search || undefined,
        subscription_status: statusFilter || undefined,
      })
      setCompanies(data)
    } catch (error) {
      console.error('Error loading companies:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCompanies()
  }, [statusFilter])

  useEffect(() => {
    const debounce = setTimeout(() => {
      loadCompanies()
    }, 300)
    return () => clearTimeout(debounce)
  }, [search])

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Companies</h1>
        <p className="text-slate-400 mt-1">Manage platform companies and subscriptions</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 bg-slate-800 border-slate-700 text-white">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Companies list */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-700 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : companies.length === 0 ? (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="py-12 text-center">
            <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No companies found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {companies.map((company) => (
            <Card key={company.id} className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                      {company.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">{company.name}</h3>
                        <Badge variant="outline" className="text-xs bg-slate-700 text-slate-300 border-slate-600">
                          {company.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400">/{company.slug}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Stats */}
                    <div className="hidden md:flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Users className="w-4 h-4" />
                        <span>{company.users_count} users</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Users className="w-4 h-4" />
                        <span>{company.clients_count} clients</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Calendar className="w-4 h-4" />
                        <span>{company.appointments_count} appts</span>
                      </div>
                    </div>

                    {/* Subscription status */}
                    <div className="flex items-center gap-2">
                      {company.subscription_status ? (
                        <Badge className={STATUS_COLORS[company.subscription_status] || STATUS_COLORS.cancelled}>
                          {company.subscription_status}
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-600/20 text-slate-400 border-slate-600/30">
                          No subscription
                        </Badge>
                      )}
                      {company.subscription_plan && (
                        <Badge variant="outline" className="text-slate-300 border-slate-600">
                          {PLAN_LABELS[company.subscription_plan] || company.subscription_plan}
                        </Badge>
                      )}
                    </div>

                    {/* Actions */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-white"
                      onClick={() => window.open(`/${company.slug}`, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Mobile stats */}
                <div className="flex md:hidden items-center gap-4 mt-4 text-sm text-slate-400">
                  <span>{company.users_count} users</span>
                  <span>{company.clients_count} clients</span>
                  <span>{company.appointments_count} appts</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
