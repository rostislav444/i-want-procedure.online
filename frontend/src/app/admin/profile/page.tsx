'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { User, Building2, Save, Globe, Palette, Upload, Image, ExternalLink, Instagram, Facebook, Phone, MapPin, Clock, FileText, CreditCard, Banknote, Calendar, Link2, Unlink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { authApi, companyApi, uploadApi, googleApi, Company, GoogleCalendarInfo } from '@/lib/api'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface UserData {
  id: number
  email: string
  first_name: string
  last_name: string
  telegram_id: number | null
  role: string
}

const TEMPLATE_OPTIONS = [
  { value: 'solo', label: 'Solo', description: 'Для індивідуального спеціаліста' },
  { value: 'clinic', label: 'Clinic', description: 'Для клініки або салону' },
  { value: 'premium', label: 'Premium', description: 'Розширений шаблон' },
]

const COLOR_OPTIONS = [
  { value: '#e91e63', label: 'Рожевий' },
  { value: '#9c27b0', label: 'Фіолетовий' },
  { value: '#3f51b5', label: 'Синій' },
  { value: '#009688', label: 'Бірюзовий' },
  { value: '#4caf50', label: 'Зелений' },
  { value: '#ff9800', label: 'Помаранчевий' },
  { value: '#f44336', label: 'Червоний' },
]

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingCompany, setSavingCompany] = useState(false)
  const [savingSite, setSavingSite] = useState(false)
  const [savingPayment, setSavingPayment] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [googleStatus, setGoogleStatus] = useState<GoogleCalendarInfo | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [selectedCalendar, setSelectedCalendar] = useState<string>('primary')

  const logoInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

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

  const [siteData, setSiteData] = useState({
    template_type: 'solo',
    primary_color: '#e91e63',
    specialization: '',
    working_hours: '',
    instagram: '',
    facebook: '',
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

      // Parse social links if exists
      let socialLinks = { instagram: '', facebook: '' }
      if (companyData.social_links) {
        try {
          socialLinks = JSON.parse(companyData.social_links)
        } catch {}
      }

      setSiteData({
        template_type: companyData.template_type || 'solo',
        primary_color: companyData.primary_color || '#e91e63',
        specialization: companyData.specialization || '',
        working_hours: companyData.working_hours || '',
        instagram: socialLinks.instagram || '',
        facebook: socialLinks.facebook || '',
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

  const handleSubmitSite = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingSite(true)
    try {
      const socialLinks = JSON.stringify({
        instagram: siteData.instagram,
        facebook: siteData.facebook,
      })

      await companyApi.updateCompany({
        template_type: siteData.template_type,
        primary_color: siteData.primary_color,
        specialization: siteData.specialization || undefined,
        working_hours: siteData.working_hours || undefined,
        social_links: socialLinks,
      })
      showSuccess('Налаштування сайту збережено!')
      await loadData()
    } catch (error) {
      console.error('Error updating site settings:', error)
    } finally {
      setSavingSite(false)
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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    try {
      const { url } = await uploadApi.uploadLogo(file)
      await companyApi.updateCompany({ logo_url: url })
      showSuccess('Логотип завантажено!')
      await loadData()
    } catch (error) {
      console.error('Error uploading logo:', error)
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingCover(true)
    try {
      const { url } = await uploadApi.uploadCover(file)
      await companyApi.updateCompany({ cover_image_url: url })
      showSuccess('Обкладинку завантажено!')
      await loadData()
    } catch (error) {
      console.error('Error uploading cover:', error)
    } finally {
      setUploadingCover(false)
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

  const botUsername = process.env.NEXT_PUBLIC_CLIENT_BOT_NAME || 'YOUR_BOT'
  const inviteLink = company ? `https://t.me/${botUsername}?start=${company.invite_code}` : ''
  const siteUrl = company ? `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/${company.slug}` : ''
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

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

      {/* Site Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Налаштування сайту
          </CardTitle>
          <CardDescription>
            Налаштуйте вигляд вашої публічної сторінки
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitSite} className="space-y-6">
            {/* Public page link */}
            <div className="p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg border border-pink-200">
              <Label className="text-gray-600 text-sm">Ваша публічна сторінка</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input value={siteUrl} readOnly className="font-mono text-sm bg-white" />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(siteUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Template Selection */}
            <div className="space-y-3">
              <Label className="flex items-center gap-1">
                <FileText className="h-4 w-4" /> Шаблон сайту
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {TEMPLATE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSiteData({ ...siteData, template_type: option.value })}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      siteData.template_type === option.value
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div className="space-y-3">
              <Label className="flex items-center gap-1">
                <Palette className="h-4 w-4" /> Основний колір
              </Label>
              <div className="flex gap-2 flex-wrap">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setSiteData({ ...siteData, primary_color: color.value })}
                    className={`w-10 h-10 rounded-full border-2 transition-transform ${
                      siteData.primary_color === color.value
                        ? 'border-gray-800 scale-110'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  />
                ))}
              </div>
            </div>

            {/* Logo Upload */}
            <div className="space-y-3">
              <Label className="flex items-center gap-1">
                <Upload className="h-4 w-4" /> Логотип
              </Label>
              <div className="flex items-center gap-4">
                {company?.logo_url ? (
                  <img
                    src={`${apiUrl}${company.logo_url}`}
                    alt="Logo"
                    className="w-20 h-20 object-cover rounded-lg border"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-100 rounded-lg border flex items-center justify-center">
                    <Image className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                  >
                    {uploadingLogo ? 'Завантаження...' : 'Завантажити логотип'}
                  </Button>
                  <p className="text-xs text-gray-500 mt-1">JPG, PNG до 5MB</p>
                </div>
              </div>
            </div>

            {/* Cover Upload */}
            <div className="space-y-3">
              <Label className="flex items-center gap-1">
                <Image className="h-4 w-4" /> Обкладинка
              </Label>
              <div className="space-y-2">
                {company?.cover_image_url ? (
                  <img
                    src={`${apiUrl}${company.cover_image_url}`}
                    alt="Cover"
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                ) : (
                  <div className="w-full h-32 bg-gray-100 rounded-lg border flex items-center justify-center">
                    <Image className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingCover}
                >
                  {uploadingCover ? 'Завантаження...' : 'Завантажити обкладинку'}
                </Button>
              </div>
            </div>

            {/* Specialization */}
            <div className="space-y-2">
              <Label htmlFor="specialization">Спеціалізація</Label>
              <Input
                id="specialization"
                value={siteData.specialization}
                onChange={(e) => setSiteData({ ...siteData, specialization: e.target.value })}
                placeholder="Косметолог, Масажист, Стоматолог..."
              />
            </div>

            {/* Working Hours */}
            <div className="space-y-2">
              <Label htmlFor="working_hours" className="flex items-center gap-1">
                <Clock className="h-4 w-4" /> Години роботи
              </Label>
              <Input
                id="working_hours"
                value={siteData.working_hours}
                onChange={(e) => setSiteData({ ...siteData, working_hours: e.target.value })}
                placeholder="Пн-Пт: 9:00-18:00, Сб: 10:00-15:00"
              />
            </div>

            {/* Social Links */}
            <div className="space-y-3">
              <Label>Соціальні мережі</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="instagram" className="text-sm flex items-center gap-1">
                    <Instagram className="h-4 w-4" /> Instagram
                  </Label>
                  <Input
                    id="instagram"
                    value={siteData.instagram}
                    onChange={(e) => setSiteData({ ...siteData, instagram: e.target.value })}
                    placeholder="@username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facebook" className="text-sm flex items-center gap-1">
                    <Facebook className="h-4 w-4" /> Facebook
                  </Label>
                  <Input
                    id="facebook"
                    value={siteData.facebook}
                    onChange={(e) => setSiteData({ ...siteData, facebook: e.target.value })}
                    placeholder="facebook.com/page"
                  />
                </div>
              </div>
            </div>

            <Button type="submit" disabled={savingSite}>
              <Save className="mr-2 h-4 w-4" />
              {savingSite ? 'Збереження...' : 'Зберегти налаштування'}
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
