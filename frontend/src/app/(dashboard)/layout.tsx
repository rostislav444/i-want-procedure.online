'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Clock, Users, Settings, LogOut, Menu, X, LinkIcon, Copy, Check, Home, Scissors, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { authApi, companyApi } from '@/lib/api'

const navigation = [
  { name: 'Головна', href: '/', icon: Home },
  { name: 'Записи', href: '/appointments', icon: Calendar },
  { name: 'Послуги', href: '/services', icon: Scissors },
  { name: 'Розклад', href: '/schedule', icon: Clock },
  { name: 'Клієнти', href: '/clients', icon: Users },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [company, setCompany] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [copied, setCopied] = useState(false)

  // Load sidebar state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed')
    if (saved !== null) {
      setSidebarCollapsed(saved === 'true')
    }
  }, [])

  const toggleSidebarCollapsed = () => {
    const newState = !sidebarCollapsed
    setSidebarCollapsed(newState)
    localStorage.setItem('sidebarCollapsed', String(newState))
  }

  const botUsername = process.env.NEXT_PUBLIC_CLIENT_BOT_NAME || 'YOUR_BOT'
  const inviteLink = company ? `https://t.me/${botUsername}?start=${company.invite_code}` : ''

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    Promise.all([authApi.getMe(), companyApi.getMyCompany()])
      .then(([userData, companyData]) => {
        setUser(userData)
        setCompany(companyData)
      })
      .catch(() => {
        localStorage.removeItem('token')
        router.push('/login')
      })
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/login')
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4 border-b">
            <span className="text-xl font-semibold">Procedure</span>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>
          {/* Mobile Invite Link */}
          {company && (
            <div className="border-t p-4">
              <div className="mb-2 flex items-center text-sm font-medium text-gray-700">
                <LinkIcon className="mr-2 h-4 w-4" />
                Посилання для клієнтів
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteLink}
                  className="flex-1 text-xs bg-gray-50 border rounded px-2 py-1.5 truncate"
                />
                <Button variant="outline" size="icon" onClick={copyLink} className="shrink-0">
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'}`}>
        <div className="flex flex-col flex-1 bg-white border-r">
          <div className={`flex h-16 items-center border-b ${sidebarCollapsed ? 'justify-center px-2' : 'px-4 justify-between'}`}>
            {sidebarCollapsed ? (
              <button
                onClick={toggleSidebarCollapsed}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                title="Розгорнути"
              >
                <ChevronRight className="h-5 w-5 text-gray-500" />
              </button>
            ) : (
              <>
                <span className="text-xl font-semibold">Procedure</span>
                <button
                  onClick={toggleSidebarCollapsed}
                  className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                  title="Згорнути"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-500" />
                </button>
              </>
            )}
          </div>
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center py-2 text-sm font-medium rounded-md transition-all ${
                  sidebarCollapsed ? 'justify-center px-2' : 'px-4'
                } ${
                  pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <item.icon className={`h-5 w-5 ${sidebarCollapsed ? '' : 'mr-3'}`} />
                {!sidebarCollapsed && item.name}
              </Link>
            ))}
          </nav>

          {/* Invite Link Section */}
          {company && !sidebarCollapsed && (
            <div className="border-t p-4">
              <div className="mb-2 flex items-center text-sm font-medium text-gray-700">
                <LinkIcon className="mr-2 h-4 w-4" />
                Посилання для клієнтів
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteLink}
                  className="flex-1 text-xs bg-gray-50 border rounded px-2 py-1.5 truncate"
                />
                <Button variant="outline" size="icon" onClick={copyLink} className="shrink-0">
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Поділіться цим посиланням з клієнтами
              </p>
            </div>
          )}

          {/* Collapsed: just copy button */}
          {company && sidebarCollapsed && (
            <div className="border-t p-2 flex justify-center">
              <Button variant="ghost" size="icon" onClick={copyLink} title="Копіювати посилання">
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <LinkIcon className="h-4 w-4" />}
              </Button>
            </div>
          )}

          <div className={`border-t ${sidebarCollapsed ? 'p-2' : 'p-4'}`}>
            {sidebarCollapsed ? (
              <div className="flex flex-col items-center gap-2">
                <Link href="/profile" title={`${user.first_name} ${user.last_name}`}>
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
                    {user.first_name?.[0]}{user.last_name?.[0]}
                  </div>
                </Link>
                <Button variant="ghost" size="icon" onClick={handleLogout} title="Вийти">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center">
                <Link href="/profile" className="flex-1 hover:bg-gray-50 -m-2 p-2 rounded-md">
                  <p className="text-sm font-medium">{user.first_name} {user.last_name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </Link>
                <Button variant="ghost" size="icon" onClick={handleLogout}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
        <div className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-white px-4 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="text-lg font-semibold">Procedure</span>
        </div>
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
