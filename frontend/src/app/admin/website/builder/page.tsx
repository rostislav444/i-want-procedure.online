'use client'

import { useEffect, useState } from 'react'
import { Puck, Config, Data } from '@measured/puck'
import '@measured/puck/puck.css'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Eye, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { websiteApi, companyApi, WebsiteSection, Company } from '@/lib/api'
import { PublicCompany } from '@/lib/public-api'

// Import site sections for Puck
import { HeroSection } from '@/components/site/sections/HeroSection'
import { ServicesSection } from '@/components/site/sections/ServicesSection'
import { AboutSection } from '@/components/site/sections/AboutSection'
import { ContactSection } from '@/components/site/sections/ContactSection'
import { BenefitsSection } from '@/components/site/sections/BenefitsSection'
import { TeamSection } from '@/components/site/sections/TeamSection'
import { TestimonialsSection } from '@/components/site/sections/TestimonialsSection'
import { FAQSection } from '@/components/site/sections/FAQSection'
import { CTASection } from '@/components/site/sections/CTASection'
import { GallerySection } from '@/components/site/sections/GallerySection'
import { PricingSection } from '@/components/site/sections/PricingSection'
import { getTheme } from '@/lib/themes'

// Mock company for preview
const mockCompany: PublicCompany = {
  id: 1,
  name: 'Центр краси "Аврора"',
  slug: 'aurora',
  description: 'Професійний догляд за вашою красою',
  phone: '+380 44 123 45 67',
  address: 'Київ, вул. Хрещатик, 1',
  template_type: 'clinic',
  industry_theme: 'cosmetology',
  primary_color: '#e91e63',
  accent_color: '#e91e63',
  secondary_color: '#9c27b0',
  background_color: '#ffffff',
  accent_font: 'Inter',
  body_font: 'Inter',
  specialization: 'Косметологія та естетична медицина',
  working_hours: 'Пн-Сб: 09:00-20:00',
}

// Puck configuration with site components
const puckConfig: Config = {
  categories: {
    hero: {
      title: 'Головна',
      components: ['Hero'],
    },
    content: {
      title: 'Контент',
      components: ['About', 'Benefits', 'Team', 'Gallery', 'Testimonials', 'FAQ'],
    },
    services: {
      title: 'Послуги',
      components: ['Services', 'Pricing'],
    },
    cta: {
      title: 'Заклики до дії',
      components: ['CTA', 'Contact'],
    },
  },
  components: {
    Hero: {
      label: 'Hero секція',
      fields: {
        title: { type: 'text', label: 'Заголовок' },
        subtitle: { type: 'textarea', label: 'Підзаголовок' },
        ctaText: { type: 'text', label: 'Текст кнопки' },
        style: {
          type: 'select',
          label: 'Стиль',
          options: [
            { label: 'Сучасний', value: 'modern' },
            { label: 'Градієнт', value: 'gradient' },
            { label: 'Мінімалістичний', value: 'minimal' },
            { label: 'Розділений', value: 'split' },
            { label: 'Статистика', value: 'stats' },
            { label: 'Картки', value: 'cards' },
            { label: 'Відгук', value: 'testimonial' },
            { label: 'Елегантний', value: 'elegant' },
          ],
        },
      },
      defaultProps: {
        title: '',
        subtitle: '',
        ctaText: 'Записатися',
        style: 'modern',
      },
      render: ({ title, subtitle, ctaText, style }) => {
        const theme = getTheme('cosmetology')
        return (
          <HeroSection
            content={{ title, subtitle, cta_text: ctaText, style }}
            theme={theme}
            company={mockCompany}
          />
        )
      },
    },
    About: {
      label: 'Про нас',
      fields: {
        title: { type: 'text', label: 'Заголовок' },
        text: { type: 'textarea', label: 'Текст' },
      },
      defaultProps: {
        title: 'Про нас',
        text: 'Ми працюємо для вашої краси...',
      },
      render: ({ title, text }) => {
        const theme = getTheme('cosmetology')
        return (
          <AboutSection
            content={{ title, text }}
            theme={theme}
            company={mockCompany}
            sectionIndex={1}
            isAltBackground={false}
          />
        )
      },
    },
    Services: {
      label: 'Послуги',
      fields: {
        title: { type: 'text', label: 'Заголовок' },
        displayMode: {
          type: 'select',
          label: 'Режим відображення',
          options: [
            { label: 'Сітка', value: 'grid' },
            { label: 'Список', value: 'list' },
          ],
        },
      },
      defaultProps: {
        title: 'Наші послуги',
        displayMode: 'grid',
      },
      render: ({ title, displayMode }) => {
        const theme = getTheme('cosmetology')
        return (
          <ServicesSection
            content={{ title, display_mode: displayMode }}
            theme={theme}
            company={mockCompany}
            services={[]}
            categories={[]}
            sectionIndex={1}
            isAltBackground={false}
          />
        )
      },
    },
    Benefits: {
      label: 'Переваги',
      fields: {
        title: { type: 'text', label: 'Заголовок' },
      },
      defaultProps: {
        title: 'Чому обирають нас',
      },
      render: ({ title }) => {
        const theme = getTheme('cosmetology')
        return (
          <BenefitsSection
            content={{ title }}
            theme={theme}
            company={mockCompany}
            sectionIndex={1}
            isAltBackground={false}
          />
        )
      },
    },
    Team: {
      label: 'Команда',
      fields: {
        title: { type: 'text', label: 'Заголовок' },
      },
      defaultProps: {
        title: 'Наша команда',
      },
      render: ({ title }) => {
        const theme = getTheme('cosmetology')
        return (
          <TeamSection
            content={{ title }}
            theme={theme}
            company={mockCompany}
            sectionIndex={1}
            isAltBackground={false}
          />
        )
      },
    },
    Gallery: {
      label: 'Галерея',
      fields: {
        title: { type: 'text', label: 'Заголовок' },
      },
      defaultProps: {
        title: 'Наші роботи',
      },
      render: ({ title }) => {
        const theme = getTheme('cosmetology')
        return (
          <GallerySection
            content={{ title }}
            theme={theme}
            company={mockCompany}
            sectionIndex={1}
            isAltBackground={false}
          />
        )
      },
    },
    Testimonials: {
      label: 'Відгуки',
      fields: {
        title: { type: 'text', label: 'Заголовок' },
      },
      defaultProps: {
        title: 'Відгуки клієнтів',
      },
      render: ({ title }) => {
        const theme = getTheme('cosmetology')
        return (
          <TestimonialsSection
            content={{ title }}
            theme={theme}
            company={mockCompany}
            sectionIndex={1}
            isAltBackground={false}
          />
        )
      },
    },
    FAQ: {
      label: 'FAQ',
      fields: {
        title: { type: 'text', label: 'Заголовок' },
      },
      defaultProps: {
        title: 'Часті запитання',
      },
      render: ({ title }) => {
        const theme = getTheme('cosmetology')
        return (
          <FAQSection
            content={{ title }}
            theme={theme}
            company={mockCompany}
            sectionIndex={1}
            isAltBackground={false}
          />
        )
      },
    },
    CTA: {
      label: 'CTA',
      fields: {
        title: { type: 'text', label: 'Заголовок' },
        buttonText: { type: 'text', label: 'Текст кнопки' },
      },
      defaultProps: {
        title: 'Готові до перетворень?',
        buttonText: 'Записатися',
      },
      render: ({ title, buttonText }) => {
        const theme = getTheme('cosmetology')
        return (
          <CTASection
            content={{ title, button_text: buttonText }}
            theme={theme}
            company={mockCompany}
            sectionIndex={1}
            isAltBackground={false}
          />
        )
      },
    },
    Contact: {
      label: 'Контакти',
      fields: {
        title: { type: 'text', label: 'Заголовок' },
      },
      defaultProps: {
        title: "Зв'яжіться з нами",
      },
      render: ({ title }) => {
        const theme = getTheme('cosmetology')
        return (
          <ContactSection
            content={{ title }}
            theme={theme}
            company={mockCompany}
            sectionIndex={1}
            isAltBackground={false}
          />
        )
      },
    },
    Pricing: {
      label: 'Ціни',
      fields: {
        title: { type: 'text', label: 'Заголовок' },
      },
      defaultProps: {
        title: 'Наші ціни',
      },
      render: ({ title }) => {
        const theme = getTheme('cosmetology')
        return (
          <PricingSection
            content={{ title }}
            theme={theme}
            company={mockCompany}
            sectionIndex={1}
            isAltBackground={false}
          />
        )
      },
    },
  },
}

