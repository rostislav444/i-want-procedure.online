'use client'

import { Building2, User, Crown, Briefcase, Wrench } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useCompany } from '@/contexts/CompanyContext'

export function CompanySelector() {
  const { memberships, selectCompany, user } = useCompany()

  const getRoleLabel = (membership: typeof memberships[0]) => {
    if (membership.is_owner) return 'Власник'
    if (membership.is_manager) return 'Менеджер'
    if (membership.is_specialist) return 'Спеціаліст'
    return 'Учасник'
  }

  const getRoleIcon = (membership: typeof memberships[0]) => {
    if (membership.is_owner) return Crown
    if (membership.is_manager) return Briefcase
    if (membership.is_specialist) return Wrench
    return User
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">
            Вітаємо, {user?.first_name}!
          </h1>
          <p className="text-muted-foreground">
            Оберіть компанію, в яку хочете увійти
          </p>
        </div>

        <div className="space-y-3">
          {memberships.map((membership) => {
            const RoleIcon = getRoleIcon(membership)
            return (
              <Card
                key={membership.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => selectCompany(membership.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      {membership.logo_url ? (
                        <img
                          src={membership.logo_url}
                          alt={membership.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Building2 className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{membership.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <RoleIcon className="w-4 h-4" />
                        <span>{getRoleLabel(membership)}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                          {membership.type === 'clinic' ? 'Клініка' : 'ФОП'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
