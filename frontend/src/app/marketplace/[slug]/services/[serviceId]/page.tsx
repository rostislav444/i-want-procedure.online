import { notFound } from 'next/navigation'
import { publicApi } from '@/lib/public-api'
import type { Metadata } from 'next'
import { ServiceDetail } from './ServiceDetail'

interface Props {
  params: Promise<{ slug: string; serviceId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, serviceId } = await params
  try {
    const [company, services] = await Promise.all([
      publicApi.getCompany(slug),
      publicApi.getServices(slug),
    ])
    const service = services.find(s => s.id === parseInt(serviceId))
    if (!service) return { title: 'Послуга не знайдена' }

    return {
      title: `${service.name} — ${company.name}`,
      description: service.description || `${service.name} від ${company.name}. Тривалість: ${service.duration_minutes} хв.`,
    }
  } catch {
    return { title: 'Послуга не знайдена' }
  }
}

export default async function ServicePage({ params }: Props) {
  const { slug, serviceId } = await params

  try {
    const [company, services] = await Promise.all([
      publicApi.getCompany(slug),
      publicApi.getServices(slug),
    ])

    const service = services.find(s => s.id === parseInt(serviceId))
    if (!service) notFound()

    // Get related services (same category)
    const related = services
      .filter(s => s.id !== service!.id && s.global_category_id === service!.global_category_id)
      .slice(0, 4)

    return (
      <ServiceDetail
        company={company}
        service={service!}
        relatedServices={related}
      />
    )
  } catch {
    notFound()
  }
}
