import { notFound } from 'next/navigation'
import { publicApi } from '@/lib/public-api'
import { SiteNav } from './SiteNav'
import { Breadcrumbs } from './Breadcrumbs'

interface Props {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export default async function CompanySiteLayout({ children, params }: Props) {
  const { slug } = await params

  let company
  try {
    company = await publicApi.getCompany(slug)
  } catch {
    notFound()
  }

  // Parse social links
  let socialLinks: Record<string, string> = {}
  if (company.social_links) {
    try { socialLinks = JSON.parse(company.social_links) } catch {}
  }

  const base = `/marketplace/${company.id}-${company.slug}`

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF9] dark:bg-[#0f0f17] text-neutral-900 dark:text-neutral-100" style={{ fontFamily: "'Inter', sans-serif" }}>
      <SiteNav company={company} socialLinks={socialLinks} />
      <main className="flex-grow pt-16">
        <Breadcrumbs companyName={company.name} base={base} />
        {children}
      </main>
      {/* Minimal footer */}
      <footer className="border-t border-neutral-200 dark:border-white/10 py-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-neutral-400 dark:text-neutral-500">
          <span>&copy; {new Date().getFullYear()} {company.name}</span>
          <a href="/" className="hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">Beautica</a>
        </div>
      </footer>
    </div>
  )
}
