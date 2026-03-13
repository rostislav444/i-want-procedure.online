'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

interface Props {
  companyName: string
  base: string
}

const LABELS: Record<string, string> = {
  services: 'Послуги',
  team: 'Команда',
  contacts: 'Контакти',
}

export function Breadcrumbs({ companyName, base }: Props) {
  const pathname = usePathname()

  // Don't show on company homepage
  if (pathname === base) return null

  // Build segments after the base
  const afterBase = pathname.slice(base.length).replace(/^\//, '')
  const segments = afterBase ? afterBase.split('/') : []

  if (segments.length === 0) return null

  const crumbs: { label: string; href: string }[] = [
    { label: 'Marketplace', href: '/marketplace' },
    { label: companyName, href: base },
  ]

  let accPath = base
  for (const seg of segments) {
    accPath = `${accPath}/${seg}`
    const label = LABELS[seg] ?? (seg.match(/^\d+$/) ? null : seg)
    if (label) crumbs.push({ label, href: accPath })
  }

  // Last item is current — not a link
  return (
    <nav className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1
        return (
          <span key={crumb.href} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="w-3 h-3 flex-shrink-0" />}
            {isLast ? (
              <span className="text-neutral-600 dark:text-neutral-400 font-medium">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors">
                {crumb.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
