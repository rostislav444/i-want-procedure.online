'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { uk } from 'date-fns/locale'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Receipt,
  BarChart3,
  Loader2,
  Calendar,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { accountingApi, AnalyticsSummary } from '@/lib/api'

const groupByLabels: Record<string, string> = {
  day: 'День',
  week: 'Тиждень',
  month: 'Місяць',
}

export default function AccountingDashboard() {
  const now = new Date()
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(now), 'yyyy-MM-dd'))
  const [dateTo, setDateTo] = useState(format(endOfMonth(now), 'yyyy-MM-dd'))
  const [groupBy, setGroupBy] = useState('month')
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const data = await accountingApi.getAnalytics({
        date_from: dateFrom,
        date_to: dateTo,
        group_by: groupBy,
      })
      setAnalytics(data)
    } catch (err) {
      console.error('Error loading analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [dateFrom, dateTo, groupBy])

  const setPreset = (preset: string) => {
    const today = new Date()
    if (preset === 'this_month') {
      setDateFrom(format(startOfMonth(today), 'yyyy-MM-dd'))
      setDateTo(format(endOfMonth(today), 'yyyy-MM-dd'))
      setGroupBy('day')
    } else if (preset === 'last_month') {
      const prev = subMonths(today, 1)
      setDateFrom(format(startOfMonth(prev), 'yyyy-MM-dd'))
      setDateTo(format(endOfMonth(prev), 'yyyy-MM-dd'))
      setGroupBy('day')
    } else if (preset === 'last_3_months') {
      setDateFrom(format(startOfMonth(subMonths(today, 2)), 'yyyy-MM-dd'))
      setDateTo(format(endOfMonth(today), 'yyyy-MM-dd'))
      setGroupBy('month')
    }
  }

  const totals = analytics?.totals

  // Calculate max revenue for chart scaling
  const maxRevenue = analytics?.periods.reduce((max, p) => Math.max(max, Number(p.revenue)), 0) || 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Фінанси</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Аналітика доходів та витрат
          </p>
        </div>
        <Link href="/admin/accounting/expenses">
          <Button variant="outline" className="gap-1">
            <Receipt className="h-4 w-4" />
            Постійні витрати
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={() => setPreset('this_month')}>Цей місяць</Button>
              <Button variant="outline" size="sm" onClick={() => setPreset('last_month')}>Минулий місяць</Button>
              <Button variant="outline" size="sm" onClick={() => setPreset('last_3_months')}>3 місяці</Button>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-36 h-9"
              />
              <span className="text-muted-foreground">—</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-36 h-9"
              />
              <Select value={groupBy} onValueChange={setGroupBy}>
                <SelectTrigger className="w-32 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">По днях</SelectItem>
                  <SelectItem value="week">По тижнях</SelectItem>
                  <SelectItem value="month">По місяцях</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : analytics && totals ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-900/20">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                  </div>
                  <span className="text-sm text-muted-foreground">Виручка</span>
                </div>
                <p className="text-2xl font-bold tabular-nums">
                  {Number(totals.revenue).toLocaleString('uk-UA', { maximumFractionDigits: 0 })}
                  <span className="text-sm font-normal text-muted-foreground ml-1">грн</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {totals.appointment_count} процедур
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-md bg-orange-50 dark:bg-orange-900/20">
                    <Package className="h-4 w-4 text-orange-600" />
                  </div>
                  <span className="text-sm text-muted-foreground">Матеріали</span>
                </div>
                <p className="text-2xl font-bold tabular-nums">
                  {Number(totals.material_cost).toLocaleString('uk-UA', { maximumFractionDigits: 0 })}
                  <span className="text-sm font-normal text-muted-foreground ml-1">грн</span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-md bg-red-50 dark:bg-red-900/20">
                    <Receipt className="h-4 w-4 text-red-600" />
                  </div>
                  <span className="text-sm text-muted-foreground">Постійні</span>
                </div>
                <p className="text-2xl font-bold tabular-nums">
                  {Number(totals.fixed_cost_allocation).toLocaleString('uk-UA', { maximumFractionDigits: 0 })}
                  <span className="text-sm font-normal text-muted-foreground ml-1">грн</span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-900/20">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm text-muted-foreground">Чистий прибуток</span>
                </div>
                <p className={`text-2xl font-bold tabular-nums ${Number(totals.net_profit) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {Number(totals.net_profit).toLocaleString('uk-UA', { maximumFractionDigits: 0 })}
                  <span className="text-sm font-normal text-muted-foreground ml-1">грн</span>
                </p>
                {Number(totals.revenue) > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Маржа: {(Number(totals.net_profit) / Number(totals.revenue) * 100).toFixed(0)}%
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bar Chart */}
          {analytics.periods.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  Виручка та витрати по періодах
                </h3>
                <div className="flex items-end gap-1 h-48">
                  {analytics.periods.map((period, i) => {
                    const revenueHeight = maxRevenue > 0 ? (Number(period.revenue) / maxRevenue) * 100 : 0
                    const costHeight = maxRevenue > 0 ? (Number(period.material_cost) / maxRevenue) * 100 : 0
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                        <div className="w-full flex gap-0.5 items-end h-40">
                          <div
                            className="flex-1 bg-emerald-400 dark:bg-emerald-500 rounded-t-sm transition-all"
                            style={{ height: `${revenueHeight}%`, minHeight: revenueHeight > 0 ? '2px' : '0' }}
                            title={`Виручка: ${Number(period.revenue).toLocaleString('uk-UA')} грн`}
                          />
                          <div
                            className="flex-1 bg-orange-400 dark:bg-orange-500 rounded-t-sm transition-all"
                            style={{ height: `${costHeight}%`, minHeight: costHeight > 0 ? '2px' : '0' }}
                            title={`Матеріали: ${Number(period.material_cost).toLocaleString('uk-UA')} грн`}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                          {period.period.slice(-5)}
                        </span>
                      </div>
                    )
                  })}
                </div>
                <div className="flex items-center gap-4 mt-3 justify-center text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-sm bg-emerald-400" />
                    Виручка
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-sm bg-orange-400" />
                    Матеріали
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Periods Table */}
          {analytics.periods.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-4">Деталізація по періодах</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left pb-2 font-medium">Період</th>
                        <th className="text-right pb-2 font-medium">Виручка</th>
                        <th className="text-right pb-2 font-medium">Матеріали</th>
                        <th className="text-right pb-2 font-medium">Прибуток</th>
                        <th className="text-right pb-2 font-medium">Записів</th>
                        <th className="text-right pb-2 font-medium">Сер. чек</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.periods.map((period, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2.5 font-medium">{period.period}</td>
                          <td className="py-2.5 text-right tabular-nums">{Number(period.revenue).toLocaleString('uk-UA', { maximumFractionDigits: 0 })} грн</td>
                          <td className="py-2.5 text-right tabular-nums text-muted-foreground">{Number(period.material_cost).toLocaleString('uk-UA', { maximumFractionDigits: 0 })} грн</td>
                          <td className={`py-2.5 text-right tabular-nums font-medium ${Number(period.gross_profit) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {Number(period.gross_profit).toLocaleString('uk-UA', { maximumFractionDigits: 0 })} грн
                          </td>
                          <td className="py-2.5 text-right tabular-nums">{period.appointment_count}</td>
                          <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                            {period.avg_revenue_per_appointment != null
                              ? `${Number(period.avg_revenue_per_appointment).toLocaleString('uk-UA', { maximumFractionDigits: 0 })} грн`
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Services */}
          {analytics.top_services.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-4">Топ послуг за виручкою</h3>
                <div className="space-y-2">
                  {analytics.top_services.map((svc, i) => {
                    const maxSvcRevenue = analytics.top_services[0]?.revenue || 1
                    const width = (svc.revenue / maxSvcRevenue) * 100
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-sm w-6 text-muted-foreground">{i + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium truncate">{svc.name}</span>
                            <span className="text-sm tabular-nums font-medium ml-2">
                              {Number(svc.revenue).toLocaleString('uk-UA', { maximumFractionDigits: 0 })} грн
                            </span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary/60 rounded-full transition-all"
                              style={{ width: `${width}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{svc.count} процедур</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty state */}
          {analytics.periods.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Немає даних за обраний період</p>
              <p className="text-sm mt-1">Спробуйте змінити діапазон дат</p>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}
