'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Moon, Sun, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

const accentColors = [
  { name: 'Синій', value: 'blue', color: 'bg-sky-500' },
  { name: 'Фіолетовий', value: 'violet', color: 'bg-violet-500' },
  { name: 'Рожевий', value: 'pink', color: 'bg-pink-500' },
  { name: 'Коралловий', value: 'red', color: 'bg-rose-500' },
  { name: 'Бурштиновий', value: 'orange', color: 'bg-amber-500' },
  { name: 'Шавлієвий', value: 'green', color: 'bg-emerald-500' },
  { name: 'Бірюзовий', value: 'teal', color: 'bg-teal-500' },
]

const lightBackgrounds = [
  { name: 'Білий', value: 'white', color: 'bg-white border border-gray-200' },
  { name: 'Кремовий', value: 'cream', color: 'bg-amber-50' },
  { name: 'Сірий', value: 'gray', color: 'bg-slate-100' },
  { name: 'М\'ятний', value: 'mint', color: 'bg-emerald-50' },
]

const darkBackgrounds = [
  { name: 'Синій', value: 'blue', color: 'bg-slate-900' },
  { name: 'Графіт', value: 'graphite', color: 'bg-neutral-900' },
  { name: 'Деревний', value: 'wood', color: 'bg-stone-900' },
  { name: 'Нефрит', value: 'jade', color: 'bg-emerald-950' },
  { name: 'Чорний', value: 'black', color: 'bg-black' },
]

interface ThemeSettingsProps {
  collapsed?: boolean
}

export function ThemeSettings({ collapsed }: ThemeSettingsProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [accent, setAccent] = useState('blue')
  const [bgColor, setBgColor] = useState('white')

  useEffect(() => {
    setMounted(true)
    const savedAccent = localStorage.getItem('accent-color') || 'blue'
    setAccent(savedAccent)
    document.documentElement.setAttribute('data-accent', savedAccent)
  }, [])

  // Load background color when theme changes
  useEffect(() => {
    if (!mounted) return
    const isDark = theme === 'dark'
    const bgKey = isDark ? 'bg-color-dark' : 'bg-color-light'
    const defaultBg = isDark ? 'blue' : 'white'
    const savedBg = localStorage.getItem(bgKey) || defaultBg
    setBgColor(savedBg)
    document.documentElement.setAttribute('data-bg', savedBg)
  }, [theme, mounted])

  const handleAccentChange = (color: string) => {
    setAccent(color)
    localStorage.setItem('accent-color', color)
    document.documentElement.setAttribute('data-accent', color)
  }

  const handleBgChange = (color: string) => {
    setBgColor(color)
    const isDark = theme === 'dark'
    const bgKey = isDark ? 'bg-color-dark' : 'bg-color-light'
    localStorage.setItem(bgKey, color)
    document.documentElement.setAttribute('data-bg', color)
  }

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    // Background will be loaded by the useEffect that watches theme changes
  }

  if (!mounted) {
    return null
  }

  const isDark = theme === 'dark'
  const backgrounds = isDark ? darkBackgrounds : lightBackgrounds

  const colorPickerContent = (
    <div className="space-y-4">
      {/* Accent Color */}
      <div className="space-y-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Колір акценту</span>
        <div className="flex gap-2 flex-wrap">
          {accentColors.map((c) => (
            <button
              key={c.value}
              onClick={() => handleAccentChange(c.value)}
              className={`w-7 h-7 rounded-full ${c.color} transition-all hover:scale-110 ${
                accent === c.value ? 'ring-2 ring-offset-2 ring-offset-popover ring-foreground' : ''
              }`}
              title={c.name}
            />
          ))}
        </div>
      </div>

      {/* Background Color */}
      <div className="space-y-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Колір фону</span>
        <div className="flex gap-2 flex-wrap">
          {backgrounds.map((bg) => (
            <button
              key={bg.value}
              onClick={() => handleBgChange(bg.value)}
              className={`w-7 h-7 rounded-full ${bg.color} transition-all hover:scale-110 ${
                bgColor === bg.value ? 'ring-2 ring-offset-2 ring-offset-popover ring-foreground' : ''
              }`}
              title={bg.name}
            />
          ))}
        </div>
      </div>
    </div>
  )

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" title="Кольори">
              <Palette className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="right" align="start" className="w-56">
            {colorPickerContent}
          </PopoverContent>
        </Popover>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          title={isDark ? 'Світла тема' : 'Темна тема'}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" title="Кольори">
            <Palette className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent side="top" align="start" className="w-56">
          {colorPickerContent}
        </PopoverContent>
      </Popover>
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleTheme}
        className="flex-1 justify-start gap-2"
        title={isDark ? 'Світла тема' : 'Темна тема'}
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        <span>{isDark ? 'Світла' : 'Темна'}</span>
      </Button>
    </div>
  )
}
