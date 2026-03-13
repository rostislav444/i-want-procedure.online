import { notFound } from 'next/navigation'
import { publicApi } from '@/lib/public-api'
import type { Metadata } from 'next'
import { ServicesCatalog } from './ServicesCatalog'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const company = await publicApi.getCompany(slug)
    return {
      title: `Послуги — ${company.name}`,
      description: `Каталог послуг ${company.name}. Перегляньте повний прайс-лист та оберіть процедуру.`,
    }
  } catch {
    return { title: 'Послуги' }
  }
}

export default async function ServicesPage({ params }: Props) {
  const { slug } = await params

  try {
    const [company, services, categories] = await Promise.all([
      publicApi.getCompany(slug),
      publicApi.getServices(slug),
      publicApi.getCategories(slug),
    ])

    return (
      <ServicesCatalog
        company={company}
        services={services}
        categories={categories}
      />
    )
  } catch {
    notFound()
  }
}
