'use client'

import { useEffect, useState } from 'react'
import { Search, Building2, Users, Calendar, ExternalLink, ChevronDown, ChevronUp, UserCircle, TrendingUp, DollarSign, Phone, Mail, MessageCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { superadminApi, CompanyListItem, CompanyDetailExtended } from '@/lib/superadmin-api'

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

const ROLE_COLORS: Record<string, string> = {
  superadmin: 'bg-purple-500/20 text-purple-400',
  specialist: 'bg-blue-500/20 text-blue-400',
  manager: 'bg-amber-500/20 text-amber-400',
  client: 'bg-green-500/20 text-green-400',
}

function formatUAH(kopecks: number): string {
  return `${(kopecks / 100).toLocaleString('uk-UA')} ₴`
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [expandedCompany, setExpandedCompany] = useState<number | null>(null)
  const [companyDetails, setCompanyDetails] = useState<Record<number, CompanyDetailExtended>>({})
  const [loadingDetails, setLoadingDetails] = useState<number | null>(null)

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

  const loadCompanyDetails = async (companyId: number) => {
    if (companyDetails[companyId]) {
      setExpandedCompany(expandedCompany === companyId ? null : companyId)
      return
    }

    setLoadingDetails(companyId)
    try {
      const data = await superadminApi.getCompany(companyId)
      setCompanyDetails(prev => ({ ...prev, [companyId]: data }))
      setExpandedCompany(companyId)
    } catch (error) {
      console.error('Error loading company details:', error)
    } finally {
      setLoadingDetails(null)
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
          {companies.map((company) => {
            const isExpanded = expandedCompany === company.id
            const details = companyDetails[company.id]
            const isLoading = loadingDetails === company.id

            return (
              <Card key={company.id} className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
                <CardContent className="p-6">
                  {/* Header row */}
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
                          <UserCircle className="w-4 h-4" />
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
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-white"
                          onClick={() => window.open(`https://i-want-procedure.online/${company.slug}`, '_blank')}
                          title="View public page"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-white"
                          onClick={() => loadCompanyDetails(company.id)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                          ) : isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Mobile stats */}
                  <div className="flex md:hidden items-center gap-4 mt-4 text-sm text-slate-400">
                    <span>{company.users_count} users</span>
                    <span>{company.clients_count} clients</span>
                    <span>{company.appointments_count} appts</span>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && details && (
                    <div className="mt-6 pt-6 border-t border-slate-700 space-y-6">
                      {/* Analytics */}
                      {details.analytics && (
                        <div>
                          <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-amber-400" />
                            Analytics
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-slate-700/50 rounded-lg p-4">
                              <p className="text-slate-400 text-xs mb-1">This Week</p>
                              <p className="text-white text-xl font-bold">{details.analytics.appointments_this_week}</p>
                              <p className="text-slate-500 text-xs">appointments</p>
                            </div>
                            <div className="bg-slate-700/50 rounded-lg p-4">
                              <p className="text-slate-400 text-xs mb-1">This Month</p>
                              <p className="text-white text-xl font-bold">{details.analytics.appointments_this_month}</p>
                              <p className="text-slate-500 text-xs">appointments</p>
                            </div>
                            <div className="bg-slate-700/50 rounded-lg p-4">
                              <p className="text-slate-400 text-xs mb-1">New Clients</p>
                              <p className="text-white text-xl font-bold">{details.analytics.new_clients_this_month}</p>
                              <p className="text-slate-500 text-xs">this month</p>
                            </div>
                            <div className="bg-slate-700/50 rounded-lg p-4">
                              <p className="text-slate-400 text-xs mb-1">Revenue</p>
                              <p className="text-green-400 text-xl font-bold">{formatUAH(details.analytics.total_revenue)}</p>
                              <p className="text-slate-500 text-xs">total</p>
                            </div>
                          </div>

                          {/* Appointment status breakdown */}
                          <div className="mt-4 flex flex-wrap gap-3">
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                              {details.analytics.pending_appointments} pending
                            </Badge>
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                              {details.analytics.confirmed_appointments} confirmed
                            </Badge>
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                              {details.analytics.completed_appointments} completed
                            </Badge>
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                              {details.analytics.cancelled_appointments} cancelled
                            </Badge>
                          </div>
                        </div>
                      )}

                      {/* Two column layout for employees and clients */}
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Employees */}
                        <div>
                          <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-400" />
                            Employees ({details.employees.length})
                          </h4>
                          {details.employees.length === 0 ? (
                            <p className="text-slate-500 text-sm">No employees</p>
                          ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {details.employees.map((emp) => (
                                <div key={emp.id} className="bg-slate-700/30 rounded-lg p-3 flex items-center justify-between">
                                  <div>
                                    <p className="text-white text-sm font-medium">
                                      {emp.first_name} {emp.last_name}
                                      {!emp.is_active && (
                                        <span className="text-red-400 text-xs ml-2">(inactive)</span>
                                      )}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      {emp.email && (
                                        <span className="text-slate-400 text-xs flex items-center gap-1">
                                          <Mail className="w-3 h-3" />
                                          {emp.email}
                                        </span>
                                      )}
                                      {emp.phone && (
                                        <span className="text-slate-400 text-xs flex items-center gap-1">
                                          <Phone className="w-3 h-3" />
                                          {emp.phone}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {emp.is_owner && (
                                      <Badge className="text-xs bg-amber-600">owner</Badge>
                                    )}
                                    {emp.is_manager && (
                                      <Badge className="text-xs bg-blue-600">manager</Badge>
                                    )}
                                    {emp.is_specialist && (
                                      <Badge className="text-xs bg-green-600">specialist</Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Clients */}
                        <div>
                          <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                            <UserCircle className="w-4 h-4 text-green-400" />
                            Clients ({details.clients.length})
                          </h4>
                          {details.clients.length === 0 ? (
                            <p className="text-slate-500 text-sm">No clients</p>
                          ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {details.clients.map((client) => (
                                <div key={client.id} className="bg-slate-700/30 rounded-lg p-3 flex items-center justify-between">
                                  <div>
                                    <p className="text-white text-sm font-medium">
                                      {client.first_name} {client.last_name || ''}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      {client.telegram_username && (
                                        <span className="text-slate-400 text-xs flex items-center gap-1">
                                          <MessageCircle className="w-3 h-3" />
                                          @{client.telegram_username}
                                        </span>
                                      )}
                                      {client.phone && (
                                        <span className="text-slate-400 text-xs flex items-center gap-1">
                                          <Phone className="w-3 h-3" />
                                          {client.phone}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <Badge variant="outline" className="text-xs text-slate-300 border-slate-600">
                                    {client.appointments_count} appts
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Company info */}
                      <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-700">
                        {details.phone && (
                          <span className="text-slate-400 text-sm flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {details.phone}
                          </span>
                        )}
                        {details.telegram && (
                          <span className="text-slate-400 text-sm flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            {details.telegram}
                          </span>
                        )}
                        {details.address && (
                          <span className="text-slate-400 text-sm">
                            {details.address}
                          </span>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-auto border-amber-500/50 text-amber-400 hover:bg-amber-500/20"
                          onClick={() => window.open(`https://i-want-procedure.online/${company.slug}`, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Public Page
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
