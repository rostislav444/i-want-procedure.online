'use client'

import { User, Award, Heart, Star, Sparkles } from 'lucide-react'
import { Company } from '@/lib/api'
import { IndustryTheme } from '@/lib/themes'

interface AboutContent {
  title?: string
  subtitle?: string
  text?: string
  image?: string
  layout?: 'text-only' | 'image-left' | 'image-right'
  highlights?: Array<{
    icon?: string
    title: string
    description?: string
  }>
}

interface Props {
  content: AboutContent
  theme: IndustryTheme
  company: Company
  sectionIndex?: number
  isAltBackground?: boolean
}

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  user: User,
  award: Award,
  heart: Heart,
  star: Star,
  sparkles: Sparkles,
}

export function AboutSection({ content, theme, company, isAltBackground = true }: Props) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'

  const title = content.title || 'Про мене'
  const subtitle = content.subtitle
  const text = content.text || company.description
  const layout = content.layout || 'text-only'
  const highlights = content.highlights || []

  const imageUrl = content.image
    ? `${apiUrl}${content.image}`
    : company.cover_image_url
      ? `${apiUrl}${company.cover_image_url}`
      : null

  // Dynamic colors based on background
  const bgColor = isAltBackground ? 'var(--color-background-alt)' : 'var(--color-background)'
  const textColor = isAltBackground ? 'var(--color-text-on-alt)' : 'var(--color-text)'
  const textMutedColor = isAltBackground ? 'var(--color-text-muted-on-alt)' : 'var(--color-text-muted)'
  const surfaceColor = isAltBackground ? 'var(--color-surface-on-alt)' : 'var(--color-surface)'

  return (
    <section className="py-20 lg:py-32 relative overflow-hidden" style={{ backgroundColor: bgColor }}>
      {/* Decorative gradient orbs */}
      <div
        className="absolute top-20 right-0 w-[500px] h-[500px] rounded-full blur-[120px] opacity-10 pointer-events-none"
        style={{ background: 'var(--color-primary-500)' }}
      />
      <div
        className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full blur-[100px] opacity-10 pointer-events-none"
        style={{ background: 'var(--color-secondary-500)' }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {layout === 'text-only' && (
          <TextOnlyLayout
            title={title}
            subtitle={subtitle}
            text={text}
            highlights={highlights}
            theme={theme}
            textColor={textColor}
            textMutedColor={textMutedColor}
            surfaceColor={surfaceColor}
          />
        )}

        {layout === 'image-left' && (
          <ImageLayout
            title={title}
            subtitle={subtitle}
            text={text}
            highlights={highlights}
            theme={theme}
            imageUrl={imageUrl}
            imagePosition="left"
            textColor={textColor}
            textMutedColor={textMutedColor}
            surfaceColor={surfaceColor}
          />
        )}

        {layout === 'image-right' && (
          <ImageLayout
            title={title}
            subtitle={subtitle}
            text={text}
            highlights={highlights}
            theme={theme}
            imageUrl={imageUrl}
            imagePosition="right"
            textColor={textColor}
            textMutedColor={textMutedColor}
            surfaceColor={surfaceColor}
          />
        )}
      </div>
    </section>
  )
}

interface LayoutProps {
  title: string
  subtitle?: string
  text?: string
  highlights: AboutContent['highlights']
  theme: IndustryTheme
  imageUrl?: string | null
  imagePosition?: 'left' | 'right'
  textColor: string
  textMutedColor: string
  surfaceColor: string
}

