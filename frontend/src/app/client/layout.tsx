import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Мої записи - Клієнтський портал',
  description: 'Перегляд записів та спеціалістів',
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white dark:from-gray-900 dark:to-gray-950">
      {children}
    </div>
  )
}
