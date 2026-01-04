'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from './ThemeProvider'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-secondary hover:bg-pink-100 dark:hover:bg-pink-900/30 transition-colors"
      aria-label={theme === 'light' ? 'Увімкнути темну тему' : 'Увімкнути світлу тему'}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-muted-foreground" />
      ) : (
        <Sun className="w-5 h-5 text-yellow-400" />
      )}
    </button>
  )
}
