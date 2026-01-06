import { notFound } from 'next/navigation'
import { publicApi, Service, ServiceCategory, WebsiteSection } from '@/lib/api'
import type { Metadata } from 'next'
import { SoloTemplate, ClinicTemplate } from '@/components/templates'
import { SectionRenderer } from '@/components/SectionRenderer'
import CompanyHeader from '@/components/CompanyHeader'
import CompanyFooter from '@/components/CompanyFooter'

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
  let sections: WebsiteSection[] = []

  try {
    // Fetch all data in parallel
    const [companyData, categoriesData, servicesData] = await Promise.all([
      publicApi.getCompany(slug),
      publicApi.getCategories(slug),
      publicApi.getServices(slug),
    ])
    company = companyData
    categories = categoriesData
    services = servicesData

    // Try to fetch sections (may not exist for older companies)
    try {
      sections = await publicApi.getWebsiteSections(slug)
    } catch {
      // Sections not available, will use legacy templates
      sections = []
    }
  } catch (error) {
    notFound()
  }

  // Check if we should use the new section-based rendering
  const useSectionRenderer = sections.length > 0

  if (useSectionRenderer) {
    // New section-based rendering
    return (
      <main className="min-h-screen bg-background">
        <CompanyHeader />
        <SectionRenderer
          sections={sections}
          company={company}
          services={services}
          categories={categories}
        />
        <CompanyFooter companyName={company.name} />
      </main>
    )
  }

  // Legacy template-based rendering
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
