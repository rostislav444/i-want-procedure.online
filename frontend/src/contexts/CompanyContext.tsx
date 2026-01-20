'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { authApi, companyApi, Company, CompanyMembership, specialistsApi, SpecialistProfile } from '@/lib/api'

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
  memberships: CompanyMembership[]
  selectedCompanyId: number | null

  // Derived state
  companyType: 'solo' | 'clinic' | null
  userRole: CompanyRole | null
  isLoading: boolean
  needsCompanySelection: boolean

  // Permissions
  canEditServices: boolean
  canManageTeam: boolean
  canViewAllAppointments: boolean
  canViewFinances: boolean

  // Methods
  refreshUser: () => Promise<void>
  refreshCompany: () => Promise<void>
  selectCompany: (companyId: number) => void
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

const SELECTED_COMPANY_KEY = 'selected_company_id'

export function CompanyProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [specialistProfile, setSpecialistProfile] = useState<SpecialistProfile | null>(null)
  const [memberships, setMemberships] = useState<CompanyMembership[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check if user needs to select a company
  const needsCompanySelection = memberships.length > 1 && !selectedCompanyId

  // Derived state
  const companyType = company?.type || null

  // Get user's role from membership
  const getUserRole = (): CompanyRole | null => {
    if (!user || !selectedCompanyId) return null

    // If superadmin, treat as owner
    if (user.is_superadmin) return 'owner'

    // Find membership for selected company
    const membership = memberships.find(m => m.id === selectedCompanyId)
    if (!membership) return null

    if (membership.is_owner) return 'owner'
    if (membership.is_manager) return 'manager'
    if (membership.is_specialist) return 'specialist'

    return null
  }

  const userRole = getUserRole()

  // Permissions
  const canEditServices = userRole === 'owner' || userRole === 'manager'
  const canManageTeam = (userRole === 'owner' || userRole === 'manager') && companyType === 'clinic'
  const canViewAllAppointments = userRole === 'owner' || userRole === 'manager'
  const canViewFinances = userRole === 'owner'

  // Load company-specific data
  const loadCompanyData = async (companyId: number) => {
    try {
      const companyData = await companyApi.getMyCompany()
      setCompany(companyData)

      // Load specialist profile
      try {
        const profile = await specialistsApi.getMe()
        setSpecialistProfile(profile)
      } catch {
        setSpecialistProfile(null)
      }
    } catch (error) {
      console.error('Failed to load company data:', error)
      setCompany(null)
      setSpecialistProfile(null)
    }
  }

  // Load user and memberships data
  const loadData = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }

    try {
      setIsLoading(true)

      // Load user and memberships
      const [userData, membershipsData] = await Promise.all([
        authApi.getMe(),
        companyApi.getMyMemberships(),
      ])

      setUser(userData)
      setMemberships(membershipsData)

      // Determine which company to use
      let companyIdToUse: number | null = null

      // Check if there's a saved selection
      const savedCompanyId = localStorage.getItem(SELECTED_COMPANY_KEY)
      if (savedCompanyId) {
        const savedId = parseInt(savedCompanyId, 10)
        // Verify user still has access to this company
        if (membershipsData.some(m => m.id === savedId)) {
          companyIdToUse = savedId
        }
      }

      // If no saved selection or invalid, auto-select if only one company
      if (!companyIdToUse && membershipsData.length === 1) {
        companyIdToUse = membershipsData[0].id
        localStorage.setItem(SELECTED_COMPANY_KEY, companyIdToUse.toString())
      }

      setSelectedCompanyId(companyIdToUse)

      // If we have a company selected, load its data
      if (companyIdToUse) {
        await loadCompanyData(companyIdToUse)
      }
    } catch (error) {
      console.error('Failed to load user data:', error)
      localStorage.removeItem('token')
      router.push('/auth/login')
    } finally {
      setIsLoading(false)
    }
  }

  // Select a company
  const selectCompany = (companyId: number) => {
    // Verify user has access
    if (!memberships.some(m => m.id === companyId)) {
      console.error('User does not have access to this company')
      return
    }

    localStorage.setItem(SELECTED_COMPANY_KEY, companyId.toString())
    setSelectedCompanyId(companyId)
    loadCompanyData(companyId)
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
    if (selectedCompanyId) {
      await loadCompanyData(selectedCompanyId)
    }
  }

  return (
    <CompanyContext.Provider
      value={{
        user,
        company,
        specialistProfile,
        memberships,
        selectedCompanyId,
        companyType,
        userRole,
        isLoading,
        needsCompanySelection,
        canEditServices,
        canManageTeam,
        canViewAllAppointments,
        canViewFinances,
        refreshUser,
        refreshCompany,
        selectCompany,
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