function TextOnlyLayout({ title, subtitle, text, highlights, theme, textColor, textMutedColor, surfaceColor }: LayoutProps) {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h2
          className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
          style={{ fontFamily: 'var(--font-accent)', color: textColor }}
        >
          {title}
        </h2>

        {subtitle && (
          <p
            className="text-xl md:text-2xl font-medium"
            style={{ color: 'var(--color-primary-500)' }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Text in a premium card */}
      {text && (
        <div
          className="p-8 md:p-12 mb-12"
          style={{
            backgroundColor: surfaceColor,
            borderRadius: theme.borderRadius.card,
            boxShadow: theme.shadow.card,
          }}
        >
          <p
            className="text-lg md:text-xl leading-relaxed text-center"
            style={{ color: textMutedColor }}
          >
            {text}
          </p>
        </div>
      )}

      {/* Highlights grid */}
      {highlights && highlights.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {highlights.map((item, index) => {
            const IconComponent = iconMap[item.icon || 'star'] || Star
            return (
              <div
                key={index}
                className="group p-6 text-center transition-all duration-300 hover:scale-[1.02]"
                style={{
                  backgroundColor: surfaceColor,
                  borderRadius: theme.borderRadius.card,
                  boxShadow: theme.shadow.card,
                }}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: 'var(--color-primary-100)' }}
                >
                  <IconComponent className="w-8 h-8" style={{ color: 'var(--color-primary-500)' }} />
                </div>
                <h4 className="font-bold text-lg mb-2" style={{ color: textColor }}>
                  {item.title}
                </h4>
                {item.description && (
                  <p className="text-sm" style={{ color: textMutedColor }}>
                    {item.description}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ImageLayout({ title, subtitle, text, highlights, theme, imageUrl, imagePosition, textColor, textMutedColor, surfaceColor }: LayoutProps) {
  const isLeft = imagePosition === 'left'

  return (
    <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
      {/* Image - spans 5 columns */}
      <div className={`lg:col-span-5 ${isLeft ? 'lg:order-1' : 'lg:order-2'}`}>
        <div className="relative">
          {/* Background glow */}
          <div
            className="absolute -inset-4 rounded-3xl opacity-30 blur-2xl"
            style={{
              background: `linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500))`,
            }}
          />

          {imageUrl ? (
            <div
              className="relative aspect-[3/4] overflow-hidden"
              style={{ borderRadius: '2rem' }}
            >
              <img
                src={imageUrl}
                alt={title}
                className="w-full h-full object-cover"
              />
              {/* Gradient overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 50%)',
                }}
              />
            </div>
          ) : (
            <div
              className="relative aspect-[3/4] flex items-center justify-center"
              style={{
                borderRadius: '2rem',
                background: 'linear-gradient(135deg, var(--color-primary-100), var(--color-secondary-100))',
              }}
            >
              <User className="w-32 h-32" style={{ color: 'var(--color-primary-300)' }} />
            </div>
          )}

          {/* Floating experience card */}
          <div
            className="absolute -bottom-6 -right-6 p-4 hidden md:block"
            style={{
              backgroundColor: surfaceColor,
              borderRadius: theme.borderRadius.card,
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-primary-100)' }}
              >
                <Award className="w-6 h-6" style={{ color: 'var(--color-primary-500)' }} />
              </div>
              <div>
                <p className="font-bold" style={{ color: textColor }}>10+ років</p>
                <p className="text-sm" style={{ color: textMutedColor }}>досвіду</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content - spans 7 columns */}
      <div className={`lg:col-span-7 ${isLeft ? 'lg:order-2' : 'lg:order-1'}`}>
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6"
          style={{
            backgroundColor: 'var(--color-primary-100)',
            color: 'var(--color-primary-700)',
          }}
        >
          <Sparkles className="w-4 h-4" />
          <span>Про мене</span>
        </div>

        <h2
          className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6"
          style={{ fontFamily: 'var(--font-accent)', color: textColor }}
        >
          {title}
        </h2>

        {subtitle && (
          <p
            className="text-xl font-medium mb-4"
            style={{ color: 'var(--color-primary-500)' }}
          >
            {subtitle}
          </p>
        )}

        {text && (
          <p
            className="text-lg leading-relaxed mb-8"
            style={{ color: textMutedColor }}
          >
            {text}
          </p>
        )}

        {/* Highlights as list */}
        {highlights && highlights.length > 0 && (
          <div className="space-y-4">
            {highlights.map((item, index) => {
              const IconComponent = iconMap[item.icon || 'star'] || Star
              return (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 transition-all duration-300 hover:scale-[1.01]"
                  style={{
                    backgroundColor: surfaceColor,
                    borderRadius: theme.borderRadius.card,
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'var(--color-primary-100)' }}
                  >
                    <IconComponent className="w-6 h-6" style={{ color: 'var(--color-primary-500)' }} />
                  </div>
                  <div>
                    <h4 className="font-bold" style={{ color: textColor }}>
                      {item.title}
                    </h4>
                    {item.description && (
                      <p className="text-sm mt-1" style={{ color: textMutedColor }}>
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
