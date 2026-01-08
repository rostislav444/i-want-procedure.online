'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { User, Building2, Save, Phone, MapPin, CreditCard, Banknote, Calendar, Link2, Unlink, Camera, Upload, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { authApi, companyApi, googleApi, uploadApi, Company, GoogleCalendarInfo } from '@/lib/api'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingCompany, setSavingCompany] = useState(false)
  const [savingPayment, setSavingPayment] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [googleStatus, setGoogleStatus] = useState<GoogleCalendarInfo | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [selectedCalendar, setSelectedCalendar] = useState<string>('primary')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    telegram_id: '',
  })

  const [companyData, setCompanyData] = useState({
    name: '',
    description: '',
    phone: '',
    address: '',
    telegram: '',
  })

  const [paymentData, setPaymentData] = useState({
    payment_iban: '',
    payment_bank_name: '',
    payment_recipient_name: '',
    payment_card_number: '',
    payment_monobank_jar: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [userData, companyData, googleStatusData] = await Promise.all([
        authApi.getMe(),
        companyApi.getMyCompany(),
        googleApi.getStatus().catch(() => null),
      ])
      setGoogleStatus(googleStatusData)
      if (googleStatusData?.calendar_id) {
        setSelectedCalendar(googleStatusData.calendar_id)
      }
      setUser(userData)
      setCompany(companyData)
      setFormData({
        first_name: userData.first_name,
        last_name: userData.last_name,
        telegram_id: userData.telegram_id?.toString() || '',
      })
      setCompanyData({
        name: companyData.name || '',
        description: companyData.description || '',
        phone: companyData.phone || '',
        address: companyData.address || '',
        telegram: companyData.telegram || '',
      })

      setPaymentData({
        payment_iban: companyData.payment_iban || '',
        payment_bank_name: companyData.payment_bank_name || '',
        payment_recipient_name: companyData.payment_recipient_name || '',
        payment_card_number: companyData.payment_card_number || '',
        payment_monobank_jar: companyData.payment_monobank_jar || '',
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

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await authApi.updateMe({
        first_name: formData.first_name,
        last_name: formData.last_name,
        telegram_id: formData.telegram_id ? parseInt(formData.telegram_id) : null,
      })
      showSuccess('Особисті дані збережено!')
      await loadData()
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSubmitCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingCompany(true)
    try {
      await companyApi.updateCompany({
        name: companyData.name,
        description: companyData.description || undefined,
        phone: companyData.phone || undefined,
        address: companyData.address || undefined,
        telegram: companyData.telegram || undefined,
      })
      showSuccess('Дані компанії збережено!')
      await loadData()
    } catch (error) {
      console.error('Error updating company:', error)
    } finally {
      setSavingCompany(false)
    }
  }

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingPayment(true)
    try {
      await companyApi.updateCompany({
        payment_iban: paymentData.payment_iban || undefined,
        payment_bank_name: paymentData.payment_bank_name || undefined,
        payment_recipient_name: paymentData.payment_recipient_name || undefined,
        payment_card_number: paymentData.payment_card_number || undefined,
        payment_monobank_jar: paymentData.payment_monobank_jar || undefined,
      })
      showSuccess('Реквізити збережено!')
      await loadData()
    } catch (error) {
      console.error('Error updating payment info:', error)
    } finally {
      setSavingPayment(false)
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showSuccess('Будь ласка, оберіть зображення')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showSuccess('Розмір файлу не повинен перевищувати 5MB')
      return
    }

    setUploadingPhoto(true)
    try {
      const { url } = await uploadApi.uploadLogo(file)
      await companyApi.updateCompany({ logo_url: url })
      showSuccess('Фото успішно завантажено!')
      await loadData()
    } catch (error) {
      console.error('Error uploading photo:', error)
      showSuccess('Помилка при завантаженні фото')
    } finally {
      setUploadingPhoto(false)
      // Reset input
      if (photoInputRef.current) {
        photoInputRef.current.value = ''
      }
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
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Профіль</h1>
        {success && (
          <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
            {success}
          </span>
        )}
      </div>

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
          {/* Photo Upload Section */}
          <div className="flex items-center gap-6 mb-6 pb-6 border-b">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
                {company?.logo_url ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'}${company.logo_url}`}
                    alt="Фото спеціаліста"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {uploadingPhoto ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Фото профілю</h3>
              <p className="text-sm text-gray-500 mb-2">
                Це фото буде відображатись на вашому сайті
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Завантаження...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Завантажити фото
                  </>
                )}
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmitUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-gray-50"
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
              <p className="text-xs text-gray-500">
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

      {/* Company Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Інформація про компанію
          </CardTitle>
          <CardDescription>
            Контактні дані та опис вашої компанії
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitCompany} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Назва</Label>
              <Input
                id="company_name"
                value={companyData.name}
                onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Опис</Label>
              <Textarea
                id="description"
                value={companyData.description}
                onChange={(e) => setCompanyData({ ...companyData, description: e.target.value })}
                placeholder="Розкажіть про вашу компанію..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-1">
                  <Phone className="h-4 w-4" /> Телефон
                </Label>
                <Input
                  id="phone"
                  value={companyData.phone}
                  onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                  placeholder="+380..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telegram">Telegram</Label>
                <Input
                  id="telegram"
                  value={companyData.telegram}
                  onChange={(e) => setCompanyData({ ...companyData, telegram: e.target.value })}
                  placeholder="@username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-1">
                <MapPin className="h-4 w-4" /> Адреса
              </Label>
              <Input
                id="address"
                value={companyData.address}
                onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                placeholder="м. Київ, вул. Хрещатик, 1"
              />
            </div>

            <div className="pt-2 space-y-2">
              <Label className="text-gray-500">Код запрошення</Label>
              <div className="flex items-center gap-2">
                <Input value={inviteLink} readOnly className="text-sm font-mono" />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(inviteLink)}
                >
                  Копіювати
                </Button>
              </div>
            </div>

            <Button type="submit" disabled={savingCompany}>
              <Save className="mr-2 h-4 w-4" />
              {savingCompany ? 'Збереження...' : 'Зберегти'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Payment Requisites */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Реквізити для оплати
          </CardTitle>
          <CardDescription>
            Дані для прийому оплати від клієнтів
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitPayment} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payment_iban" className="flex items-center gap-1">
                <Banknote className="h-4 w-4" /> IBAN
              </Label>
              <Input
                id="payment_iban"
                value={paymentData.payment_iban}
                onChange={(e) => setPaymentData({ ...paymentData, payment_iban: e.target.value })}
                placeholder="UA213223130000026007233566001"
                maxLength={34}
              />
              <p className="text-xs text-gray-500">
                Формат: UA + 27 цифр
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment_bank_name">Назва банку</Label>
                <Input
                  id="payment_bank_name"
                  value={paymentData.payment_bank_name}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_bank_name: e.target.value })}
                  placeholder="ПриватБанк"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_recipient_name">ПІБ отримувача</Label>
                <Input
                  id="payment_recipient_name"
                  value={paymentData.payment_recipient_name}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_recipient_name: e.target.value })}
                  placeholder="Іванов Іван Іванович"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_card_number" className="flex items-center gap-1">
                <CreditCard className="h-4 w-4" /> Номер картки
              </Label>
              <Input
                id="payment_card_number"
                value={paymentData.payment_card_number}
                onChange={(e) => setPaymentData({ ...paymentData, payment_card_number: e.target.value })}
                placeholder="5375 4141 0000 0000"
                maxLength={19}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_monobank_jar">Monobank банка (посилання)</Label>
              <Input
                id="payment_monobank_jar"
                value={paymentData.payment_monobank_jar}
                onChange={(e) => setPaymentData({ ...paymentData, payment_monobank_jar: e.target.value })}
                placeholder="https://send.monobank.ua/jar/..."
              />
            </div>

            <Button type="submit" disabled={savingPayment}>
              <Save className="mr-2 h-4 w-4" />
              {savingPayment ? 'Збереження...' : 'Зберегти реквізити'}
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
            Синхронізуйте записи з Google Calendar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!googleStatus?.connected ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
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
                    <p className="text-sm text-gray-500">
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
              <span className="text-gray-500">ID користувача</span>
              <span className="font-mono">{user?.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Роль</span>
              <span>{user?.role === 'admin' ? 'Адміністратор' : 'Лікар'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Slug компанії</span>
              <span className="font-mono">{company?.slug}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
