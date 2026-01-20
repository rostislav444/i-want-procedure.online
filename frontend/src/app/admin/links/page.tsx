'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { companyApi, servicesApi, specialistsApi, Service, SpecialistListItem, Company } from '@/lib/api'
import { useCompany } from '@/contexts/CompanyContext'
import {
  Copy,
  Check,
  Link2,
  Users,
  UserPlus,
  Calendar,
  ExternalLink,
  Info,
  Scissors,
} from 'lucide-react'

export default function LinksPage() {
  const { companyType, selectedCompanyId } = useCompany()
  const [company, setCompany] = useState<Company | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [specialists, setSpecialists] = useState<SpecialistListItem[]>([])
  const [loading, setLoading] = useState(true)

  // Link generation state
  const [selectedService, setSelectedService] = useState<string>('')
  const [selectedSpecialist, setSelectedSpecialist] = useState<string>('')
  const [copiedLink, setCopiedLink] = useState<string | null>(null)

  const clientBotName = process.env.NEXT_PUBLIC_CLIENT_BOT_NAME || 'i_want_procedure_bot'
  const doctorBotName = process.env.NEXT_PUBLIC_DOCTOR_BOT_NAME || 'doctor_i_want_procedure_bot'

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [companyData, servicesData] = await Promise.all([
        companyApi.getMyCompany(),
        servicesApi.getAll(),
      ])
      setCompany(companyData)
      setServices(servicesData.filter(s => s.is_active))

      if (companyData.type === 'clinic' && selectedCompanyId) {
        const specialistsData = await specialistsApi.getAll(selectedCompanyId, false)
        setSpecialists(specialistsData)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, linkId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedLink(linkId)
    setTimeout(() => setCopiedLink(null), 2000)
  }

  // Generate links
  const clientInviteLink = company ? `https://t.me/${clientBotName}?start=${company.invite_code}` : ''
  const teamInviteLink = company ? `https://t.me/${doctorBotName}?start=team_${company.team_invite_code}` : ''

  const getServiceLink = () => {
    if (!company || !selectedService) return ''
    const base = `https://t.me/${clientBotName}?start=book_${company.invite_code}_s${selectedService}`
    if (selectedSpecialist && selectedSpecialist !== 'any') {
      return `${base}_sp${selectedSpecialist}`
    }
    return base
  }

  const serviceLink = getServiceLink()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Посилання</h1>
        <p className="text-muted-foreground">
          Генерація та документація посилань для клієнтів та команди
        </p>
      </div>

      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList>
          <TabsTrigger value="generate">Генерація посилань</TabsTrigger>
          <TabsTrigger value="docs">Документація</TabsTrigger>
        </TabsList>

        {/* Generate Tab */}
        <TabsContent value="generate" className="space-y-4">
          {/* Basic Client Link */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Запрошення клієнтів</CardTitle>
              </div>
              <CardDescription>
                Базове посилання для реєстрації нових клієнтів
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-muted px-3 py-2 rounded text-sm truncate">
                  {clientInviteLink}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(clientInviteLink, 'client')}
                >
                  {copiedLink === 'client' ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  asChild
                >
                  <a href={clientInviteLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Team Invite Link (Clinic Only) */}
          {companyType === 'clinic' && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-lg">Запрошення в команду</CardTitle>
                  <Badge variant="secondary">Тільки для клінік</Badge>
                </div>
                <CardDescription>
                  Посилання для запрошення спеціалістів до вашої команди
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted px-3 py-2 rounded text-sm truncate">
                    {teamInviteLink}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(teamInviteLink, 'team')}
                  >
                    {copiedLink === 'team' ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    asChild
                  >
                    <a href={teamInviteLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Service Booking Link */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-500" />
                <CardTitle className="text-lg">Запис на послугу</CardTitle>
              </div>
              <CardDescription>
                Створіть посилання для прямого запису на конкретну послугу
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Послуга</label>
                  <Select value={selectedService} onValueChange={setSelectedService}>
                    <SelectTrigger>
                      <SelectValue placeholder="Оберіть послугу" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={String(service.id)}>
                          <div className="flex items-center gap-2">
                            <Scissors className="h-4 w-4" />
                            <span>{service.name}</span>
                            <span className="text-muted-foreground">
                              ({service.price} грн)
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {companyType === 'clinic' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Спеціаліст <span className="text-muted-foreground">(опціонально)</span>
                    </label>
                    <Select value={selectedSpecialist} onValueChange={setSelectedSpecialist}>
                      <SelectTrigger>
                        <SelectValue placeholder="Будь-який вільний" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Будь-який вільний</SelectItem>
                        {specialists.map((specialist) => (
                          <SelectItem key={specialist.id} value={String(specialist.id)}>
                            {specialist.first_name} {specialist.last_name}
                            {specialist.position && (
                              <span className="text-muted-foreground ml-1">
                                — {specialist.position}
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {selectedService && (
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted px-3 py-2 rounded text-sm truncate">
                    {serviceLink}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(serviceLink, 'service')}
                  >
                    {copiedLink === 'service' ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    asChild
                  >
                    <a href={serviceLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documentation Tab */}
        <TabsContent value="docs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                <CardTitle>Формати посилань</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Client Invite */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Запрошення клієнтів
                </h3>
                <p className="text-sm text-muted-foreground">
                  Базове посилання для реєстрації нових клієнтів у вашій компанії.
                </p>
                <code className="block bg-muted px-3 py-2 rounded text-sm">
                  https://t.me/{clientBotName}?start={'{invite_code}'}
                </code>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• <code className="bg-muted px-1 rounded">{'{invite_code}'}</code> — унікальний код вашої компанії</li>
                  <li>• Клієнт зареєструється та буде прив&apos;язаний до вашої компанії</li>
                </ul>
              </div>

              {/* Team Invite */}
              <div className="space-y-2 border-t pt-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Запрошення в команду
                  <Badge variant="secondary" className="text-xs">Клініки</Badge>
                </h3>
                <p className="text-sm text-muted-foreground">
                  Посилання для запрошення спеціалістів приєднатися до вашої клініки.
                </p>
                <code className="block bg-muted px-3 py-2 rounded text-sm">
                  https://t.me/{doctorBotName}?start=team_{'{team_invite_code}'}
                </code>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• <code className="bg-muted px-1 rounded">{'{team_invite_code}'}</code> — код для запрошення в команду</li>
                  <li>• Спеціаліст може прив&apos;язати існуючий акаунт або зареєструватися</li>
                  <li>• Автоматично створюється профіль спеціаліста в клініці</li>
                </ul>
              </div>

              {/* Service Booking */}
              <div className="space-y-2 border-t pt-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Запис на послугу
                </h3>
                <p className="text-sm text-muted-foreground">
                  Пряме посилання для запису на конкретну послугу.
                </p>
                <code className="block bg-muted px-3 py-2 rounded text-sm">
                  https://t.me/{clientBotName}?start=book_{'{invite_code}'}_s{'{service_id}'}
                </code>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• <code className="bg-muted px-1 rounded">{'{service_id}'}</code> — ID послуги</li>
                  <li>• Клієнт одразу бачить деталі послуги та переходить до вибору дати</li>
                </ul>
              </div>

              {/* Service + Specialist Booking */}
              <div className="space-y-2 border-t pt-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Запис на послугу до спеціаліста
                  <Badge variant="secondary" className="text-xs">Клініки</Badge>
                </h3>
                <p className="text-sm text-muted-foreground">
                  Посилання для запису на послугу до конкретного спеціаліста.
                </p>
                <code className="block bg-muted px-3 py-2 rounded text-sm">
                  https://t.me/{clientBotName}?start=book_{'{invite_code}'}_s{'{service_id}'}_sp{'{specialist_id}'}
                </code>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• <code className="bg-muted px-1 rounded">{'{specialist_id}'}</code> — ID профілю спеціаліста</li>
                  <li>• Перевіряється, чи спеціаліст виконує цю послугу</li>
                  <li>• Клієнт бачить ім&apos;я спеціаліста та переходить до вибору дати</li>
                </ul>
              </div>

              {/* Tips */}
              <div className="space-y-2 border-t pt-4">
                <h3 className="font-semibold">Де використовувати посилання</h3>
                <ul className="text-sm text-muted-foreground space-y-2 ml-4">
                  <li>• <strong>Візитівки</strong> — QR-код з посиланням для запису</li>
                  <li>• <strong>Соцмережі</strong> — в описі профілю або постах</li>
                  <li>• <strong>Сайт</strong> — кнопки &quot;Записатися&quot; з прямим посиланням на послугу</li>
                  <li>• <strong>Реклама</strong> — посилання на конкретні акційні послуги</li>
                  <li>• <strong>SMS/Viber</strong> — нагадування з посиланням для повторного запису</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
