'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { companyApi, Company } from '@/lib/api'
import {
  ArrowLeft,
  CreditCard,
  Banknote,
  Save,
  Loader2,
  ExternalLink,
  CheckCircle2,
  CircleDot,
  Circle,
} from 'lucide-react'

type PaymentType = 'fop_acquiring' | 'monobank_jar' | 'requisites'

export default function PaymentSettingsPage() {
  const router = useRouter()
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const [paymentType, setPaymentType] = useState<PaymentType | null>(null)
  const [monoToken, setMonoToken] = useState('')
  const [jarLink, setJarLink] = useState('')
  const [requisites, setRequisites] = useState({
    payment_iban: '',
    payment_bank_name: '',
    payment_recipient_name: '',
    payment_card_number: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const data = await companyApi.getMyCompany()
      setCompany(data)
      setPaymentType((data.payment_type as PaymentType) || null)
      setMonoToken('')
      setJarLink(data.payment_monobank_jar || '')
      setRequisites({
        payment_iban: data.payment_iban || '',
        payment_bank_name: data.payment_bank_name || '',
        payment_recipient_name: data.payment_recipient_name || '',
        payment_card_number: data.payment_card_number || '',
      })
    } catch (error) {
      console.error('Error loading company:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const updateData: Record<string, any> = {
        payment_type: paymentType,
      }

      if (paymentType === 'fop_acquiring' && monoToken) {
        updateData.monobank_token = monoToken
      }
      if (paymentType === 'monobank_jar') {
        updateData.payment_monobank_jar = jarLink || undefined
      }
      if (paymentType === 'requisites') {
        updateData.payment_iban = requisites.payment_iban || undefined
        updateData.payment_bank_name = requisites.payment_bank_name || undefined
        updateData.payment_recipient_name = requisites.payment_recipient_name || undefined
        updateData.payment_card_number = requisites.payment_card_number || undefined
      }

      await companyApi.updateCompany(updateData)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      await loadData()
    } catch (error) {
      console.error('Error saving payment settings:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const options: { type: PaymentType; title: string; description: string; badge?: string }[] = [
    {
      type: 'fop_acquiring',
      title: 'Інтернет-еквайринг Monobank (ФОП)',
      description: 'Клієнт отримає посилання на оплату картою. Гроші зараховуються на ваш ФОП-рахунок.',
      badge: 'Рекомендовано',
    },
    {
      type: 'monobank_jar',
      title: 'Monobank банка',
      description: 'Клієнт отримає посилання на вашу банку для переказу коштів.',
    },
    {
      type: 'requisites',
      title: 'Реквізити для оплати',
      description: 'Клієнт отримає ваші реквізити (IBAN, номер картки) текстовим повідомленням.',
    },
  ]

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <CreditCard className="h-6 w-6" />
              Налаштування оплат
            </h1>
            <p className="text-muted-foreground">
              Оберіть спосіб прийому оплати від клієнтів
            </p>
          </div>
        </div>
        {success && (
          <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" />
            Збережено!
          </span>
        )}
      </div>

      {/* Payment method selection */}
      <div className="space-y-3">
        {options.map((option) => {
          const isSelected = paymentType === option.type
          return (
            <button
              key={option.type}
              type="button"
              onClick={() => setPaymentType(option.type)}
              className={`w-full text-left rounded-xl border-2 p-5 transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/30'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="mt-0.5">
                  {isSelected ? (
                    <CircleDot className="h-5 w-5 text-primary" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{option.title}</h3>
                    {option.badge && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-medium">
                        {option.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {option.description}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Settings for selected payment type */}
      {paymentType === 'fop_acquiring' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Налаштування еквайрингу Monobank</CardTitle>
            <CardDescription>
              Для прийому оплат потрібен ФОП-рахунок в Monobank та токен інтеграції
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Instruction link */}
            <div className="rounded-lg border bg-blue-50 border-blue-200 p-4">
              <h4 className="font-medium text-blue-900 mb-2">Як отримати токен?</h4>
              <ol className="text-sm text-blue-800 space-y-1.5 list-decimal list-inside">
                <li>Відкрийте ФОП-рахунок в Monobank (безкоштовно, ~2 хв)</li>
                <li>Активуйте інтернет-еквайринг</li>
                <li>В розділі &quot;Інтеграції&quot; згенеруйте токен</li>
                <li>Вставте токен нижче</li>
              </ol>
              <a
                href="https://docs.google.com/document/d/1PtwpkM9q9Twk4mm_O59gIQ_GJEIr_r6DHEx4ciGEsqQ"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-blue-700 hover:text-blue-900 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Детальна інструкція з картинками
              </a>
            </div>

            {/* Token status */}
            {company?.has_monobank_token && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                <CheckCircle2 className="h-4 w-4" />
                Токен вже підключено. Введіть новий, щоб замінити.
              </div>
            )}

            {/* Token input */}
            <div className="space-y-2">
              <Label htmlFor="mono_token">Токен інтеграції Monobank</Label>
              <Input
                id="mono_token"
                type="password"
                value={monoToken}
                onChange={(e) => setMonoToken(e.target.value)}
                placeholder={company?.has_monobank_token ? '••••••••••••' : 'Вставте токен сюди'}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {paymentType === 'monobank_jar' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monobank банка</CardTitle>
            <CardDescription>
              Вставте посилання на вашу Monobank банку
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="jar_link">Посилання на банку</Label>
              <Input
                id="jar_link"
                value={jarLink}
                onChange={(e) => setJarLink(e.target.value)}
                placeholder="https://send.monobank.ua/jar/..."
              />
              <p className="text-xs text-muted-foreground">
                Створіть банку в додатку Monobank та скопіюйте посилання
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {paymentType === 'requisites' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Реквізити для оплати</CardTitle>
            <CardDescription>
              Ці дані будуть надіслані клієнту для здійснення переказу
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payment_iban" className="flex items-center gap-1">
                <Banknote className="h-4 w-4" /> IBAN
              </Label>
              <Input
                id="payment_iban"
                value={requisites.payment_iban}
                onChange={(e) => setRequisites({ ...requisites, payment_iban: e.target.value })}
                placeholder="UA213223130000026007233566001"
                maxLength={34}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment_bank_name">Назва банку</Label>
                <Input
                  id="payment_bank_name"
                  value={requisites.payment_bank_name}
                  onChange={(e) => setRequisites({ ...requisites, payment_bank_name: e.target.value })}
                  placeholder="ПриватБанк"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_recipient_name">ПІБ отримувача</Label>
                <Input
                  id="payment_recipient_name"
                  value={requisites.payment_recipient_name}
                  onChange={(e) => setRequisites({ ...requisites, payment_recipient_name: e.target.value })}
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
                value={requisites.payment_card_number}
                onChange={(e) => setRequisites({ ...requisites, payment_card_number: e.target.value })}
                placeholder="5375 4141 0000 0000"
                maxLength={19}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save button */}
      {paymentType && (
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Збереження...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Зберегти налаштування
            </>
          )}
        </Button>
      )}
    </div>
  )
}
