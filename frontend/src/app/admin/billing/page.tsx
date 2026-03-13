'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CreditCard, Check, Clock, AlertTriangle, Users, Building2, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { billingApi, BillingOverview } from '@/lib/api'
import { useCompany } from '@/contexts/CompanyContext'

const PLAN_INFO = {
  individual: {
    name: 'Індивідуальний',
    description: 'Для приватних спеціалістів',
    icon: Crown,
    price: 50000,
    priceLabel: 'грн/міс',
    features: ['Всі функції платформи', 'Telegram боти', 'Google Calendar', 'Власний мініс-сайт', 'Підтримка'],
  },
  company_small: {
    name: 'Компанія',
    description: '3-9 спеціалістів',
    icon: Users,
    price: 45000,
    priceLabel: 'грн/спеціаліст',
    features: ['Все з індивідуального', 'Декілька спеціалістів', 'Спільна база клієнтів', 'Аналітика по команді', 'Пріоритетна підтримка'],
  },
  company_large: {
    name: 'Велика компанія',
    description: '10+ спеціалістів',
    icon: Building2,
    price: 40000,
    priceLabel: 'грн/спеціаліст',
    features: ['Все з попередніх', 'Максимальна знижка', 'Індивідуальне налаштування', 'Виділений менеджер', 'SLA підтримка'],
  },
}

const STATUS_LABELS: Record<string, { label: string; color: string; icon: typeof Check }> = {
  trial: { label: 'Пробний період', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: Clock },
  active: { label: 'Активна', color: 'text-green-600 bg-green-50 border-green-200', icon: Check },
  expired: { label: 'Закінчилась', color: 'text-red-600 bg-red-50 border-red-200', icon: AlertTriangle },
  cancelled: { label: 'Скасована', color: 'text-gray-600 bg-gray-50 border-gray-200', icon: AlertTriangle },
}

const PAYMENT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Очікує', color: 'text-yellow-600 bg-yellow-50' },
  completed: { label: 'Оплачено', color: 'text-green-600 bg-green-50' },
  failed: { label: 'Помилка', color: 'text-red-600 bg-red-50' },
  refunded: { label: 'Повернено', color: 'text-gray-600 bg-gray-50' },
}

