import { notFound } from 'next/navigation'
import { publicApi } from '@/lib/public-api'
import type { Metadata } from 'next'
import { ContactsContent } from './ContactsContent'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const company = await publicApi.getCompany(slug)
    return {
      title: `Контакти — ${company.name}`,
      description: `Контактна інформація ${company.name}. Адреса, телефон, соціальні мережі.`,
    }
  } catch {
    return { title: 'Контакти' }
  }
}

export default async function ContactsPage({ params }: Props) {
  const { slug } = await params

  try {
    const company = await publicApi.getCompany(slug)
    return <ContactsContent company={company} />
  } catch {
    notFound()
  }
}
