'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Save, Calendar, Link2, Unlink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { authApi, googleApi, GoogleCalendarInfo } from '@/lib/api'

interface UserData {
  id: number
  email: string
  first_name: string
  last_name: string
  telegram_id: number | null
  role: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
