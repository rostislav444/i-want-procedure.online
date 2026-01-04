import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'Procedure — CRM для косметологів з Telegram-ботами',
  description: 'Автоматизація запису на косметологічні процедури. CRM-система з Telegram-ботами для клієнтів та косметологів. Онлайн-запис 24/7, управління розкладом, база клієнтів.',
  keywords: ['косметологія', 'CRM', 'telegram бот', 'запис на процедури', 'автоматизація', 'салон краси'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="uk">
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  )
}
