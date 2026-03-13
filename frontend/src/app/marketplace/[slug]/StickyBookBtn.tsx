'use client'

import { useEffect, useState } from 'react'

interface Props {
  slug: string
  accentColor: string
}

export function StickyBookBtn({ slug, accentColor }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed bottom-6 left-4 right-4 z-40 md:hidden">
      <a
        href={`https://t.me/i_want_procedure_bot?start=${slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-full py-4 text-white text-sm font-semibold rounded-2xl shadow-lg"
        style={{ backgroundColor: accentColor }}
      >
        Записатися онлайн
      </a>
    </div>
  )
}
