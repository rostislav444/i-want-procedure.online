'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, ArrowLeft } from 'lucide-react'
import type { PublicCompany } from '@/lib/public-api'

interface Props {
  company: PublicCompany
  socialLinks: Record<string, string>
}

export function SiteNav({ company, socialLinks }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const base = `/marketplace/${company.id}-${company.slug}`
  const accentColor = company.primary_color || '#C9837A'

  const navItems = [
    { href: base, label: 'Головна', exact: true },
    { href: `${base}/services`, label: 'Послуги', exact: false },
    { href: `${base}/team`, label: 'Команда', exact: true },
    { href: `${base}/contacts`, label: 'Контакти', exact: true },
  ]

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#0f0f17]/95 backdrop-blur-md shadow-sm dark:shadow-black/30 border-b border-transparent dark:border-white/10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left: back + logo */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.back()}
              className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors flex-shrink-0"
              title="Назад"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-neutral-200 dark:bg-white/15 flex-shrink-0" />
            <Link href={base} className="flex items-center gap-2.5 min-w-0">
              {company.logo_url ? (
                <Image
                  src={company.logo_url}
                  alt={company.name}
                  width={40}
                  height={40}
                  className="rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-semibold"
                  style={{ backgroundColor: accentColor }}
                >
                  {company.name.charAt(0)}
                </div>
              )}
              <span className="font-semibold text-sm text-neutral-900 dark:text-white truncate">
                {company.name}
              </span>
            </Link>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/marketplace"
              className="text-sm text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
            >
              Marketplace
            </Link>
            <div className="w-px h-4 bg-neutral-200 dark:bg-white/15" />
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm transition-colors relative pb-0.5 ${
                  isActive(item.href, item.exact)
                    ? 'text-neutral-900 dark:text-white font-medium'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {item.label}
                {isActive(item.href, item.exact) && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ backgroundColor: accentColor }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Right: CTA */}
          <div className="hidden md:block">
            <a
              href={`https://t.me/i_want_procedure_bot?start=${company.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-5 py-2 text-white text-sm font-medium rounded-full transition-opacity hover:opacity-90"
              style={{ backgroundColor: accentColor }}
            >
              Записатися
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-neutral-900 dark:text-white"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-neutral-100 dark:border-white/10 bg-white dark:bg-[#0f0f17] px-4 py-6">
          <Link
            href="/marketplace"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 text-sm text-neutral-400 mb-4"
          >
            ← Marketplace
          </Link>
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`block py-3 text-sm border-b border-neutral-100 dark:border-white/10 ${
                  isActive(item.href, item.exact)
                    ? 'text-neutral-900 dark:text-white font-medium'
                    : 'text-neutral-500 dark:text-neutral-400'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <a
            href={`https://t.me/i_want_procedure_bot?start=${company.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full mt-6 px-5 py-3 text-white text-sm font-medium rounded-full"
            style={{ backgroundColor: accentColor }}
          >
            Записатися
          </a>
        </div>
      )}
    </header>
  )
}
