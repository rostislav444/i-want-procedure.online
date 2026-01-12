'use client'

import { Company, Service, ServiceCategory, WebsiteSection, IndustryTheme } from './types'
import { getTheme } from '@/lib/themes'
import { WaveSection, shouldUseAltBackground } from './ui/WaveSection'
import {
  HeroSection,
  ServicesSection,
  ContactSection,
  MapSection,
  AboutSection,
  BenefitsSection,
  TeamSection,
  TestimonialsSection,
  FAQSection,
  CTASection,
  GallerySection,
  PricingSection,
} from './sections'

interface Props {
  sections: WebsiteSection[]
  company: Company
  services: Service[]
  categories: ServiceCategory[]
}

/**
 * Dynamic section renderer that renders website sections based on their type
 * Uses WaveSection wrapper for seamless wave transitions between sections
 */
export function SectionRenderer({ sections, company, services, categories }: Props) {
  const theme = getTheme(company.industry_theme)

  const visibleSections = sections
    .filter(s => s.is_visible)
    .sort((a, b) => a.order - b.order)

  return (
    <>
      {visibleSections.map((section, index) => {
        const isAltBackground = shouldUseAltBackground(index)
        const bgColor = isAltBackground ? 'var(--color-background-alt)' : 'var(--color-background)'
        const isFirstSection = index === 0

        return (
          <WaveSection
            key={section.id}
            backgroundColor={bgColor}
            sectionIndex={index}
            showTopWave={!isFirstSection}
            className={!isFirstSection ? '-mt-1' : ''}
          >
            <SectionComponent
              section={section}
              sectionIndex={index}
              isAltBackground={isAltBackground}
              theme={theme}
              company={company}
              services={services}
              categories={categories}
            />
          </WaveSection>
        )
      })}
    </>
  )
}

interface SectionComponentProps {
  section: WebsiteSection
  sectionIndex: number
  isAltBackground: boolean
  theme: IndustryTheme
  company: Company
  services: Service[]
  categories: ServiceCategory[]
}

/**
 * Renders a single section based on its type
 * Note: backgroundColor is handled by WaveSection wrapper, sections should use transparent bg
 */
function SectionComponent({ section, sectionIndex, isAltBackground, theme, company, services, categories }: SectionComponentProps) {
  const content = section.content as Record<string, unknown>

  switch (section.section_type) {
    case 'hero':
      return (
        <HeroSection
          content={content as any}
          theme={theme}
          company={company}
          sectionIndex={sectionIndex}
          isAltBackground={isAltBackground}
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
          sectionIndex={sectionIndex}
          isAltBackground={isAltBackground}
        />
      )

    case 'contact':
      return (
        <ContactSection
          content={content as any}
          theme={theme}
          company={company}
          sectionIndex={sectionIndex}
          isAltBackground={isAltBackground}
        />
      )

    case 'map':
      return (
        <MapSection
          content={content as any}
          theme={theme}
          company={company}
          sectionIndex={sectionIndex}
          isAltBackground={isAltBackground}
        />
      )

    case 'about':
      return (
        <AboutSection
          content={content as any}
          theme={theme}
          company={company}
          sectionIndex={sectionIndex}
          isAltBackground={isAltBackground}
        />
      )

    case 'benefits':
      return (
        <BenefitsSection
          content={content as any}
          theme={theme}
          company={company}
          sectionIndex={sectionIndex}
          isAltBackground={isAltBackground}
        />
      )

    case 'team':
      return (
        <TeamSection
          content={content as any}
          theme={theme}
          company={company}
          sectionIndex={sectionIndex}
          isAltBackground={isAltBackground}
        />
      )

    case 'testimonials':
      return (
        <TestimonialsSection
          content={content as any}
          theme={theme}
          company={company}
          sectionIndex={sectionIndex}
          isAltBackground={isAltBackground}
        />
      )

    case 'faq':
      return (
        <FAQSection
          content={content as any}
          theme={theme}
          company={company}
          sectionIndex={sectionIndex}
          isAltBackground={isAltBackground}
        />
      )

    case 'cta':
      return (
        <CTASection
          content={content as any}
          theme={theme}
          company={company}
          sectionIndex={sectionIndex}
          isAltBackground={isAltBackground}
        />
      )

    case 'gallery':
      return (
        <GallerySection
          content={content as any}
          theme={theme}
          company={company}
          sectionIndex={sectionIndex}
          isAltBackground={isAltBackground}
        />
      )

    case 'pricing':
      return (
        <PricingSection
          content={content as any}
          theme={theme}
          company={company}
          sectionIndex={sectionIndex}
          isAltBackground={isAltBackground}
        />
      )

    case 'schedule':
    case 'custom_text':
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

function PlaceholderSection({ sectionType, theme }: { sectionType: string; theme: IndustryTheme }) {
  const sectionNames: Record<string, string> = {
    schedule: 'Графік роботи',
    custom_text: 'Текст',
  }

  return (
    <section className="py-16">
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
