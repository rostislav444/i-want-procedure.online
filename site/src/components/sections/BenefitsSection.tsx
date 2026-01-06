'use client'

import { Shield, Clock, Award, Heart, Star, Check, Zap, Users } from 'lucide-react'
import { Company } from '@/lib/api'
import { IndustryTheme } from '@/lib/themes'

interface BenefitsContent {
  title?: string
  subtitle?: string
  benefits?: Array<{
    icon?: string
    title: string
    description?: string
  }>
  layout?: 'grid' | 'list' | 'alternating'
  columns?: 2 | 3 | 4
}

interface Props {
  content: BenefitsContent
  theme: IndustryTheme
  company: Company
}

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  shield: Shield,
  clock: Clock,
  award: Award,
  heart: Heart,
  star: Star,
  check: Check,
  zap: Zap,
  users: Users,
}

const defaultBenefits = [
  { icon: 'award', title: 'Професіоналізм', description: 'Досвідчені спеціалісти з багаторічним стажем' },
  { icon: 'shield', title: 'Якість', description: 'Використовуємо тільки сертифіковані матеріали' },
  { icon: 'clock', title: 'Зручність', description: 'Гнучкий графік та онлайн-запис' },
  { icon: 'heart', title: 'Турбота', description: 'Індивідуальний підхід до кожного клієнта' },
]

export function BenefitsSection({ content, theme, company }: Props) {
  const title = content.title || 'Чому обирають нас'
  const subtitle = content.subtitle
  const benefits = content.benefits?.length ? content.benefits : defaultBenefits
  const layout = content.layout || 'grid'
  const columns = content.columns || 4

  return (
    <section className="py-16 md:py-24" style={{ backgroundColor: 'var(--color-background-alt)' }}>
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

        {/* Benefits */}
        {layout === 'grid' && (
          <GridLayout benefits={benefits} theme={theme} columns={columns} />
        )}

        {layout === 'list' && (
          <ListLayout benefits={benefits} theme={theme} />
        )}

        {layout === 'alternating' && (
          <AlternatingLayout benefits={benefits} theme={theme} />
        )}
      </div>
    </section>
  )
}

interface LayoutProps {
  benefits: NonNullable<BenefitsContent['benefits']>
  theme: IndustryTheme
  columns?: number
}

function GridLayout({ benefits, theme, columns = 4 }: LayoutProps) {
  const gridCols = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
  }[columns] || 'sm:grid-cols-2 lg:grid-cols-4'

  return (
    <div className={`grid ${gridCols} gap-6`}>
      {benefits.map((benefit, index) => {
        const IconComponent = iconMap[benefit.icon || 'star'] || Star
        return (
          <div
            key={index}
            className="p-6 text-center transition-transform hover:scale-[1.02]"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: theme.borderRadius.card,
              boxShadow: theme.shadow.card,
            }}
          >
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: 'var(--color-primary-100)' }}
            >
              <IconComponent className="w-7 h-7" style={{ color: 'var(--color-primary-500)' }} />
            </div>
            <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--color-text)' }}>
              {benefit.title}
            </h3>
            {benefit.description && (
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {benefit.description}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

function ListLayout({ benefits, theme }: LayoutProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {benefits.map((benefit, index) => {
        const IconComponent = iconMap[benefit.icon || 'star'] || Star
        return (
          <div
            key={index}
            className="flex items-start gap-4 p-5"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: theme.borderRadius.card,
              boxShadow: theme.shadow.card,
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--color-primary-100)' }}
            >
              <IconComponent className="w-6 h-6" style={{ color: 'var(--color-primary-500)' }} />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1" style={{ color: 'var(--color-text)' }}>
                {benefit.title}
              </h3>
              {benefit.description && (
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  {benefit.description}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function AlternatingLayout({ benefits, theme }: LayoutProps) {
  return (
    <div className="space-y-8">
      {benefits.map((benefit, index) => {
        const IconComponent = iconMap[benefit.icon || 'star'] || Star
        const isEven = index % 2 === 0
        return (
          <div
            key={index}
            className={`flex flex-col md:flex-row items-center gap-8 ${isEven ? '' : 'md:flex-row-reverse'}`}
          >
            <div
              className="w-24 h-24 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500))',
              }}
            >
              <IconComponent className="w-12 h-12 text-white" />
            </div>
            <div className={`text-center md:text-left ${isEven ? '' : 'md:text-right'}`}>
              <h3 className="font-semibold text-xl mb-2" style={{ color: 'var(--color-text)' }}>
                {benefit.title}
              </h3>
              {benefit.description && (
                <p className="text-base" style={{ color: 'var(--color-text-muted)' }}>
                  {benefit.description}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