function formatPrice(kopecks: number): string {
  return `${(kopecks / 100).toFixed(0)} грн`
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function BillingPage() {
  const { userRole } = useCompany()
  const searchParams = useSearchParams()
  const [overview, setOverview] = useState<BillingOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
      setPaymentSuccess(true)
      setTimeout(() => setPaymentSuccess(false), 5000)
    }
    loadOverview()
  }, [searchParams])

  const loadOverview = async () => {
    try {
      setLoading(true)
      const data = await billingApi.getOverview()
      setOverview(data)
    } catch (error) {
      console.error('Failed to load billing overview:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePay = async (plan?: string) => {
    try {
      setPaying(true)
      const result = await billingApi.createPayment(plan)
      // Redirect to Monobank payment page
      window.location.href = result.page_url
    } catch (error: any) {
      console.error('Payment failed:', error)
      alert(error.response?.data?.detail || 'Помилка створення платежу')
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Підписка</h1>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-xl border bg-card animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!overview) return null

  const sub = overview.subscription
  const statusInfo = sub ? STATUS_LABELS[sub.status] || STATUS_LABELS.trial : STATUS_LABELS.trial
  const StatusIcon = statusInfo.icon
  const trialProgress = sub ? Math.min((sub.confirmed_clients_count / sub.trial_client_limit) * 100, 100) : 0
  const trialEnded = sub ? !sub.trial_active && sub.status === 'trial' : false
  const needsPayment = trialEnded || sub?.status === 'expired'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Підписка</h1>
      </div>

      {/* Payment success banner */}
      {paymentSuccess && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-green-200 bg-green-50 text-green-800">
          <Check className="h-5 w-5" />
          <p className="font-medium">Оплата пройшла успішно! Підписку активовано.</p>
        </div>
      )}

      {/* Current subscription status */}
      {sub && (
        <div className="rounded-xl border bg-card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${statusInfo.color}`}>
                <StatusIcon className="h-4 w-4" />
                {statusInfo.label}
              </div>
              <div>
                <h2 className="font-semibold text-lg">
                  {PLAN_INFO[sub.plan as keyof typeof PLAN_INFO]?.name || sub.plan}
                </h2>
                {sub.status === 'active' && sub.current_period_end && (
                  <p className="text-sm text-muted-foreground">
                    Наступна оплата: {formatDate(sub.current_period_end)}
                  </p>
                )}
              </div>
            </div>
            {sub.price > 0 && (
              <div className="text-right">
                <p className="text-2xl font-bold">{formatPrice(sub.price)}</p>
                <p className="text-sm text-muted-foreground">/ місяць</p>
              </div>
            )}
          </div>

          {/* Trial progress */}
          {sub.status === 'trial' && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  Пробний період: {sub.confirmed_clients_count} / {sub.trial_client_limit} клієнтів
                </span>
                <span className="text-sm text-muted-foreground">
                  {sub.trial_active
                    ? `Залишилось ${sub.trial_client_limit - sub.confirmed_clients_count}`
                    : 'Вичерпано'}
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    trialEnded ? 'bg-red-500' : trialProgress > 70 ? 'bg-amber-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${trialProgress}%` }}
                />
              </div>
              {trialEnded && (
                <p className="mt-2 text-sm text-red-600 font-medium">
                  Пробний період завершено. Оберіть план для продовження роботи.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Payment required banner */}
      {needsPayment && (
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-amber-100">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 text-lg">Потрібна оплата</h3>
              <p className="text-amber-800 mt-1">
                {trialEnded
                  ? 'Ви досягли ліміту пробного періоду. Оберіть план підписки, щоб продовжити користуватися всіма функціями.'
                  : 'Ваша підписка закінчилася. Оновіть підписку, щоб продовжити роботу.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Plan cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Тарифні плани</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {Object.entries(PLAN_INFO).map(([planKey, plan]) => {
            const isCurrentPlan = sub?.plan === planKey
            const PlanIcon = plan.icon
            const isContactPlan = planKey === 'company_large'

            return (
              <div
                key={planKey}
                className={`relative rounded-xl border-2 bg-card p-6 transition-all ${
                  isCurrentPlan
                    ? 'border-primary shadow-md'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    Поточний план
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <PlanIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground">{plan.description}</p>
                  </div>
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-bold">{formatPrice(plan.price)}</span>
                  <span className="text-muted-foreground"> {plan.priceLabel}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                {isContactPlan ? (
                  <Button className="w-full" variant="outline" asChild>
                    <a href="https://t.me/procedure_support">Зв&apos;язатися з нами</a>
                  </Button>
                ) : overview.has_monobank ? (
                  <Button
                    className="w-full"
                    variant={isCurrentPlan && sub?.status === 'active' ? 'outline' : 'default'}
                    disabled={paying || (isCurrentPlan && sub?.status === 'active')}
                    onClick={() => handlePay(planKey)}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    {isCurrentPlan && sub?.status === 'active'
                      ? 'Активний'
                      : isCurrentPlan
                        ? 'Оплатити'
                        : 'Обрати план'}
                  </Button>
                ) : (
                  <p className="text-xs text-center text-muted-foreground">
                    Оплата буде доступна найближчим часом
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Payment history */}
      {overview.recent_payments.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Історія платежів</h2>
          <div className="rounded-xl border bg-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Дата</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Сума</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Метод</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Статус</th>
                </tr>
              </thead>
              <tbody>
                {overview.recent_payments.map((payment) => {
                  const statusLabel = PAYMENT_STATUS_LABELS[payment.status] || PAYMENT_STATUS_LABELS.pending
                  return (
                    <tr key={payment.id} className="border-b last:border-0">
                      <td className="px-4 py-3 text-sm">{formatDate(payment.created_at)}</td>
                      <td className="px-4 py-3 text-sm font-medium">{formatPrice(payment.amount)}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {payment.payment_method === 'card' ? 'Картка' :
                          payment.payment_method === 'manual' ? 'Вручну' : payment.payment_method}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusLabel.color}`}>
                          {statusLabel.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
