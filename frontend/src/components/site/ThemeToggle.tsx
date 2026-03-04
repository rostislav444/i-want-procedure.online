'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = resolvedTheme === 'dark'

  const handleToggle = () => {
    const newTheme = isDark ? 'light' : 'dark'
    setTheme(newTheme)
    // Update data-bg to match theme default
    const currentBg = localStorage.getItem('bg-color')
    if (!currentBg) {
      document.documentElement.setAttribute('data-bg', newTheme === 'dark' ? 'blue' : 'white')
    }
  }

  if (!mounted) {
    return (
      <button className="p-2 rounded-full bg-muted/50">
        <Sun className="h-5 w-5" />
      </button>
    )
  }

  return (
    <button
      onClick={handleToggle}
      className="p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  )
}
