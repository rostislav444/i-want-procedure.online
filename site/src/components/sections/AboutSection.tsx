'use client'

import { User, Award, Heart, Star } from 'lucide-react'
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
}

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  user: User,
  award: Award,
  heart: Heart,
  star: Star,
}

export function AboutSection({ content, theme, company }: Props) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'

  const title = content.title || 'Про нас'
  const subtitle = content.subtitle
  const text = content.text || company.description
  const layout = content.layout || 'text-only'
  const highlights = content.highlights || []

  const imageUrl = content.image
    ? `${apiUrl}${content.image}`
    : company.cover_image_url
      ? `${apiUrl}${company.cover_image_url}`
      : null

  return (
    <section className="py-16 md:py-24" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-6xl mx-auto px-4">
        {layout === 'text-only' && (
          <TextOnlyLayout
            title={title}
            subtitle={subtitle}
            text={text}
            highlights={highlights}
            theme={theme}
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
}

function TextOnlyLayout({ title, subtitle, text, highlights, theme }: LayoutProps) {
  return (
    <div className="max-w-3xl mx-auto text-center">
      <h2
        className="text-3xl md:text-4xl font-bold mb-4"
        style={{ fontFamily: 'var(--font-accent)', color: 'var(--color-text)' }}
      >
        {title}
      </h2>

      {subtitle && (
        <p className="text-lg mb-6" style={{ color: 'var(--color-primary-500)' }}>
          {subtitle}
        </p>
      )}

      {text && (
        <p
          className="text-lg leading-relaxed mb-8"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {text}
        </p>
      )}

      {highlights && highlights.length > 0 && (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 mt-12">
          {highlights.map((item, index) => {
            const IconComponent = iconMap[item.icon || 'star'] || Star
            return (
              <div
                key={index}
                className="p-6 text-center"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderRadius: theme.borderRadius.card,
                  boxShadow: theme.shadow.card,
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: 'var(--color-primary-100)' }}
                >
                  <IconComponent className="w-6 h-6" style={{ color: 'var(--color-primary-500)' }} />
                </div>
                <h4 className="font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                  {item.title}
                </h4>
                {item.description && (
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
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

function ImageLayout({ title, subtitle, text, highlights, theme, imageUrl, imagePosition }: LayoutProps) {
  const isLeft = imagePosition === 'left'

  return (
    <div className={`grid md:grid-cols-2 gap-12 items-center ${isLeft ? '' : 'md:[direction:rtl]'}`}>
      {/* Image */}
      <div className={isLeft ? '' : 'md:[direction:ltr]'}>
        {imageUrl ? (
          <div
            className="aspect-[4/3] overflow-hidden"
            style={{ borderRadius: theme.borderRadius.card }}
          >
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div
            className="aspect-[4/3] flex items-center justify-center"
            style={{
              borderRadius: theme.borderRadius.card,
              background: 'linear-gradient(135deg, var(--color-primary-100), var(--color-secondary-100))',
            }}
          >
            <User className="w-24 h-24" style={{ color: 'var(--color-primary-300)' }} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className={isLeft ? '' : 'md:[direction:ltr]'}>
        <h2
          className="text-3xl md:text-4xl font-bold mb-4"
          style={{ fontFamily: 'var(--font-accent)', color: 'var(--color-text)' }}
        >
          {title}
        </h2>

        {subtitle && (
          <p className="text-lg mb-4" style={{ color: 'var(--color-primary-500)' }}>
            {subtitle}
          </p>
        )}

        {text && (
          <p
            className="text-lg leading-relaxed mb-6"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {text}
          </p>
        )}

        {highlights && highlights.length > 0 && (
          <div className="space-y-4">
            {highlights.map((item, index) => {
              const IconComponent = iconMap[item.icon || 'star'] || Star
              return (
                <div key={index} className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: 'var(--color-primary-100)' }}
                  >
                    <IconComponent className="w-5 h-5" style={{ color: 'var(--color-primary-500)' }} />
                  </div>
                  <div>
                    <h4 className="font-semibold" style={{ color: 'var(--color-text)' }}>
                      {item.title}
                    </h4>
                    {item.description && (
                      <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
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
