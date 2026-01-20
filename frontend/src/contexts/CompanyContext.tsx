'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { authApi, companyApi, Company, specialistsApi, SpecialistProfile } from '@/lib/api'

// User types
export interface User {
  id: number
  email: string | null
  first_name: string
  last_name: string
  patronymic: string | null
  phone: string | null
  city: string | null
  telegram_id: number | null
  telegram_username: string | null
  is_active: boolean
  is_superadmin: boolean
  created_at: string
}

// User role within company context
export type CompanyRole = 'owner' | 'manager' | 'specialist'

// Company context type
interface CompanyContextType {
  // Data
  user: User | null
  company: Company | null
  specialistProfile: SpecialistProfile | null

  // Derived state
  companyType: 'solo' | 'clinic' | null
  userRole: CompanyRole | null
  isLoading: boolean

  // Permissions
  canEditServices: boolean
  canManageTeam: boolean
  canViewAllAppointments: boolean
  canViewFinances: boolean

  // Methods
  refreshUser: () => Promise<void>
  refreshCompany: () => Promise<void>
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

export function CompanyProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [specialistProfile, setSpecialistProfile] = useState<SpecialistProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Derived state
  const companyType = company?.type || null

  // Determine user role within company
  // For now, if user has a company, they are the owner (created via registration)
  // TODO: Extend API to return membership info for proper role handling
  const getUserRole = (): CompanyRole | null => {
    if (!user || !company) return null

    // If superadmin, treat as owner
    if (user.is_superadmin) return 'owner'

    // For now, if user has access to this company, they're the owner
    // This is because we create users as owners during registration
    return 'owner'
  }

  const userRole = getUserRole()

  // Permissions
  const canEditServices = userRole === 'owner' || userRole === 'manager'
  const canManageTeam = (userRole === 'owner' || userRole === 'manager') && companyType === 'clinic'
  const canViewAllAppointments = userRole === 'owner' || userRole === 'manager'
  const canViewFinances = userRole === 'owner'

  // Load user and company data
  const loadData = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }

    try {
      setIsLoading(true)
      const [userData, companyData] = await Promise.all([
        authApi.getMe(),
        companyApi.getMyCompany().catch(() => null),
      ])

      setUser(userData)
      setCompany(companyData)

      // Load specialist profile for all users with a company
      // (all company owners are also specialists in the new model)
      if (companyData) {
        try {
          const profile = await specialistsApi.getMe()
          setSpecialistProfile(profile)
        } catch {
          // User might not have a specialist profile yet
          setSpecialistProfile(null)
        }
      }
    } catch (error) {
      console.error('Failed to load user data:', error)
      localStorage.removeItem('token')
      router.push('/auth/login')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const refreshUser = async () => {
    try {
      const userData = await authApi.getMe()
      setUser(userData)
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }
  }

  const refreshCompany = async () => {
    try {
      const companyData = await companyApi.getMyCompany()
      setCompany(companyData)
    } catch (error) {
      console.error('Failed to refresh company:', error)
    }
  }

  return (
    <CompanyContext.Provider
      value={{
        user,
        company,
        specialistProfile,
        companyType,
        userRole,
        isLoading,
        canEditServices,
        canManageTeam,
        canViewAllAppointments,
        canViewFinances,
        refreshUser,
        refreshCompany,
      }}
    >
      {children}
    </CompanyContext.Provider>
  )
}

export function useCompany() {
  const context = useContext(CompanyContext)
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider')
  }
  return context
}
