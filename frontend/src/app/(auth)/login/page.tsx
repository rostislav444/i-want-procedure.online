'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authApi, TelegramAuthData } from '@/lib/api'
import TelegramLoginButton from '@/components/TelegramLoginButton'

const TELEGRAM_BOT_NAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || ''

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleTelegramAuth = useCallback(async (user: TelegramAuthData) => {
    setError('')
    setLoading(true)

    try {
      const data = await authApi.telegramLogin(user)
      localStorage.setItem('token', data.access_token)
      document.cookie = `token=${data.access_token}; path=/; max-age=${60 * 60 * 24 * 7}`
      router.push('/services')
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Вхід</CardTitle>
          <CardDescription className="text-center">
            Увійдіть через Telegram для доступу до системи
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-4 text-gray-500">
              Вхід...
            </div>
          ) : TELEGRAM_BOT_NAME ? (
            <div className="flex justify-center py-4">
              <TelegramLoginButton
                botName={TELEGRAM_BOT_NAME}
                onAuth={handleTelegramAuth}
                buttonSize="large"
                cornerRadius={8}
              />
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              Telegram бот не налаштований
            </div>
          )}

          <p className="text-sm text-center text-gray-500 mt-4">
            Немає акаунту? Зареєструйтесь через бота{' '}
            <a
              href={`https://t.me/${TELEGRAM_BOT_NAME}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              @{TELEGRAM_BOT_NAME}
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
