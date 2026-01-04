'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Building2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi, companyApi } from '@/lib/api'

interface UserData {
  id: number
  email: string
  first_name: string
  last_name: string
  telegram_id: number | null
  role: string
}

interface CompanyData {
  id: number
  name: string
  type: string
  invite_code: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [company, setCompany] = useState<CompanyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

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
      const [userData, companyData] = await Promise.all([
        authApi.getMe(),
        companyApi.getMyCompany(),
      ])
      setUser(userData)
      setCompany(companyData)
      setFormData({
        first_name: userData.first_name,
        last_name: userData.last_name,
        telegram_id: userData.telegram_id?.toString() || '',
      })
    } catch (error) {
      console.error('Error loading profile:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)
    try {
      await authApi.updateMe({
        first_name: formData.first_name,
        last_name: formData.last_name,
        telegram_id: formData.telegram_id ? parseInt(formData.telegram_id) : null,
      })
      setSuccess(true)
      await loadData()
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const botUsername = process.env.NEXT_PUBLIC_CLIENT_BOT_NAME || 'YOUR_BOT'
  const inviteLink = company ? `https://t.me/${botUsername}?start=${company.invite_code}` : ''

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Профіль</h1>

      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Особисті дані
          </CardTitle>
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
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">Email не можна змінити</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Ім'я</Label>
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
              <p className="text-xs text-gray-500">
                Щоб отримати ваш Telegram ID, напишіть боту @userinfobot
              </p>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <Button type="submit" disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Збереження...' : 'Зберегти зміни'}
              </Button>
              {success && (
                <span className="text-sm text-green-600">Збережено успішно!</span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Company Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Компанія
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div>
              <Label className="text-gray-500">Назва</Label>
              <p className="font-medium">{company?.name}</p>
            </div>
            <div>
              <Label className="text-gray-500">Тип</Label>
              <p className="font-medium">
                {company?.type === 'solo' ? 'Індивідуальний спеціаліст' : 'Клініка'}
              </p>
            </div>
            <div>
              <Label className="text-gray-500">Код запрошення</Label>
              <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded inline-block">
                {company?.invite_code}
              </p>
            </div>
            <div>
              <Label className="text-gray-500">Посилання для клієнтів</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  value={inviteLink}
                  readOnly
                  className="text-sm font-mono"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(inviteLink)
                  }}
                >
                  Копіювати
                </Button>
              </div>
            </div>
          </div>
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
              <span className="text-gray-500">ID користувача</span>
              <span className="font-mono">{user?.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Роль</span>
              <span>{user?.role === 'admin' ? 'Адміністратор' : 'Лікар'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
