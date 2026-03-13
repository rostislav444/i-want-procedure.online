'use client'

import { useState, useEffect } from 'react'
import { Copy, Check, Users, DollarSign, TrendingUp, Share2, Wallet, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { referralApi, type ReferralDashboard, type ReferredUser, type ReferralEarning } from '@/lib/api'

function formatPrice(kopecks: number): string {
  return `${(kopecks / 100).toLocaleString('uk-UA')} ₴`
}

export default function EducationReferralsPage() {
  const [dashboard, setDashboard] = useState<ReferralDashboard | null>(null)
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([])
  const [earnings, setEarnings] = useState<ReferralEarning[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [tab, setTab] = useState<'users' | 'earnings'>('users')

  useEffect(() => {
    Promise.all([
      referralApi.getDashboard(),
      referralApi.getReferredUsers(),
      referralApi.getEarnings(),
    ])
      .then(([dash, users, earns]) => {
        setDashboard(dash)
        setReferredUsers(users)
        setEarnings(earns)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function copyLink() {
    if (!dashboard?.referral_link) return
    navigator.clipboard.writeText(dashboard.referral_link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!dashboard) return null

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Реферальна програма</h1>
        <p className="text-muted-foreground">
          Запрошуйте освітян та отримуйте {dashboard.commission_pct}% від їх підписок
        </p>
      </div>

      {/* Referral link */}
      <Card className="border-violet-200 dark:border-violet-500/20 bg-violet-50/50 dark:bg-violet-500/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-3">
            <Share2 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <span className="font-medium">Ваше реферальне посилання</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-background rounded border text-sm truncate">
              {dashboard.referral_link || 'Код не згенеровано'}
            </code>
            <Button size="sm" variant="outline" onClick={copyLink} disabled={!dashboard.referral_link}>
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          {dashboard.referral_code && (
            <p className="text-sm text-muted-foreground mt-2">
              Код: <span className="font-mono font-medium">{dashboard.referral_code}</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{dashboard.total_referred}</p>
                <p className="text-sm text-muted-foreground">Запрошено</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{dashboard.active_referred}</p>
                <p className="text-sm text-muted-foreground">Активних</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatPrice(dashboard.total_earned)}</p>
                <p className="text-sm text-muted-foreground">Зароблено</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                <Wallet className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatPrice(dashboard.available_balance)}</p>
                <p className="text-sm text-muted-foreground">Доступно</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div>
        <div className="flex gap-1 border-b mb-4">
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === 'users'
                ? 'border-violet-500 text-violet-600 dark:text-violet-400'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setTab('users')}
          >
            Запрошені ({referredUsers.length})
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === 'earnings'
                ? 'border-violet-500 text-violet-600 dark:text-violet-400'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setTab('earnings')}
          >
            Нарахування ({earnings.length})
          </button>
        </div>

        {tab === 'users' && (
          <div className="space-y-3">
            {referredUsers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    Ви ще не запросили нікого. Поділіться посиланням!
                  </p>
                </CardContent>
              </Card>
            ) : (
              referredUsers.map(user => (
                <Card key={user.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{user.referred_user_name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {user.referred_company_name && <span>{user.referred_company_name}</span>}
                          <span>{new Date(user.created_at).toLocaleDateString('uk-UA')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">
                          +{formatPrice(user.total_earned)}
                        </span>
                        <Badge variant={user.is_active ? 'default' : 'secondary'}>
                          {user.is_active ? 'Активний' : 'Неактивний'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {tab === 'earnings' && (
          <div className="space-y-3">
            {earnings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <DollarSign className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Поки немає нарахувань</p>
                </CardContent>
              </Card>
            ) : (
              earnings.map(earning => (
                <Card key={earning.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-green-600 dark:text-green-400">
                          +{formatPrice(earning.amount)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {earning.commission_pct}% від оплати
                          {earning.referred_company_name && ` — ${earning.referred_company_name}`}
                        </p>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(earning.created_at).toLocaleDateString('uk-UA')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
