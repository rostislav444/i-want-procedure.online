'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, MessageCircle } from 'lucide-react'

export function HeroCTA() {
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    setLoggedIn(!!localStorage.getItem('token'))
  }, [])

  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-5">
      {loggedIn ? (
        <Link
          href="/admin"
          className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full text-sm font-semibold hover:shadow-lg hover:shadow-pink-500/30 transition-all hover:-translate-y-0.5"
        >
          Панель адміністрування
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      ) : (
        <>
          <Link
            href="/admin"
            className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full text-sm font-semibold hover:shadow-lg hover:shadow-pink-500/30 transition-all hover:-translate-y-0.5"
          >
            Спробувати безкоштовно
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="#features"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-white/10 backdrop-blur-sm border border-pink-200 dark:border-white/20 text-gray-700 dark:text-white rounded-full text-sm font-medium hover:bg-pink-50 dark:hover:bg-white/15 transition-all"
          >
            Як це працює
          </Link>
        </>
      )}
    </div>
  )
}

export function BottomCTA() {
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    setLoggedIn(!!localStorage.getItem('token'))
  }, [])

  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center mb-5">
      {loggedIn ? (
        <Link
          href="/admin"
          className="group inline-flex items-center justify-center gap-2 px-7 py-3 bg-white text-pink-600 rounded-full text-sm font-semibold hover:shadow-xl hover:shadow-white/30 transition-all hover:-translate-y-0.5"
        >
          Панель адміністрування
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      ) : (
        <>
          <Link
            href="/admin"
            className="group inline-flex items-center justify-center gap-2 px-7 py-3 bg-white text-pink-600 rounded-full text-sm font-semibold hover:shadow-xl hover:shadow-white/30 transition-all hover:-translate-y-0.5"
          >
            Спробувати безкоштовно
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="https://t.me/doctor_i_want_procedure_bot"
            className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-white/10 text-white border border-white/30 rounded-full text-sm font-medium hover:bg-white/20 transition-all backdrop-blur-sm"
          >
            <MessageCircle className="w-4 h-4" />
            Написати в Telegram
          </Link>
        </>
      )}
    </div>
  )
}
