'use client'

import { Company, Service, ServiceCategory, WebsiteSection } from '@/lib/api'
import { IndustryTheme, getTheme } from '@/lib/themes'
import {
  HeroSection,
  ServicesSection,
  ContactSection,
  MapSection,
} from './sections'

interface Props {
  sections: WebsiteSection[]
  company: Company
  services: Service[]
  categories: ServiceCategory[]
}

/**
 * Dynamic section renderer that renders website sections based on their type
 */
export function SectionRenderer({ sections, company, services, categories }: Props) {
  // Get the theme based on company's industry_theme
  const theme = getTheme(company.industry_theme)

  // Sort sections by order and filter visible ones
  const visibleSections = sections
    .filter(s => s.is_visible)
    .sort((a, b) => a.order - b.order)

  return (
    <>
      {visibleSections.map((section) => (
        <SectionComponent
          key={section.id}
          section={section}
          theme={theme}
          company={company}
          services={services}
          categories={categories}
        />
      ))}
    </>
  )
}

interface SectionComponentProps {
  section: WebsiteSection
  theme: IndustryTheme
  company: Company
  services: Service[]
  categories: ServiceCategory[]
}

/**
 * Renders a single section based on its type
 */
function SectionComponent({ section, theme, company, services, categories }: SectionComponentProps) {
  const content = section.content as Record<string, unknown>

  switch (section.section_type) {
    case 'hero':
      return (
        <HeroSection
          content={content as any}
          theme={theme}
          company={company}
        />
      )

    case 'services':
      return (
        <ServicesSection
          content={content as any}
          theme={theme}
          company={company}
          services={services}
          categories={categories}
        />
      )

    case 'contact':
      return (
        <ContactSection
          content={content as any}
          theme={theme}
          company={company}
        />
      )

    case 'map':
      return (
        <MapSection
          content={content as any}
          theme={theme}
          company={company}
        />
      )

    // Add more section types as they are implemented
    case 'about':
    case 'team':
    case 'benefits':
    case 'gallery':
    case 'testimonials':
    case 'faq':
    case 'cta':
    case 'pricing':
    case 'schedule':
    case 'custom_text':
      // Placeholder for sections not yet implemented
      return (
        <PlaceholderSection
          sectionType={section.section_type}
          theme={theme}
        />
      )

    default:
      console.warn(`Unknown section type: ${section.section_type}`)
      return null
  }
}

/**
 * Placeholder for sections not yet implemented
 */
function PlaceholderSection({ sectionType, theme }: { sectionType: string; theme: IndustryTheme }) {
  const sectionNames: Record<string, string> = {
    about: 'Про нас',
    team: 'Команда',
    benefits: 'Переваги',
    gallery: 'Галерея',
    testimonials: 'Відгуки',
    faq: 'FAQ',
    cta: 'Заклик до дії',
    pricing: 'Ціни',
    schedule: 'Графік роботи',
    custom_text: 'Текст',
  }

  return (
    <section className="py-16" style={{ backgroundColor: 'var(--color-background-alt)' }}>
      <div className="max-w-5xl mx-auto px-4 text-center">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
          style={{ backgroundColor: 'var(--color-primary-100)' }}
        >
          <span className="text-2xl" style={{ color: 'var(--color-primary-500)' }}>
            {sectionType[0].toUpperCase()}
          </span>
        </div>
        <h3 className="text-xl font-semibold" style={{ color: 'var(--color-text-muted)' }}>
          {sectionNames[sectionType] || sectionType}
        </h3>
        <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>
          Ця секція буде доступна найближчим часом
        </p>
      </div>
    </section>
  )
}
