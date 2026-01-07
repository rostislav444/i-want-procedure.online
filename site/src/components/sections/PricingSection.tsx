'use client'

import { Check, Star } from 'lucide-react'
import { Company } from '@/lib/api'
import { IndustryTheme } from '@/lib/themes'

interface PricingPlan {
  name: string
  price: string
  period?: string
  description?: string
  features: string[]
  highlighted?: boolean
  cta_text?: string
  cta_link?: string
}

interface PricingContent {
  title?: string
  subtitle?: string
  plans?: PricingPlan[]
}

interface Props {
  content: PricingContent
  theme: IndustryTheme
  company: Company
  sectionIndex?: number
  isAltBackground?: boolean
}

const defaultPlans: PricingPlan[] = [
  {
    name: 'Базовий',
    price: '500',
    period: 'за процедуру',
    features: ['Консультація', 'Базова процедура', 'Рекомендації по догляду'],
    cta_text: 'Записатися',
  },
  {
    name: 'Стандарт',
    price: '1000',
    period: 'за процедуру',
    features: ['Консультація', 'Повна процедура', 'Догляд після', 'Контрольний огляд'],
    highlighted: true,
    cta_text: 'Записатися',
  },
  {
    name: 'Преміум',
    price: '2000',
    period: 'за процедуру',
    features: ['VIP консультація', 'Преміум процедура', 'Комплексний догляд', 'Підтримка 24/7'],
    cta_text: 'Записатися',
  },
]

export function PricingSection({ content, theme, company, isAltBackground = true }: Props) {
  const title = content.title || 'Тарифи'
  const subtitle = content.subtitle
  const plans = content.plans?.length ? content.plans : defaultPlans

  const ctaLink = company.telegram ? `https://t.me/${company.telegram.replace('@', '')}` : '#'

  return (
    <section className="py-16 md:py-24" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ fontFamily: 'var(--font-accent)', color: 'var(--color-text)' }}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--color-text-muted)' }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Pricing Cards */}
        <div className={`grid gap-8 ${plans.length === 2 ? 'md:grid-cols-2 max-w-3xl mx-auto' : 'md:grid-cols-3'}`}>
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative p-8 flex flex-col ${plan.highlighted ? 'md:-mt-4 md:mb-4' : ''}`}
              style={{
                backgroundColor: plan.highlighted ? 'var(--color-primary-500)' : 'var(--color-surface)',
                borderRadius: theme.borderRadius.card,
                boxShadow: plan.highlighted ? theme.shadow.elevated : theme.shadow.card,
              }}
            >
              {/* Highlighted badge */}
              {plan.highlighted && (
                <div
                  className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 px-4 py-1 rounded-full text-sm font-semibold"
                  style={{
                    backgroundColor: 'var(--color-secondary-500)',
                    color: 'var(--color-secondary-contrast)',
                  }}
                >
                  <Star className="w-4 h-4" />
                  Популярний
                </div>
              )}

              {/* Plan name */}
              <h3
                className="text-xl font-semibold mb-2"
                style={{ color: plan.highlighted ? 'white' : 'var(--color-text)' }}
              >
                {plan.name}
              </h3>

              {/* Description */}
              {plan.description && (
                <p
                  className="text-sm mb-4"
                  style={{ color: plan.highlighted ? 'rgba(255,255,255,0.8)' : 'var(--color-text-muted)' }}
                >
                  {plan.description}
                </p>
              )}

              {/* Price */}
              <div className="mb-6">
                <span
                  className="text-4xl font-bold"
                  style={{ color: plan.highlighted ? 'white' : 'var(--color-text)' }}
                >
                  {plan.price} ₴
                </span>
                {plan.period && (
                  <span
                    className="text-sm ml-2"
                    style={{ color: plan.highlighted ? 'rgba(255,255,255,0.8)' : 'var(--color-text-muted)' }}
                  >
                    {plan.period}
                  </span>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-sm"
                    style={{ color: plan.highlighted ? 'rgba(255,255,255,0.9)' : 'var(--color-text)' }}
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: plan.highlighted ? 'rgba(255,255,255,0.2)' : 'var(--color-primary-100)',
                      }}
                    >
                      <Check
                        className="w-3 h-3"
                        style={{ color: plan.highlighted ? 'white' : 'var(--color-primary-500)' }}
                      />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a
                href={plan.cta_link || ctaLink}
                className="block w-full py-3 text-center font-semibold transition-all hover:opacity-90"
                style={{
                  backgroundColor: plan.highlighted ? 'white' : 'var(--color-primary-500)',
                  color: plan.highlighted ? 'var(--color-primary-500)' : 'var(--color-primary-contrast)',
                  borderRadius: theme.borderRadius.button,
                }}
              >
                {plan.cta_text || 'Обрати'}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
