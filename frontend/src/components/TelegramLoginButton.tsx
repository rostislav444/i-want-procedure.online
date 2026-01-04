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

// Global callback name to avoid recreating on each render
const CALLBACK_NAME = 'TelegramLoginWidgetCallback'

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
  const onAuthRef = useRef(onAuth)

  // Keep onAuth ref updated without triggering useEffect
  useEffect(() => {
    onAuthRef.current = onAuth
  }, [onAuth])

  useEffect(() => {
    // Set up global callback that uses ref
    ;(window as any)[CALLBACK_NAME] = (user: TelegramUser) => {
      onAuthRef.current(user)
    }

    // Create script element
    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.async = true
    script.setAttribute('data-telegram-login', botName)
    script.setAttribute('data-size', buttonSize)
    script.setAttribute('data-onauth', `${CALLBACK_NAME}(user)`)
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
      delete (window as any)[CALLBACK_NAME]
    }
  }, [botName, buttonSize, cornerRadius, requestAccess, showUserPhoto, lang])

  return <div ref={containerRef} className="flex justify-center" />
}
