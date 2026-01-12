'use client'

import Link from 'next/link'
import Logo from './Logo'

export default function Footer() {
  return (
    <footer className="py-12 border-t bg-card">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-12 w-auto" width={220} height={70} />
          </Link>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-pink-500 transition-colors">Політика конфіденційності</Link>
            <Link href="/terms" className="hover:text-pink-500 transition-colors">Умови використання</Link>
          </div>
          <div className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Procedure
          </div>
        </div>
      </div>
    </footer>
  )
}
