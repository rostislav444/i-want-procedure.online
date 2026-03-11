'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Save, Calendar, Link2, Unlink, Building2, Users, ArrowRight, CreditCard, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { authApi, googleApi, GoogleCalendarInfo, companyApi } from '@/lib/api'
import { useCompany } from '@/contexts/CompanyContext'

interface UserData {
  id: number
  email: string
  first_name: string
  last_name: string
  telegram_id: number | null
  role: string
}

function MonobankTokenCard() {
  const { company, refreshCompany } = useCompany()
  const [token, setToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const hasToken = (company as any)?.has_monobank_token || false

  const handleSave = async () => {
    if (!token.trim()) return
    setSaving(true)
    try {
      await companyApi.updateCompany({ monobank_token: token.trim() } as any)
      setSuccess(true)
      setToken('')
      setTimeout(() => setSuccess(false), 3000)
      await refreshCompany()
    } catch (error) {
      console.error('Error saving Monobank token:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async () => {
    if (!confirm('Видалити Monobank токен? Ви не зможете генерувати посилання на оплату для клієнтів.')) return
    setSaving(true)
    try {
      await companyApi.updateCompany({ monobank_token: '' } as any)
      await refreshCompany()
    } catch (error) {
      console.error('Error removing Monobank token:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Monobank Acquiring
        </CardTitle>
        <CardDescription>
          Налаштуйте токен Monobank для генерації посилань на оплату послуг клієнтами.
          Отримайте токен на{' '}
          <a
            href="https://web.monobank.ua/acquiring"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            web.monobank.ua/acquiring
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasToken ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <CreditCard className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="font-medium text-green-800">Monobank підключено</p>
                <p className="text-sm text-green-600">Ви можете генерувати посилання на оплату для клієнтів</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemove}
                disabled={saving}
                className="text-red-600 hover:text-red-700"
              >
                Видалити
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Оновити токен</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showToken ? 'text' : 'password'}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Вставте новий X-Token"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button onClick={handleSave} disabled={saving || !token.trim()}>
                  {saving ? 'Збереження...' : 'Оновити'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showToken ? 'text' : 'password'}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Вставте X-Token з Monobank Acquiring"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button onClick={handleSave} disabled={saving || !token.trim()}>
                <CreditCard className="h-4 w-4 mr-2" />
                {saving ? 'Збереження...' : 'Підключити'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Після підключення ви зможете надсилати клієнтам посилання на оплату через Monobank.
            </p>
          </div>
        )}
        {success && (
          <p className="text-sm text-green-600">Токен збережено!</p>
        )}
      </CardContent>
    </Card>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const { company, companyType, userRole, refreshCompany } = useCompany()
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [googleStatus, setGoogleStatus] = useState<GoogleCalendarInfo | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [selectedCalendar, setSelectedCalendar] = useState<string>('primary')

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    telegram_id: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [userData, googleStatusData] = await Promise.all([
        authApi.getMe(),
        googleApi.getStatus().catch(() => null),
      ])
      setUser(userData)
      setGoogleStatus(googleStatusData)
      if (googleStatusData?.calendar_id) {
        setSelectedCalendar(googleStatusData.calendar_id)
      }
      setFormData({
        first_name: userData.first_name,
        last_name: userData.last_name,
        telegram_id: userData.telegram_id?.toString() || '',
      })
    } catch (error) {
      console.error('Error loading profile:', error)
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  const showSuccess = (message: string) => {
    setSuccess(message)
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await authApi.updateMe({
        first_name: formData.first_name,
        last_name: formData.last_name,
        telegram_id: formData.telegram_id ? parseInt(formData.telegram_id) : null,
      })
      showSuccess('Дані збережено!')
      await loadData()
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleGoogleConnect = async () => {
    setGoogleLoading(true)
    try {
      const { url } = await googleApi.getAuthUrl('link')
      window.location.href = url
    } catch (error: any) {
      const detail = error.response?.data?.detail
      if (detail === 'Google OAuth not configured') {
        showSuccess('Google авторизація не налаштована')
      } else {
        console.error('Error getting Google auth URL:', error)
      }
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleGoogleDisconnect = async () => {
    if (!confirm('Ви впевнені, що хочете відключити Google акаунт?')) return

    setGoogleLoading(true)
    try {
      await googleApi.disconnect()
      showSuccess('Google акаунт відключено')
      await loadData()
    } catch (error) {
      console.error('Error disconnecting Google:', error)
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleCalendarEnable = async () => {
    setGoogleLoading(true)
    try {
      await googleApi.enableCalendar(selectedCalendar)
      showSuccess('Google Calendar увімкнено!')
      await loadData()
    } catch (error) {
      console.error('Error enabling calendar:', error)
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleCalendarDisable = async () => {
    setGoogleLoading(true)
    try {
      await googleApi.disableCalendar()
      showSuccess('Google Calendar вимкнено')
      await loadData()
    } catch (error) {
      console.error('Error disabling calendar:', error)
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleUpgradeToClinic = async () => {
    if (!confirm('Ви впевнені, що хочете перейти на профіль компанії? Це дозволить додавати співробітників.')) return

    setUpgrading(true)
    try {
      await companyApi.updateCompany({ type: 'clinic' })
      showSuccess('Профіль оновлено до компанії!')
      await refreshCompany()
    } catch (error) {
      console.error('Error upgrading to clinic:', error)
    } finally {
      setUpgrading(false)
    }
  }

  const handleDowngradeToSolo = async () => {
    if (!confirm('Ви впевнені, що хочете повернутися до профілю спеціаліста?')) return

    setUpgrading(true)
    try {
      await companyApi.updateCompany({ type: 'solo' })
      showSuccess('Профіль оновлено до спеціаліста!')
      await refreshCompany()
    } catch (error) {
      console.error('Error downgrading to solo:', error)
    } finally {
      setUpgrading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
              <div className="animate-pulse space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 bg-muted rounded" style={{ opacity: 1 - i * 0.15 }} />
                ))}
              </div>
            </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <User className="h-6 w-6" />
            Профіль
          </h1>
          <p className="text-muted-foreground">
            Ваші особисті дані
          </p>
        </div>
        {success && (
          <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
            {success}
          </span>
        )}
      </div>

      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle>Особисті дані</CardTitle>
          <CardDescription>
            Оновіть вашу персональну інформацію
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Ім&apos;я</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Прізвище</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telegram_id">Telegram ID</Label>
              <Input
                id="telegram_id"
                type="number"
                value={formData.telegram_id}
                onChange={(e) => setFormData({ ...formData, telegram_id: e.target.value })}
                placeholder="Ваш Telegram ID для сповіщень"
              />
              <p className="text-xs text-muted-foreground">
                Щоб отримати ваш Telegram ID, напишіть боту @userinfobot
              </p>
            </div>

            <Button type="submit" disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Збереження...' : 'Зберегти'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Google Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar
          </CardTitle>
          <CardDescription>
            Синхронізуйте ваші записи з Google Calendar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!googleStatus?.connected ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Підключіть Google акаунт, щоб синхронізувати записи з вашим Google Calendar.
                Нові записи автоматично додаватимуться до вашого календаря.
              </p>
              <Button onClick={handleGoogleConnect} disabled={googleLoading}>
                <Link2 className="mr-2 h-4 w-4" />
                {googleLoading ? 'Завантаження...' : "Підключити Google"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div>
                  <p className="font-medium text-green-800">Google підключено</p>
                  <p className="text-sm text-green-600">{googleStatus.email}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGoogleDisconnect}
                  disabled={googleLoading}
                  className="text-red-600 hover:text-red-700"
                >
                  <Unlink className="mr-2 h-4 w-4" />
                  Відключити
                </Button>
              </div>

              {/* Calendar sync settings */}
              <div className="space-y-3">
                <Label>Синхронізація календаря</Label>

                {googleStatus.calendar_enabled ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <div className="flex-1">
                        <p className="font-medium text-blue-800">Синхронізація увімкнена</p>
                        <p className="text-sm text-blue-600">
                          Календар: {googleStatus.calendars.find(c => c.id === googleStatus.calendar_id)?.summary || googleStatus.calendar_id}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleCalendarDisable}
                      disabled={googleLoading}
                    >
                      Вимкнути синхронізацію
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Оберіть календар для синхронізації записів:
                    </p>

                    {googleStatus.calendars.length > 0 ? (
                      <>
                        <Select value={selectedCalendar} onValueChange={setSelectedCalendar}>
                          <SelectTrigger>
                            <SelectValue placeholder="Оберіть календар" />
                          </SelectTrigger>
                          <SelectContent>
                            {googleStatus.calendars.map((cal) => (
                              <SelectItem key={cal.id} value={cal.id}>
                                {cal.summary} {cal.primary && '(основний)'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button onClick={handleCalendarEnable} disabled={googleLoading}>
                          <Calendar className="mr-2 h-4 w-4" />
                          {googleLoading ? 'Завантаження...' : 'Увімкнути синхронізацію'}
                        </Button>
                      </>
                    ) : (
                      <p className="text-sm text-amber-600">
                        Не вдалося завантажити список календарів. Спробуйте перепідключити Google акаунт.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Company Type */}
      {userRole === 'owner' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Тип профілю
            </CardTitle>
            <CardDescription>
              {companyType === 'solo'
                ? 'Зараз у вас профіль спеціаліста. Перейдіть на профіль компанії, щоб додавати співробітників.'
                : 'У вас профіль компанії. Ви можете управляти командою та додавати співробітників.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {companyType === 'solo' ? (
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Спеціаліст</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-primary">Компанія</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Отримаєте можливість додавати команду, посади та налаштування клініки
                  </p>
                </div>
                <Button onClick={handleUpgradeToClinic} disabled={upgrading}>
                  {upgrading ? 'Оновлення...' : 'Перейти'}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-primary">Профіль компанії</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ви можете керувати командою та налаштуваннями через розділи &laquo;Команда&raquo; та &laquo;Налаштування&raquo;
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleDowngradeToSolo} disabled={upgrading}>
                  {upgrading ? 'Оновлення...' : 'Повернути спеціаліста'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Monobank Token for client payments */}
      {userRole === 'owner' && (
        <MonobankTokenCard />
      )}

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Інформація про обліковий запис</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID користувача</span>
              <span className="font-mono">{user?.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Роль</span>
              <span>{user?.role === 'admin' ? 'Адміністратор' : 'Спеціаліст'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
