import { notFound } from 'next/navigation'
import { publicApi, Service, ServiceCategory } from '@/lib/api'
import type { Metadata } from 'next'
import { SoloTemplate, ClinicTemplate } from '@/components/templates'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const company = await publicApi.getCompany(slug)
    const specialization = company.specialization || 'Косметологічні послуги'
    return {
      title: `${company.name} — ${specialization}`,
      description: company.description || `${specialization} від ${company.name}. Перегляньте каталог послуг та ціни.`,
    }
  } catch {
    return {
      title: 'Компанія не знайдена',
    }
  }
}

export default async function CompanyPage({ params }: Props) {
  const { slug } = await params

  let company
  let categories: ServiceCategory[] = []
  let services: Service[] = []

  try {
    ;[company, categories, services] = await Promise.all([
      publicApi.getCompany(slug),
      publicApi.getCategories(slug),
      publicApi.getServices(slug),
    ])
  } catch (error) {
    notFound()
  }

  // Group services by category - convert to serializable format
  const servicesByCategoryMap: Record<string, Service[]> = {}
  services.forEach((service) => {
    const catId = String(service.category_id ?? 'null')
    if (!servicesByCategoryMap[catId]) {
      servicesByCategoryMap[catId] = []
    }
    servicesByCategoryMap[catId].push(service)
  })

  // Common props for all templates
  const templateProps = {
    company,
    services,
    categories,
    servicesByCategoryMap,
  }

  // Select template based on company settings
  const templateType = company.template_type || 'solo'

  switch (templateType) {
    case 'clinic':
      return <ClinicTemplate {...templateProps} />
    case 'premium':
      // Premium template will use ClinicTemplate for now (can be extended later)
      return <ClinicTemplate {...templateProps} />
    case 'solo':
    default:
      return <SoloTemplate {...templateProps} />
  }
}
