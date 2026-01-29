import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'Procedure Booking',
  description: 'Система записи на процедуры',
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.svg',
  },
}

const themeScript = `
  (function() {
    const accent = localStorage.getItem('accent-color') || 'blue';
    const bg = localStorage.getItem('bg-color');
    const theme = localStorage.getItem('theme');
    const isDark = theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const defaultBg = isDark ? 'blue' : 'white';
    document.documentElement.setAttribute('data-accent', accent);
    document.documentElement.setAttribute('data-bg', bg || defaultBg);
  })();
`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
