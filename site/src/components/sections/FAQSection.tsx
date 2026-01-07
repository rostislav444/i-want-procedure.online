'use client'

import { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'
import { Company } from '@/lib/api'
import { IndustryTheme } from '@/lib/themes'

interface FAQContent {
  title?: string
  subtitle?: string
  items?: Array<{
    question: string
    answer: string
  }>
  layout?: 'accordion' | 'grid'
}

interface Props {
  content: FAQContent
  theme: IndustryTheme
  company: Company
  sectionIndex?: number
  isAltBackground?: boolean
}

const defaultFAQItems = [
  {
    question: 'Як записатися на прийом?',
    answer: 'Ви можете записатися через наш Telegram-бот, зателефонувавши за номером телефону, або залишивши заявку на сайті.',
  },
  {
    question: 'Які форми оплати ви приймаєте?',
    answer: 'Ми приймаємо готівку, банківські картки та безконтактну оплату.',
  },
  {
    question: 'Чи потрібна попередня консультація?',
    answer: 'Для деяких процедур рекомендуємо попередню консультацію. Детальніше можете дізнатися у нашого адміністратора.',
  },
]

export function FAQSection({ content, theme, company, isAltBackground = true }: Props) {
  const title = content.title || 'Часті запитання'
  const subtitle = content.subtitle
  const items = content.items?.length ? content.items : defaultFAQItems
  const layout = content.layout || 'accordion'

  // Dynamic colors based on background
  const bgColor = isAltBackground ? 'var(--color-background-alt)' : 'var(--color-background)'
  const textColor = isAltBackground ? 'var(--color-text-on-alt)' : 'var(--color-text)'
  const textMutedColor = isAltBackground ? 'var(--color-text-muted-on-alt)' : 'var(--color-text-muted)'
  const surfaceColor = isAltBackground ? 'var(--color-surface-on-alt)' : 'var(--color-surface)'

  return (
    <section className="py-16 md:py-24" style={{ backgroundColor: bgColor }}>
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4"
            style={{
              backgroundColor: 'var(--color-primary-100)',
              color: 'var(--color-primary-700)',
            }}
          >
            <HelpCircle className="w-4 h-4" />
            <span>FAQ</span>
          </div>
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ fontFamily: 'var(--font-accent)', color: textColor }}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="text-lg max-w-2xl mx-auto" style={{ color: textMutedColor }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* FAQ Items */}
        {layout === 'accordion' && (
          <AccordionLayout items={items} theme={theme} textColor={textColor} textMutedColor={textMutedColor} surfaceColor={surfaceColor} />
        )}

        {layout === 'grid' && (
          <GridLayout items={items} theme={theme} textColor={textColor} textMutedColor={textMutedColor} surfaceColor={surfaceColor} />
        )}
      </div>
    </section>
  )
}

interface LayoutProps {
  items: NonNullable<FAQContent['items']>
  theme: IndustryTheme
  textColor: string
  textMutedColor: string
  surfaceColor: string
}

function AccordionLayout({ items, theme, textColor, textMutedColor, surfaceColor }: LayoutProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const isOpen = openIndex === index
        return (
          <div
            key={index}
            className="overflow-hidden"
            style={{
              backgroundColor: surfaceColor,
              borderRadius: theme.borderRadius.card,
              boxShadow: theme.shadow.card,
            }}
          >
            <button
              className="w-full flex items-center justify-between p-5 text-left"
              onClick={() => setOpenIndex(isOpen ? null : index)}
            >
              <span className="font-semibold pr-4" style={{ color: textColor }}>
                {item.question}
              </span>
              <ChevronDown
                className={`w-5 h-5 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                style={{ color: 'var(--color-primary-500)' }}
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96' : 'max-h-0'}`}
            >
              <div
                className="px-5 pb-5 pt-0"
                style={{ color: textMutedColor }}
              >
                {item.answer}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function GridLayout({ items, theme, textColor, textMutedColor, surfaceColor }: LayoutProps) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {items.map((item, index) => (
        <div
          key={index}
          className="p-6"
          style={{
            backgroundColor: surfaceColor,
            borderRadius: theme.borderRadius.card,
            boxShadow: theme.shadow.card,
          }}
        >
          <h3 className="font-semibold mb-3" style={{ color: textColor }}>
            {item.question}
          </h3>
          <p className="text-sm" style={{ color: textMutedColor }}>
            {item.answer}
          </p>
        </div>
      ))}
    </div>
  )
}
