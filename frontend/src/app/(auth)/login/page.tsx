'use client'

import { useState, useCallback, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi, googleApi, TelegramAuthData } from '@/lib/api'
import TelegramLoginButton from '@/components/TelegramLoginButton'

const TELEGRAM_BOT_NAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || ''

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)

  // Handle token from Google OAuth callback
  useEffect(() => {
    const token = searchParams.get('token')
    const errorParam = searchParams.get('error')
    const message = searchParams.get('message')

    if (token) {
      localStorage.setItem('token', token)
      document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`
      router.push('/')
    } else if (errorParam) {
      if (errorParam === 'invalid_state') {
        setError('Невірний стан авторизації. Спробуйте ще раз.')
      } else if (errorParam === 'google_auth_failed') {
        setError(`Помилка авторизації Google: ${message || 'невідома помилка'}`)
      } else {
        setError(`Помилка: ${errorParam}`)
      }
    }
  }, [searchParams, router])

  const handleTelegramAuth = useCallback(async (user: TelegramAuthData) => {
    setError('')
    setLoading(true)

    try {
      const data = await authApi.telegramLogin(user)
      localStorage.setItem('token', data.access_token)
      document.cookie = `token=${data.access_token}; path=/; max-age=${60 * 60 * 24 * 7}`

      const me = await authApi.getMe()
      if (!me.company_id) {
        router.push('/create-company')
      } else {
        router.push('/')
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail
      if (detail?.includes('not found')) {
        setError('Користувача не знайдено. Спочатку зареєструйтесь через Telegram бота @' + TELEGRAM_BOT_NAME)
      } else {
        setError(detail || 'Помилка входу через Telegram')
      }
    } finally {
      setLoading(false)
    }
  }, [router])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await authApi.login(email, password)
      localStorage.setItem('token', data.access_token)
      document.cookie = `token=${data.access_token}; path=/; max-age=${60 * 60 * 24 * 7}`

      const me = await authApi.getMe()
      if (!me.company_id) {
        router.push('/create-company')
      } else {
        router.push('/')
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail
      setError(detail || 'Невірний email або пароль')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError('')
    setGoogleLoading(true)

    try {
      const { url } = await googleApi.getAuthUrl('login')
      window.location.href = url
    } catch (err: any) {
      const detail = err.response?.data?.detail
      if (detail === 'Google OAuth not configured') {
        setError('Google авторизація не налаштована')
      } else {
        setError(detail || 'Помилка отримання URL авторизації')
      }
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Вхід</CardTitle>
          <CardDescription className="text-center">
            Увійдіть для доступу до системи
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Вхід...' : 'Увійти'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">або</span>
            </div>
          </div>

          {/* Google Login */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {googleLoading ? 'Завантаження...' : 'Увійти через Google'}
          </Button>

          {/* Telegram Login */}
          {TELEGRAM_BOT_NAME && (
            <>
              <div className="flex justify-center py-2">
                <TelegramLoginButton
                  botName={TELEGRAM_BOT_NAME}
                  onAuth={handleTelegramAuth}
                  buttonSize="large"
                  cornerRadius={8}
                />
              </div>
            </>
          )}

          <p className="text-sm text-center text-gray-500 mt-4">
            Немає акаунту?{' '}
            <a href="/register" className="text-primary hover:underline">
              Зареєструватися
            </a>
            {TELEGRAM_BOT_NAME && (
              <>
                {' або через бота '}
                <a
                  href={`https://t.me/${TELEGRAM_BOT_NAME}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  @{TELEGRAM_BOT_NAME}
                </a>
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
