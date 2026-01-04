'use client'

import { useEffect, useRef } from 'react'

interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

interface TelegramLoginButtonProps {
  botName: string
  onAuth: (user: TelegramUser) => void
  buttonSize?: 'large' | 'medium' | 'small'
  cornerRadius?: number
  requestAccess?: 'write' | null
  showUserPhoto?: boolean
  lang?: string
}

export default function TelegramLoginButton({
  botName,
  onAuth,
  buttonSize = 'large',
  cornerRadius,
  requestAccess = 'write',
  showUserPhoto = true,
  lang = 'uk',
}: TelegramLoginButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Create unique callback function name
    const callbackName = `TelegramLoginWidgetCallback_${Date.now()}`
    ;(window as any)[callbackName] = (user: TelegramUser) => {
      onAuth(user)
    }

    // Create script element
    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.async = true
    script.setAttribute('data-telegram-login', botName)
    script.setAttribute('data-size', buttonSize)
    script.setAttribute('data-onauth', `${callbackName}(user)`)
    script.setAttribute('data-lang', lang)

    if (requestAccess) {
      script.setAttribute('data-request-access', requestAccess)
    }
    if (cornerRadius !== undefined) {
      script.setAttribute('data-radius', cornerRadius.toString())
    }
    if (!showUserPhoto) {
      script.setAttribute('data-userpic', 'false')
    }

    // Append to container
    if (containerRef.current) {
      containerRef.current.innerHTML = ''
      containerRef.current.appendChild(script)
    }

    return () => {
      delete (window as any)[callbackName]
    }
  }, [botName, buttonSize, cornerRadius, requestAccess, showUserPhoto, lang, onAuth])

  return <div ref={containerRef} className="flex justify-center" />
}
