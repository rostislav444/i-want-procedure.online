'use client'

import { MessageCircle, Phone, Sparkles } from 'lucide-react'
import { Company } from '@/lib/api'
import { IndustryTheme } from '@/lib/themes'

interface HeroContent {
  title?: string
  subtitle?: string
  background_image?: string
  cta_text?: string
  cta_link?: string
  style?: 'minimal' | 'gradient' | 'image-bg' | 'split'
}

interface Props {
  content: HeroContent
  theme: IndustryTheme
  company: Company
}

export function HeroSection({ content, theme, company }: Props) {
  const style = content.style || theme.heroStyle
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'

  const ctaLink = content.cta_link || (company.telegram ? `https://t.me/${company.telegram.replace('@', '')}` : '#')
  const ctaText = content.cta_text || 'Записатися'
  const title = content.title || company.name
  const subtitle = content.subtitle || company.description || company.specialization

  switch (style) {
    case 'gradient':
      return <GradientHero title={title} subtitle={subtitle} ctaText={ctaText} ctaLink={ctaLink} theme={theme} company={company} />
    case 'minimal':
      return <MinimalHero title={title} subtitle={subtitle} ctaText={ctaText} ctaLink={ctaLink} theme={theme} company={company} />
    case 'image-bg':
      return <ImageBgHero title={title} subtitle={subtitle} ctaText={ctaText} ctaLink={ctaLink} theme={theme} company={company} backgroundImage={content.background_image} apiUrl={apiUrl} />
    case 'split':
      return <SplitHero title={title} subtitle={subtitle} ctaText={ctaText} ctaLink={ctaLink} theme={theme} company={company} backgroundImage={content.background_image} apiUrl={apiUrl} />
    default:
      return <GradientHero title={title} subtitle={subtitle} ctaText={ctaText} ctaLink={ctaLink} theme={theme} company={company} />
  }
}

interface HeroVariantProps {
  title: string
  subtitle?: string
  ctaText: string
  ctaLink: string
  theme: IndustryTheme
  company: Company
  backgroundImage?: string
  apiUrl?: string
}

// Gradient Hero - Cosmetology, Beauty themes
function GradientHero({ title, subtitle, ctaText, ctaLink, theme, company }: HeroVariantProps) {
  return (
    <section
      className="min-h-screen flex items-center justify-center relative overflow-hidden pt-16"
      style={{
        background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500))',
      }}
    >
      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-1/2 -right-1/4 w-96 h-96 rounded-full blur-3xl animate-float opacity-30"
          style={{ background: 'white' }}
        />
        <div
          className="absolute -bottom-1/4 -left-1/4 w-80 h-80 rounded-full blur-3xl animate-float opacity-20"
          style={{ background: 'white', animationDelay: '1s' }}
        />
        <div
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl animate-float opacity-20"
          style={{ background: 'var(--color-secondary-500)', animationDelay: '2s' }}
        />
      </div>

      <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          <span>{company.specialization || 'Професійні послуги'}</span>
        </div>

        <h1
          className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
          style={{ fontFamily: 'var(--font-accent)' }}
        >
          {title}
        </h1>

        {subtitle && (
          <p className="text-xl md:text-2xl opacity-90 mb-8 max-w-2xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href={ctaLink}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 font-semibold hover:scale-105 transition-transform shadow-xl"
            style={{ borderRadius: theme.borderRadius.button }}
          >
            <MessageCircle className="w-5 h-5" />
            {ctaText}
          </a>

          {company.phone && (
            <a
              href={`tel:${company.phone}`}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/20 backdrop-blur-sm text-white font-semibold hover:bg-white/30 transition-colors"
              style={{ borderRadius: theme.borderRadius.button }}
            >
              <Phone className="w-5 h-5" />
              {company.phone}
            </a>
          )}
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path
            d="M0 120V60C240 90 480 100 720 80C960 60 1200 30 1440 40V120H0Z"
            fill="var(--color-background)"
          />
        </svg>
      </div>
    </section>
  )
}

