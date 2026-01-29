'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { authApi } from '@/lib/api'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    company_name: '',
    company_type: 'solo' as 'solo' | 'clinic',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await authApi.register(formData)
      const loginData = await authApi.login(formData.email, formData.password)
      localStorage.setItem('token', loginData.access_token)
      // Also set cookie for SSR
      document.cookie = `token=${loginData.access_token}; path=/; max-age=${60 * 60 * 24 * 7}` // 7 days
      router.push('/admin/services')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Помилка реєстрації')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md bg-white dark:bg-gray-900 dark:border-gray-800">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Реєстрація</CardTitle>
          <CardDescription className="text-center">
            Створіть акаунт для управління записами
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-950/50 text-red-500 dark:text-red-400 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
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
            <div className="space-y-2">
              <Label htmlFor="company_type">Тип</Label>
              <select
                id="company_type"
                name="company_type"
                value={formData.company_type}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-white dark:bg-gray-800 dark:border-gray-700 px-3 py-2 text-sm"
              >
                <option value="solo">Індивідуальний спеціаліст</option>
                <option value="clinic">Клініка</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_name">
                {formData.company_type === 'solo' ? "Ім'я для відображення" : 'Назва клініки'}
              </Label>
              <Input
                id="company_name"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                placeholder={formData.company_type === 'solo' ? 'Наприклад: Др. Іванов' : 'Назва клініки'}
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
