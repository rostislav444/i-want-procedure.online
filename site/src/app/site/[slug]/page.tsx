import { notFound } from 'next/navigation'
import { publicApi, Service, ServiceCategory, WebsiteSection } from '@/lib/api'
import type { Metadata } from 'next'
import { SoloTemplate, ClinicTemplate } from '@/components/templates'
import { SectionRenderer } from '@/components/SectionRenderer'
import CompanyHeader from '@/components/CompanyHeader'
import CompanyFooter from '@/components/CompanyFooter'
import { generateCssVariables, defaultColors } from '@/lib/colors'
import { getTheme, getThemeShapeVars } from '@/lib/themes'

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

  // Generate CSS variables from company colors
  const colorVars = generateCssVariables({
    primary: company.primary_color || company.accent_color || defaultColors.primary,
    secondary: company.secondary_color || defaultColors.secondary,
    background: company.background_color || defaultColors.background,
    accentFont: company.accent_font || defaultColors.accentFont,
    bodyFont: company.body_font || defaultColors.bodyFont,
  })

  // Get theme shape variables
  const theme = getTheme(company.industry_theme)
  const shapeVars = getThemeShapeVars(theme)

  // Combined CSS variables
  const cssVariables = `${colorVars}\n${shapeVars}`

  // Check if we should use the new section-based rendering
  const useSectionRenderer = sections.length > 0

  if (useSectionRenderer) {
    // New section-based rendering
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: cssVariables }} />
        <main
          className="min-h-screen"
          style={{
            backgroundColor: 'var(--color-background)',
            fontFamily: 'var(--font-body)',
          }}
        >
          <CompanyHeader />
          <SectionRenderer
            sections={sections}
            company={company}
            services={services}
            categories={categories}
          />
          <CompanyFooter companyName={company.name} />
        </main>
      </>
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

  // Wrapper with CSS variables for legacy templates
  const TemplateWrapper = ({ children }: { children: React.ReactNode }) => (
    <>
      <style dangerouslySetInnerHTML={{ __html: cssVariables }} />
      <div style={{ fontFamily: 'var(--font-body)' }}>{children}</div>
    </>
  )

  switch (templateType) {
    case 'clinic':
      return (
        <TemplateWrapper>
          <ClinicTemplate {...templateProps} />
        </TemplateWrapper>
      )
    case 'premium':
      return (
        <TemplateWrapper>
          <ClinicTemplate {...templateProps} />
        </TemplateWrapper>
      )
    case 'solo':
    default:
      return (
        <TemplateWrapper>
          <SoloTemplate {...templateProps} />
        </TemplateWrapper>
      )
  }
}
