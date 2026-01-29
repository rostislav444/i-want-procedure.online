'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCompany } from '@/contexts/CompanyContext'
import { companyApi, uploadApi, Company } from '@/lib/api'
import {
  Settings,
  Users,
  Building2,
  CreditCard,
  Phone,
  MapPin,
  Banknote,
  Camera,
  Upload,
  Loader2,
  Save,
  ChevronRight,
} from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const { companyType } = useCompany()

  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingCompany, setSavingCompany] = useState(false)
  const [savingPayment, setSavingPayment] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

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
    if (companyType && companyType !== 'clinic') {
      router.push('/admin')
      return
    }
    loadData()
  }, [companyType])

  const loadData = async () => {
    try {
      const companyResponse = await companyApi.getMyCompany()
      setCompany(companyResponse)
      setCompanyData({
        name: companyResponse.name || '',
        description: companyResponse.description || '',
        phone: companyResponse.phone || '',
        address: companyResponse.address || '',
        telegram: companyResponse.telegram || '',
      })
      setPaymentData({
        payment_iban: companyResponse.payment_iban || '',
        payment_bank_name: companyResponse.payment_bank_name || '',
        payment_recipient_name: companyResponse.payment_recipient_name || '',
        payment_card_number: companyResponse.payment_card_number || '',
        payment_monobank_jar: companyResponse.payment_monobank_jar || '',
      })
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const showSuccess = (message: string) => {
    setSuccess(message)
    setTimeout(() => setSuccess(null), 3000)
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
      showSuccess('Дані клініки збережено!')
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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showSuccess('Будь ласка, оберіть зображення')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      showSuccess('Розмір файлу не повинен перевищувати 5MB')
      return
    }

    setUploadingLogo(true)
    try {
      const { url } = await uploadApi.uploadLogo(file)
      await companyApi.updateCompany({ logo_url: url })
      showSuccess('Логотип успішно завантажено!')
      await loadData()
    } catch (error) {
      console.error('Error uploading logo:', error)
      showSuccess('Помилка при завантаженні логотипу')
    } finally {
      setUploadingLogo(false)
      if (logoInputRef.current) {
        logoInputRef.current.value = ''
      }
    }
  }

  if (companyType !== 'clinic') {
    return null
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Налаштування
          </h1>
          <p className="text-muted-foreground">
            Управління налаштуваннями клініки
          </p>
        </div>
        {success && (
          <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
            {success}
          </span>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/admin/team">
          <Card className="h-full transition-colors hover:border-primary/50 cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">Команда та посади</h3>
                  <p className="text-sm text-muted-foreground">
                    Управління спеціалістами
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Company Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Інформація про клініку
          </CardTitle>
          <CardDescription>
            Контактні дані та опис вашої клініки
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Logo Upload Section */}
          <div className="flex items-center gap-6 mb-6 pb-6 border-b">
            <div className="relative group">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                {company?.logo_url ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'}${company.logo_url}`}
                    alt="Логотип клініки"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {uploadingLogo ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
              </button>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>
            <div>
              <h3 className="font-medium">Логотип клініки</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Відображається на вашому сайті та в боті
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
              >
                {uploadingLogo ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Завантаження...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Завантажити
                  </>
                )}
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmitCompany} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Назва клініки</Label>
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
                placeholder="Розкажіть про вашу клініку..."
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
                <Label htmlFor="telegram" className="flex items-center gap-1">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                  Telegram
                </Label>
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
              <Label className="text-muted-foreground">Код запрошення для клієнтів</Label>
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
              <p className="text-xs text-muted-foreground">
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

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Інформація про обліковий запис</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID компанії</span>
              <span className="font-mono">{company?.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Slug компанії</span>
              <span className="font-mono">{company?.slug}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Тип</span>
              <span>{company?.type === 'clinic' ? 'Клініка' : 'ФОП'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
