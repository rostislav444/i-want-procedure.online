'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { LogIn, UserCircle, Stethoscope, ChevronDown, MessageCircle } from 'lucide-react'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'

const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3000'
const CLIENT_BOT_NAME = process.env.NEXT_PUBLIC_CLIENT_BOT_NAME || 'i_want_procedure_bot'
const DOCTOR_BOT_NAME = process.env.NEXT_PUBLIC_DOCTOR_BOT_NAME || 'doctor_i_want_procedure_bot'

export default function Header() {
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLoginOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b bg-white/85 dark:bg-[#0f0f1a]/95">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-14 w-auto" width={280} height={90} />
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="#features" className="text-muted-foreground hover:text-pink-500 transition-colors">Можливості</Link>
          <Link href="#bots" className="text-muted-foreground hover:text-pink-500 transition-colors">Telegram боти</Link>
          <Link href="#screenshots" className="text-muted-foreground hover:text-pink-500 transition-colors">Як це виглядає</Link>
          <Link href="#pricing" className="text-muted-foreground hover:text-pink-500 transition-colors">Тарифи</Link>
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {/* Login Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsLoginOpen(!isLoginOpen)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-foreground hover:text-pink-500 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Увійти</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isLoginOpen ? 'rotate-180' : ''}`} />
            </button>

            {isLoginOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-2">
                  <Link
                    href="/client"
                    onClick={() => setIsLoginOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <UserCircle className="w-5 h-5 text-pink-500" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">Як клієнт</div>
                      <div className="text-xs text-muted-foreground">Перегляд записів</div>
                    </div>
                  </Link>
                  <Link
                    href="/auth/login"
                    onClick={() => setIsLoginOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Stethoscope className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">Як спеціаліст</div>
                      <div className="text-xs text-muted-foreground">CRM панель</div>
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Register via Telegram */}
          <Link
            href={`https://t.me/${DOCTOR_BOT_NAME}`}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full text-sm font-medium hover:shadow-lg hover:shadow-pink-500/25 transition-all hover:-translate-y-0.5"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Спробувати</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
