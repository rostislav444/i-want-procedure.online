'use client'

import { Shield, Clock, Award, Heart, Star, Check, Zap, Users, Sparkles } from 'lucide-react'
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
  sectionIndex?: number
  isAltBackground?: boolean
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
  sparkles: Sparkles,
}

const defaultBenefits = [
  { icon: 'award', title: 'Професіоналізм', description: 'Досвідчені спеціалісти з багаторічним стажем' },
  { icon: 'shield', title: 'Якість', description: 'Використовуємо тільки сертифіковані матеріали' },
  { icon: 'clock', title: 'Зручність', description: 'Гнучкий графік та онлайн-запис' },
  { icon: 'heart', title: 'Турбота', description: 'Індивідуальний підхід до кожного клієнта' },
]

export function BenefitsSection({ content, theme, company, isAltBackground = true }: Props) {
  const title = content.title || 'Чому обирають мене'
  const subtitle = content.subtitle
  const benefits = content.benefits?.length ? content.benefits : defaultBenefits
  const layout = content.layout || 'grid'
  const columns = content.columns || 4

  // Dynamic colors
  const bgColor = isAltBackground ? 'var(--color-background-alt)' : 'var(--color-background)'
  const textColor = isAltBackground ? 'var(--color-text-on-alt)' : 'var(--color-text)'
  const textMutedColor = isAltBackground ? 'var(--color-text-muted-on-alt)' : 'var(--color-text-muted)'

  return (
    <section className="py-20 lg:py-32 relative overflow-hidden" style={{ backgroundColor: bgColor }}>
      {/* Background decorations */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, var(--color-primary-500) 0%, transparent 50%),
                           radial-gradient(circle at 80% 80%, var(--color-secondary-500) 0%, transparent 50%)`,
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h2
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
            style={{ fontFamily: 'var(--font-accent)', color: textColor }}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="text-lg md:text-xl max-w-2xl mx-auto" style={{ color: textMutedColor }}>
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
            className="group p-8 text-center transition-all duration-300 hover:scale-[1.02] relative overflow-hidden"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: theme.borderRadius.card,
              boxShadow: theme.shadow.card,
            }}
          >
            {/* Hover gradient */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
              style={{
                background: `linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500))`,
              }}
            />

            <div className="relative z-10">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: 'var(--color-primary-100)' }}
              >
                <IconComponent className="w-8 h-8" style={{ color: 'var(--color-primary-500)' }} />
              </div>
              <h3 className="font-bold text-lg mb-3" style={{ color: 'var(--color-text)' }}>
                {benefit.title}
              </h3>
              {benefit.description && (
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
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

function ListLayout({ benefits, theme }: LayoutProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {benefits.map((benefit, index) => {
        const IconComponent = iconMap[benefit.icon || 'star'] || Star
        return (
          <div
            key={index}
            className="group flex items-start gap-5 p-6 transition-all duration-300 hover:scale-[1.01]"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: theme.borderRadius.card,
              boxShadow: theme.shadow.card,
            }}
          >
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
              style={{ backgroundColor: 'var(--color-primary-100)' }}
            >
              <IconComponent className="w-7 h-7" style={{ color: 'var(--color-primary-500)' }} />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--color-text)' }}>
                {benefit.title}
              </h3>
              {benefit.description && (
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
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
    <div className="space-y-12 max-w-4xl mx-auto">
      {benefits.map((benefit, index) => {
        const IconComponent = iconMap[benefit.icon || 'star'] || Star
        const isEven = index % 2 === 0
        return (
          <div
            key={index}
            className={`flex flex-col md:flex-row items-center gap-8 ${isEven ? '' : 'md:flex-row-reverse'}`}
          >
            <div
              className="w-28 h-28 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-xl"
              style={{
                background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500))',
              }}
            >
              <IconComponent className="w-14 h-14 text-white" />
            </div>
            <div className={`text-center md:text-left flex-1 ${isEven ? '' : 'md:text-right'}`}>
              <h3 className="font-bold text-2xl mb-3" style={{ color: 'var(--color-text)' }}>
                {benefit.title}
              </h3>
              {benefit.description && (
                <p className="text-lg leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
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