// Minimal Hero - Medical, Wellness themes
function MinimalHero({ title, subtitle, ctaText, ctaLink, theme, company }: HeroVariantProps) {
  return (
    <section className="min-h-[80vh] flex items-center pt-20" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-5xl mx-auto px-4 text-center">
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6"
          style={{
            backgroundColor: 'var(--color-primary-100)',
            color: 'var(--color-primary-700)',
          }}
        >
          <Sparkles className="w-4 h-4" />
          <span>{company.specialization || 'Професійні послуги'}</span>
        </div>

        <h1
          className="text-4xl md:text-6xl font-bold mb-6"
          style={{ fontFamily: 'var(--font-accent)', color: 'var(--color-text)' }}
        >
          {title}
        </h1>

        {subtitle && (
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto" style={{ color: 'var(--color-text-muted)' }}>
            {subtitle}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href={ctaLink}
            className="inline-flex items-center gap-2 px-8 py-4 font-semibold hover:opacity-90 transition-opacity"
            style={{
              backgroundColor: 'var(--color-primary-500)',
              color: 'var(--color-primary-contrast)',
              borderRadius: theme.borderRadius.button,
            }}
          >
            <MessageCircle className="w-5 h-5" />
            {ctaText}
          </a>

          {company.phone && (
            <a
              href={`tel:${company.phone}`}
              className="inline-flex items-center gap-2 px-8 py-4 font-semibold transition-colors"
              style={{
                color: 'var(--color-primary-500)',
                border: '2px solid var(--color-primary-500)',
                borderRadius: theme.borderRadius.button,
              }}
            >
              <Phone className="w-5 h-5" />
              {company.phone}
            </a>
          )}
        </div>

        {/* Trust badges for medical */}
        {theme.id === 'medical' && (
          <div className="flex items-center justify-center gap-6 mt-12 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Досвідчені спеціалісти
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Сучасне обладнання
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Гарантія якості
            </span>
          </div>
        )}
      </div>
    </section>
  )
}

// Image Background Hero - Massage theme
function ImageBgHero({ title, subtitle, ctaText, ctaLink, theme, company, backgroundImage, apiUrl }: HeroVariantProps) {
  const bgImage = backgroundImage
    ? `${apiUrl}${backgroundImage}`
    : company.cover_image_url
      ? `${apiUrl}${company.cover_image_url}`
      : null

  return (
    <section className="min-h-screen flex items-center relative overflow-hidden pt-16">
      {/* Background */}
      {bgImage ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500))' }}
        />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center text-white">
        <h1
          className="text-5xl md:text-7xl font-bold mb-6"
          style={{ fontFamily: 'var(--font-accent)' }}
        >
          {title}
        </h1>

        {subtitle && (
          <p className="text-xl md:text-2xl opacity-90 mb-8 max-w-2xl mx-auto">
            {subtitle}
          </p>
        )}

        <a
          href={ctaLink}
          className="inline-flex items-center gap-2 px-8 py-4 text-white font-semibold hover:opacity-90 transition-opacity border-2 border-white"
          style={{ borderRadius: theme.borderRadius.button }}
        >
          <MessageCircle className="w-5 h-5" />
          {ctaText}
        </a>
      </div>
    </section>
  )
}

// Split Hero - Sport theme
function SplitHero({ title, subtitle, ctaText, ctaLink, theme, company, backgroundImage, apiUrl }: HeroVariantProps) {
  const bgImage = backgroundImage
    ? `${apiUrl}${backgroundImage}`
    : company.cover_image_url
      ? `${apiUrl}${company.cover_image_url}`
      : null

  return (
    <section className="min-h-screen grid md:grid-cols-2 pt-16">
      {/* Left side - Content */}
      <div
        className="flex items-center p-8 md:p-16"
        style={{ background: 'var(--color-primary-500)' }}
      >
        <div className="text-white max-w-xl">
          <h1
            className="text-5xl md:text-7xl font-bold uppercase tracking-tight mb-6"
            style={{ fontFamily: 'var(--font-accent)' }}
          >
            {title}
          </h1>

          {subtitle && (
            <p className="text-xl mb-8 opacity-90">
              {subtitle}
            </p>
          )}

          <a
            href={ctaLink}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-bold uppercase tracking-wide hover:bg-yellow-400 transition-colors"
            style={{ borderRadius: theme.borderRadius.button }}
          >
            <MessageCircle className="w-5 h-5" />
            {ctaText}
          </a>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="relative overflow-hidden min-h-[50vh] md:min-h-full">
        {bgImage ? (
          <img
            src={bgImage}
            alt={title}
            className="w-full h-full object-cover"
            style={{
              clipPath: 'polygon(10% 0, 100% 0, 100% 100%, 0 100%)',
            }}
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500))',
              clipPath: 'polygon(10% 0, 100% 0, 100% 100%, 0 100%)',
            }}
          />
        )}
      </div>
    </section>
  )
}
