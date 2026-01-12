import { notFound } from 'next/navigation'
import { publicApi, PublicService, PublicServiceCategory, PublicWebsiteSection } from '@/lib/public-api'
import type { Metadata } from 'next'
import { SectionRenderer } from '@/components/site/SectionRenderer'
import CompanyFooter from '@/components/site/CompanyFooter'
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

/**
 * Create default sections if company has none
 */
function createDefaultSections(): PublicWebsiteSection[] {
  const now = new Date().toISOString()
  return [
    {
      id: 1,
      company_id: 0,
      section_type: 'hero',
      order: 0,
      is_visible: true,
      content: { style: 'gradient' },
      created_at: now,
      updated_at: now,
    },
    {
      id: 2,
      company_id: 0,
      section_type: 'services',
      order: 1,
      is_visible: true,
      content: { display_mode: 'grid' },
      created_at: now,
      updated_at: now,
    },
    {
      id: 3,
      company_id: 0,
      section_type: 'contact',
      order: 2,
      is_visible: true,
      content: {},
      created_at: now,
      updated_at: now,
    },
    {
      id: 4,
      company_id: 0,
      section_type: 'map',
      order: 3,
      is_visible: true,
      content: {},
      created_at: now,
      updated_at: now,
    },
  ]
}

export default async function CompanyPage({ params }: Props) {
  const { slug } = await params

  let company
  let categories: PublicServiceCategory[] = []
  let services: PublicService[] = []
  let sections: PublicWebsiteSection[] = []

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

    // Try to fetch sections
    try {
      const fetchedSections = await publicApi.getWebsiteSections(slug)
      sections = fetchedSections.length > 0 ? fetchedSections : createDefaultSections()
    } catch {
      // Sections not available, use defaults
      sections = createDefaultSections()
    }
  } catch (error) {
    notFound()
  }

  // Generate CSS variables from company colors
  const colorVars = generateCssVariables({
    primary: company.accent_color || company.primary_color || defaultColors.primary,
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

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: cssVariables }} />
      <main
        className="min-h-screen"
        style={{
          backgroundColor: 'var(--color-background)',
          fontFamily: 'var(--font-body)',
          color: 'var(--color-text)',
        }}
      >
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
