'use client'

import { MessageCircle, Phone, ArrowRight } from 'lucide-react'
import { Company } from '@/lib/api'
import { IndustryTheme } from '@/lib/themes'

interface CTAContent {
  title?: string
  subtitle?: string
  button_text?: string
  button_link?: string
  secondary_button_text?: string
  secondary_button_link?: string
  background?: 'gradient' | 'solid' | 'image'
  background_image?: string
}

interface Props {
  content: CTAContent
  theme: IndustryTheme
  company: Company
}

export function CTASection({ content, theme, company }: Props) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'

  const title = content.title || 'Готові записатися?'
  const subtitle = content.subtitle || 'Зв\'яжіться з нами зараз і отримайте консультацію'
  const buttonText = content.button_text || 'Записатися'
  const buttonLink = content.button_link || (company.telegram ? `https://t.me/${company.telegram.replace('@', '')}` : '#')
  const secondaryButtonText = content.secondary_button_text
  const secondaryButtonLink = content.secondary_button_link || (company.phone ? `tel:${company.phone}` : undefined)
  const background = content.background || 'gradient'

  const backgroundImage = content.background_image
    ? `${apiUrl}${content.background_image}`
    : null

  return (
    <section
      className="py-16 md:py-24 relative overflow-hidden"
      style={getBackgroundStyle(background, backgroundImage)}
    >
      {/* Overlay for image background */}
      {background === 'image' && backgroundImage && (
        <div className="absolute inset-0 bg-black/60" />
      )}

      {/* Decorative elements for gradient */}
      {background === 'gradient' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-1/2 -right-1/4 w-96 h-96 rounded-full blur-3xl opacity-30"
            style={{ background: 'white' }}
          />
          <div
            className="absolute -bottom-1/4 -left-1/4 w-80 h-80 rounded-full blur-3xl opacity-20"
            style={{ background: 'white' }}
          />
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
        <h2
          className="text-3xl md:text-5xl font-bold mb-4"
          style={{
            fontFamily: 'var(--font-accent)',
            color: background === 'solid' ? 'var(--color-text)' : '#ffffff',
          }}
        >
          {title}
        </h2>

        <p
          className="text-lg md:text-xl mb-8 max-w-2xl mx-auto"
          style={{
            color: background === 'solid' ? 'var(--color-text-muted)' : 'rgba(255, 255, 255, 0.9)',
          }}
        >
          {subtitle}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href={buttonLink}
            className="inline-flex items-center gap-2 px-8 py-4 font-semibold transition-all hover:scale-105"
            style={{
              backgroundColor: background === 'solid' ? 'var(--color-primary-500)' : '#ffffff',
              color: background === 'solid' ? 'var(--color-primary-contrast)' : 'var(--color-primary-500)',
              borderRadius: theme.borderRadius.button,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            }}
          >
            <MessageCircle className="w-5 h-5" />
            {buttonText}
            <ArrowRight className="w-4 h-4" />
          </a>

          {secondaryButtonText && secondaryButtonLink && (
            <a
              href={secondaryButtonLink}
              className="inline-flex items-center gap-2 px-8 py-4 font-semibold transition-colors"
              style={{
                backgroundColor: background === 'solid' ? 'transparent' : 'rgba(255, 255, 255, 0.2)',
                color: background === 'solid' ? 'var(--color-primary-500)' : '#ffffff',
                border: background === 'solid' ? '2px solid var(--color-primary-500)' : '2px solid rgba(255, 255, 255, 0.5)',
                borderRadius: theme.borderRadius.button,
              }}
            >
              <Phone className="w-5 h-5" />
              {secondaryButtonText}
            </a>
          )}
        </div>
      </div>
    </section>
  )
}

function getBackgroundStyle(background: CTAContent['background'], imageUrl: string | null): React.CSSProperties {
  switch (background) {
    case 'gradient':
      return {
        background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500))',
      }
    case 'image':
      return imageUrl
        ? {
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }
        : {
            background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500))',
          }
    case 'solid':
    default:
      return {
        backgroundColor: 'var(--color-background-alt)',
      }
  }
}
