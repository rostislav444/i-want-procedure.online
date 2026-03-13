'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogIn, Stethoscope, GraduationCap, MessageCircle, ChevronDown, UserCircle, LogOut } from 'lucide-react'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'

const DOCTOR_BOT_NAME = process.env.NEXT_PUBLIC_DOCTOR_BOT_NAME || 'doctor_i_want_procedure_bot'

const CABINETS = [
  {
    key: 'specialist',
    label: 'Кабінет спеціаліста',
    href: '/admin',
    icon: Stethoscope,
    color: 'text-pink-500',
    bg: 'bg-pink-50 dark:bg-pink-500/10',
  },
  {
    key: 'educator',
    label: 'Кабінет спікера',
    href: '/education/admin',
    icon: GraduationCap,
    color: 'text-violet-500',
    bg: 'bg-violet-50 dark:bg-violet-500/10',
  },
  {
    key: 'client',
    label: 'Мої записи',
    href: '/admin/my-courses',
    icon: UserCircle,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-500/10',
  },
]

export default function Header() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activeCabinetKey, setActiveCabinetKey] = useState<string>('specialist')
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      setIsLoggedIn(true)
      const companyType = localStorage.getItem('company_type') || 'solo'
      const lastCabinet = localStorage.getItem('last_cabinet')
      if (lastCabinet) {
        setActiveCabinetKey(lastCabinet)
      } else {
        setActiveCabinetKey(companyType === 'educator' ? 'educator' : 'specialist')
      }
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const activeCabinet = CABINETS.find(c => c.key === activeCabinetKey) || CABINETS[0]

  const handleSelectCabinet = (cabinet: typeof CABINETS[0]) => {
    setActiveCabinetKey(cabinet.key)
    localStorage.setItem('last_cabinet', cabinet.key)
    setIsOpen(false)
    router.push(cabinet.href)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('company_type')
    localStorage.removeItem('last_cabinet')
    document.cookie = 'token=; path=/; max-age=0'
    setIsLoggedIn(false)
    setIsOpen(false)
    router.push('/')
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b bg-white/85 dark:bg-[#0f0f1a]/95 dark:border-white/10">
      <div className="max-w-6xl mx-auto px-4 py-3 sm:py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-12 sm:h-14 w-auto" width={280} height={90} />
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/marketplace" className="text-muted-foreground dark:text-gray-300 hover:text-pink-500 transition-colors font-medium">Маркетплейс</Link>
          <Link href="/education" className="text-muted-foreground dark:text-gray-300 hover:text-pink-500 transition-colors font-medium">Навчання</Link>
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {isLoggedIn ? (
            <div className="relative" ref={dropdownRef}>
              {/* Split button */}
              <div className="flex items-center rounded-full overflow-hidden bg-gradient-to-r from-pink-500 to-rose-500 shadow-sm hover:shadow-lg hover:shadow-pink-500/25 transition-all">
                <Link
                  href={activeCabinet.href}
                  className="flex items-center gap-2 pl-4 pr-3 py-2 text-sm font-medium text-white"
                >
                  <activeCabinet.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">{activeCabinet.label}</span>
                  <span className="sm:hidden">Кабінет</span>
                </Link>
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="pl-1 pr-3 py-2 text-white border-l border-white/20 hover:bg-white/10 transition-colors"
                  aria-label="Обрати кабінет"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Dropdown */}
              {isOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white dark:bg-[#1a1a2e] shadow-xl border border-gray-200 dark:border-white/10 overflow-hidden z-50">
                  <div className="p-1.5 space-y-0.5">
                    {CABINETS.map((cabinet) => {
                      const Icon = cabinet.icon
                      const isActive = cabinet.key === activeCabinetKey
                      return (
                        <button
                          key={cabinet.key}
                          onClick={() => handleSelectCabinet(cabinet)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                            isActive
                              ? `${cabinet.bg} font-medium`
                              : 'hover:bg-gray-50 dark:hover:bg-white/5'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cabinet.bg}`}>
                            <Icon className={`w-4 h-4 ${cabinet.color}`} />
                          </div>
                          <span className={`text-sm ${isActive ? cabinet.color : 'dark:text-gray-200'}`}>
                            {cabinet.label}
                          </span>
                          {isActive && <div className={`ml-auto w-1.5 h-1.5 rounded-full ${cabinet.color.replace('text-', 'bg-')}`} />}
                        </button>
                      )
                    })}
                  </div>
                  <div className="border-t border-gray-100 dark:border-white/10 p-1.5">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-50 dark:bg-red-500/10">
                        <LogOut className="w-4 h-4 text-red-500" />
                      </div>
                      <span className="text-sm text-red-500">Вийти</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="flex items-center gap-1.5 px-4 sm:px-5 py-2 text-sm font-medium border border-gray-200 dark:border-white/10 rounded-full hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Увійти</span>
              </Link>
              <Link
                href={`https://t.me/${DOCTOR_BOT_NAME}`}
                className="hidden md:flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full text-sm font-medium hover:shadow-lg hover:shadow-pink-500/25 transition-all hover:-translate-y-0.5"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Спробувати</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
