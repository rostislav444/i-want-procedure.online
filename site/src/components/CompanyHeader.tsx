'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'

export default function CompanyHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-pink-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          На головну
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-10 w-auto" width={180} height={60} />
          </Link>
        </div>
      </div>
    </header>
  )
}
