'use client'

import { useEffect, useState } from 'react'
import { Users, Copy, Check, Crown, UserCog, Eye, Trash2 } from 'lucide-react'
import { companyApi, type Company } from '@/lib/api'

const ROLE_LABELS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  owner: { label: 'Власник', icon: Crown, color: 'text-amber-500' },
  manager: { label: 'Менеджер', icon: UserCog, color: 'text-violet-500' },
  viewer: { label: 'Спостерігач', icon: Eye, color: 'text-gray-500' },
}

interface Member {
  id: number
  user_id: number
  user_name: string
  user_email?: string | null
  role: string
  created_at: string
}

export default function EducatorTeamPage() {
  const [company, setCompany] = useState<Company | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedInvite, setCopiedInvite] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const comp = await companyApi.getMyCompany()
        setCompany(comp)
        // Members endpoint reuses the same company members API
        const { api } = await import('@/lib/api')
        const res = await api.get('/companies/members')
        setMembers(res.data || [])
      } catch {
        // no members yet
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleCopyInvite = async () => {
    if (!company?.team_invite_code) return
    const link = `${window.location.origin}/auth/register?invite=${company.team_invite_code}`
    await navigator.clipboard.writeText(link)
    setCopiedInvite(true)
    setTimeout(() => setCopiedInvite(false), 2000)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
    </div>
  )

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Команда</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Запросіть менеджерів для керування матеріалами та подіями</p>
      </div>

      {/* Invite link */}
      <div className="rounded-xl border p-5 space-y-3">
        <h2 className="font-medium text-sm">Запросити учасника</h2>
        <p className="text-xs text-muted-foreground">
          Поділіться посиланням — після реєстрації вони автоматично приєднаються до вашої команди.
        </p>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={company?.team_invite_code
              ? `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/register?invite=${company.team_invite_code}`
              : '—'}
            className="flex-1 px-3 py-2 rounded-lg border bg-muted text-sm text-muted-foreground truncate"
          />
          <button
            onClick={handleCopyInvite}
            disabled={!company?.team_invite_code}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm hover:bg-muted transition-colors disabled:opacity-40"
          >
            {copiedInvite ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copiedInvite ? 'Скопійовано' : 'Копіювати'}
          </button>
        </div>
      </div>

      {/* Members list */}
      <div className="rounded-xl border divide-y">
        {members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <p className="font-medium text-sm">Команда поки порожня</p>
              <p className="text-xs text-muted-foreground mt-1">Запросіть першого учасника за посиланням вище</p>
            </div>
          </div>
        ) : (
          members.map((member) => {
            const role = ROLE_LABELS[member.role] || ROLE_LABELS.viewer
            const Icon = role.icon
            return (
              <div key={member.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-violet-600">
                    {member.user_name?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{member.user_name}</div>
                  {member.user_email && (
                    <div className="text-xs text-muted-foreground truncate">{member.user_email}</div>
                  )}
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-medium ${role.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                  {role.label}
                </div>
              </div>
            )
          })
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Управління ролями учасників доступне в розширеній версії. Наразі всі запрошені отримують роль Менеджера.
      </p>
    </div>
  )
}
