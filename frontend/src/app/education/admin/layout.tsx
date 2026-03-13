'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap, BookOpen, Calendar, Share2, UserCircle, Users, LogOut, Menu, ArrowLeft } from 'lucide-react'
import { ThemeSettings } from '@/components/theme-settings'
import { companyApi, authApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const NAV = [
  { label: 'Дашборд', href: '/education/admin', icon: GraduationCap, exact: true },
  { label: 'Матеріали', href: '/education/admin/offerings', icon: BookOpen },
  { label: 'Події', href: '/education/admin/events', icon: Calendar },
  { label: 'Мій профіль', href: '/education/admin/profile', icon: UserCircle },
  { label: 'Команда', href: '/education/admin/team', icon: Users },
  { label: 'Реферали', href: '/education/admin/referrals', icon: Share2 },
]

export default function EducationAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showBecomeModal, setShowBecomeModal] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.replace('/auth/login')
      return
    }

    // Auto-select the educator company
    const prevCompanyId = localStorage.getItem('selected_company_id')
    Promise.all([
      companyApi.getMyMemberships(),
      authApi.getMe(),
    ]).then(([memberships, me]) => {
      const educator = memberships.find((m: any) => m.type === 'educator')
      if (!educator) {
        // No educator company — show modal to create one
        const fullName = [me.first_name, me.last_name].filter(Boolean).join(' ')
        setCompanyName(fullName)
        setShowBecomeModal(true)
        setReady(true)
        return
      }
      localStorage.setItem('selected_company_id', String(educator.id))
      setReady(true)
    }).catch(() => {
      setReady(true)
    })

    return () => {
      // Restore previous company on unmount
      if (prevCompanyId) {
        localStorage.setItem('selected_company_id', prevCompanyId)
      } else {
        localStorage.removeItem('selected_company_id')
      }
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('company_type')
    localStorage.removeItem('last_cabinet')
    document.cookie = 'token=; path=/; max-age=0'
    router.push('/')
  }

  const handleCreateEducator = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')
    setCreating(true)
    try {
      const company = await companyApi.createCompany({ name: companyName, type: 'educator' })
      localStorage.setItem('selected_company_id', String(company.id))
      localStorage.setItem('company_type', 'educator')
      setShowBecomeModal(false)
    } catch (err: any) {
      setCreateError(err.response?.data?.detail || 'Помилка створення')
    } finally {
      setCreating(false)
    }
  }

  const isActive = (item: { href: string; exact?: boolean }) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
    </div>
  )

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b">
        <Link href="/education/admin" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-violet-500 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-sm">Кабінет спікера</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map((item) => {
          const Icon = item.icon
          const active = isActive(item)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom actions */}
      <div className="p-3 border-t space-y-0.5">
        <div className="px-1 py-1">
          <ThemeSettings />
        </div>
        <Link
          href="/education"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          На сайт
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Вийти
        </button>
      </div>
    </div>
  )

  if (showBecomeModal) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800 p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <h2 className="font-semibold text-base">Хочете стати спікером?</h2>
            <p className="text-xs text-muted-foreground">Створіть профіль спікера</p>
          </div>
        </div>

        <form onSubmit={handleCreateEducator} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="speaker-name">Ваше ім'я або назва школи</Label>
            <Input
              id="speaker-name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Наприклад: Олена Коваль Academy"
              required
              className="dark:bg-gray-800 dark:border-gray-700"
            />
          </div>

          {createError && (
            <p className="text-sm text-red-500">{createError}</p>
          )}

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => router.push('/admin')}>
              Скасувати
            </Button>
            <Button type="submit" className="flex-1 bg-violet-500 hover:bg-violet-600" disabled={creating}>
              {creating ? 'Створення...' : 'Створити'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 flex-col border-r bg-background flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-56 bg-background border-r z-50">
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b bg-background">
          <button onClick={() => setMobileOpen(true)} className="p-1">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-sm">Кабінет спікера</span>
          <ThemeSettings />
        </div>

        {/* Page */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