// Initial empty data
const initialData: Data = {
  content: [],
  root: {},
}

export default function BuilderPage() {
  const router = useRouter()
  const [data, setData] = useState<Data>(initialData)
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Load company and sections
  useEffect(() => {
    async function load() {
      try {
        const [companyData, sections] = await Promise.all([
          companyApi.getMyCompany(),
          websiteApi.getSections(),
        ])
        setCompany(companyData)

        // Convert sections to Puck data format
        if (sections.length > 0) {
          const content = sections
            .sort((a, b) => a.order - b.order)
            .map((section, index) => ({
              type: sectionTypeToPuckComponent(section.section_type),
              props: {
                id: `section-${section.id}`,
                ...section.content,
              },
            }))

          setData({
            content,
            root: {},
          })
        }
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Map section types to Puck component names
  function sectionTypeToPuckComponent(type: string): string {
    const map: Record<string, string> = {
      hero: 'Hero',
      about: 'About',
      services: 'Services',
      benefits: 'Benefits',
      team: 'Team',
      gallery: 'Gallery',
      testimonials: 'Testimonials',
      faq: 'FAQ',
      cta: 'CTA',
      contact: 'Contact',
      pricing: 'Pricing',
    }
    return map[type] || 'Hero'
  }

  // Save data
  async function handleSave() {
    setSaving(true)
    try {
      // TODO: Convert Puck data back to website sections and save via API
      console.log('Saving data:', data)
      alert('Збережено!')
    } catch (error) {
      console.error('Failed to save:', error)
      alert('Помилка збереження')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
          <span className="text-gray-600">Завантаження редактора...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/website"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </Link>
          <div className="h-6 w-px bg-gray-200" />
          <h1 className="font-semibold text-gray-900">Редактор сайту</h1>
          {company && (
            <span className="text-sm text-gray-500">{company.name}</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {company && (
            <a
              href={`/site/${company.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Eye className="w-4 h-4" />
              Переглянути
            </a>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-white bg-pink-500 rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Зберегти
          </button>
        </div>
      </div>

      {/* Puck Editor */}
      <div className="flex-1 overflow-hidden">
        <Puck
          config={puckConfig}
          data={data}
          onPublish={handleSave}
          onChange={setData}
        />
      </div>
    </div>
  )
}
