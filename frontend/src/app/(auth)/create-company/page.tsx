'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { companyApi, authApi } from '@/lib/api'
import { Building2, User } from 'lucide-react'

type CompanyType = 'solo' | 'clinic'

export default function CreateCompanyPage() {
  const router = useRouter()
  const [companyName, setCompanyName] = useState('')
  const [companyType, setCompanyType] = useState<CompanyType>('solo')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    // Check if user is logged in and doesn't have a company
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/login')
          return
        }

        const user = await authApi.getMe()
        if (user.company_id) {
          // User already has a company, redirect to dashboard
          router.push('/admin')
          return
        }

        // Pre-fill company name with user's name
        setCompanyName(`${user.first_name} ${user.last_name}`)
      } catch (err) {
        router.push('/login')
      } finally {
        setCheckingAuth(false)
      }
    }

    checkAuth()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await companyApi.createCompany({
        name: companyName,
        type: companyType,
      })
      router.push('/admin')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Помилка створення компанії')
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Завантаження...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Створення компанії</CardTitle>
          <CardDescription className="text-center">
            Створіть свою компанію для початку роботи
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="companyName">Назва компанії</Label>
              <Input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Введіть назву компанії"
                required
              />
              <p className="text-xs text-gray-500">
                Наприклад: ваше ім&apos;я або назва салону
              </p>
            </div>

            <div className="space-y-3">
              <Label>Тип компанії</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCompanyType('solo')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    companyType === 'solo'
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <User className={`w-8 h-8 mx-auto mb-2 ${companyType === 'solo' ? 'text-primary' : 'text-gray-400'}`} />
                  <div className={`font-medium ${companyType === 'solo' ? 'text-primary' : 'text-gray-700'}`}>
                    Особистий
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Працюю сам
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setCompanyType('clinic')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    companyType === 'clinic'
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Building2 className={`w-8 h-8 mx-auto mb-2 ${companyType === 'clinic' ? 'text-primary' : 'text-gray-400'}`} />
                  <div className={`font-medium ${companyType === 'clinic' ? 'text-primary' : 'text-gray-700'}`}>
                    Клініка
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Команда спеціалістів
                  </div>
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading || !companyName}>
              {loading ? 'Створення...' : 'Створити компанію'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
