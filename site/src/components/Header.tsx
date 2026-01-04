'use client'

import Link from 'next/link'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'

export default function Header() {
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
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="#demo"
            className="px-5 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full text-sm font-medium hover:shadow-lg hover:shadow-pink-500/25 transition-all hover:-translate-y-0.5"
          >
            Спробувати
          </Link>
        </div>
      </div>
    </header>
  )
}
