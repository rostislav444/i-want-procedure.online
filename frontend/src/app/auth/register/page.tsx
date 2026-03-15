'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { authApi } from '@/lib/api'
import { Stethoscope, GraduationCap, Building2, Check } from 'lucide-react'

type CompanyType = 'solo' | 'clinic' | 'educator'

const ACCOUNT_TYPES = [
  {
    value: 'solo' as CompanyType,
    label: 'Спеціаліст',
    description: 'Косметолог, майстер манікюру, майстер брів та ін.',
    icon: Stethoscope,
    color: 'text-pink-500',
    bg: 'bg-pink-50 dark:bg-pink-500/10',
    border: 'border-pink-500',
  },
  {
    value: 'clinic' as CompanyType,
    label: 'Клініка / Салон',
    description: 'Б\'юті-студія, клініка естетичної медицини, салон краси',
    icon: Building2,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    border: 'border-blue-500',
  },
  {
    value: 'educator' as CompanyType,
    label: 'Тренер / Спікер',
    description: 'Навчаю спеціалістів, проводжу курси, семінари та майстер-класи',
    icon: GraduationCap,
    color: 'text-violet-500',
    bg: 'bg-violet-50 dark:bg-violet-500/10',
    border: 'border-violet-500',
  },
]

const COMPANY_NAME_LABELS: Record<CompanyType, string> = {
  solo: "Ім'я для відображення",
  clinic: 'Назва клініки / студії',
  educator: 'Ваше ім\'я або назва школи',
}

const COMPANY_NAME_PLACEHOLDERS: Record<CompanyType, string> = {
  solo: 'Наприклад: Олена Коваль',
  clinic: 'Наприклад: Beauty Studio Kyiv',
  educator: 'Наприклад: Олена Коваль Academy',
}

function RegisterPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    company_name: '',
    company_type: 'solo' as CompanyType,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [refCode, setRefCode] = useState<string | null>(null)

  useEffect(() => {
    const ref = searchParams.get('ref') || localStorage.getItem('ref_code')
    if (ref) {
      setRefCode(ref)
      localStorage.setItem('ref_code', ref)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await authApi.register(formData, refCode || undefined)
      const loginData = await authApi.login(formData.email, formData.password)
      localStorage.setItem('token', loginData.access_token)
      localStorage.setItem('company_type', formData.company_type)
      localStorage.removeItem('ref_code')
      document.cookie = `token=${loginData.access_token}; path=/; max-age=${60 * 60 * 24 * 7}`
      router.push(formData.company_type === 'educator' ? '/education/admin' : '/admin/services')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Помилка реєстрації')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-lg bg-white dark:bg-gray-900 dark:border-gray-800">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Реєстрація</CardTitle>
          <CardDescription className="text-center">
            Оберіть тип акаунту та заповніть дані
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            {error && (
              <div className="bg-red-50 dark:bg-red-950/50 text-red-500 dark:text-red-400 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Account type selector */}
            <div className="space-y-2">
              <Label>Тип акаунту</Label>
              <div className="grid gap-3">
                {ACCOUNT_TYPES.map((type) => {
                  const Icon = type.icon
                  const isSelected = formData.company_type === type.value
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, company_type: type.value })}
                      className={`flex items-center gap-4 p-3 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? `${type.border} ${type.bg}`
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${type.bg}`}>
                        <Icon className={`w-5 h-5 ${type.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm dark:text-white">{type.label}</div>
                        <div className="text-xs text-muted-foreground dark:text-gray-400 mt-0.5">{type.description}</div>
                      </div>
                      {isSelected && (
                        <Check className={`w-5 h-5 ${type.color} flex-shrink-0`} />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">Ім'я</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  className="bg-white dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Прізвище</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  className="bg-white dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_name">{COMPANY_NAME_LABELS[formData.company_type]}</Label>
              <Input
                id="company_name"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                placeholder={COMPANY_NAME_PLACEHOLDERS[formData.company_type]}
                required
                className="bg-white dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="bg-white dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="bg-white dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Реєстрація...' : 'Зареєструватися'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Вже є акаунт?{' '}
              <Link href="/auth/login" className="text-primary hover:underline">
                Увійти
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterPageContent />
    </Suspense>
  )
}
