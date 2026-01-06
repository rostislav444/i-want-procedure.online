'use client'

import { MessageCircle, Phone, ArrowRight, Sparkles, Star } from 'lucide-react'
import { Company } from '@/lib/api'
import { IndustryTheme } from '@/lib/themes'

interface HeroContent {
  title?: string
  subtitle?: string
  background_image?: string
  cta_text?: string
  cta_link?: string
  style?: 'minimal' | 'gradient' | 'image-bg' | 'split' | 'modern' | 'asymmetric'
}

interface Props {
  content: HeroContent
  theme: IndustryTheme
  company: Company
}

export function HeroSection({ content, theme, company }: Props) {
  const style = content.style || 'modern'
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'

  // Generate Telegram bot link with company slug
  const telegramBotLink = `https://t.me/i_want_procedure_bot?start=${company.slug || company.id}`
  const ctaLink = content.cta_link || telegramBotLink
  const ctaText = content.cta_text || 'Записатися онлайн'
  const title = content.title || company.name
  const subtitle = content.subtitle || company.description || company.specialization

  // Modern asymmetric hero - default for cosmetology
  if (style === 'modern' || style === 'asymmetric') {
    return (
      <ModernHero
        title={title}
        subtitle={subtitle}
        ctaText={ctaText}
        ctaLink={ctaLink}
        theme={theme}
        company={company}
        apiUrl={apiUrl}
      />
    )
  }

  // Gradient hero
  if (style === 'gradient') {
    return (
      <GradientHero
        title={title}
        subtitle={subtitle}
        ctaText={ctaText}
        ctaLink={ctaLink}
        theme={theme}
        company={company}
      />
    )
  }

  // Minimal hero
  if (style === 'minimal') {
    return (
      <MinimalHero
        title={title}
        subtitle={subtitle}
        ctaText={ctaText}
        ctaLink={ctaLink}
        theme={theme}
        company={company}
      />
    )
  }

  // Default to modern
  return (
    <ModernHero
      title={title}
      subtitle={subtitle}
      ctaText={ctaText}
      ctaLink={ctaLink}
      theme={theme}
      company={company}
      apiUrl={apiUrl}
    />
  )
}

interface HeroVariantProps {
  title: string
  subtitle?: string
  ctaText: string
  ctaLink: string
  theme: IndustryTheme
  company: Company
  apiUrl?: string
}

// Modern Asymmetric Hero - Premium cosmetology design
function ModernHero({ title, subtitle, ctaText, ctaLink, theme, company, apiUrl }: HeroVariantProps) {
  const coverImage = company.cover_image_url
    ? `${apiUrl}${company.cover_image_url}`
    : null

  const logoImage = company.logo_url
    ? `${apiUrl}${company.logo_url}`
    : null

  return (
    <section
      className="min-h-screen relative overflow-hidden"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large gradient circle */}
        <div
          className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'linear-gradient(135deg, var(--color-primary-200), var(--color-secondary-200))' }}
        />
        {/* Small accent circle */}
        <div
          className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] rounded-full opacity-10 blur-2xl"
          style={{ backgroundColor: 'var(--color-primary-300)' }}
        />
      </div>

      {/* Main content grid */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-8 min-h-screen items-center py-20">

          {/* Left content - 5 columns */}
          <div className="lg:col-span-5 space-y-8">
            {/* Logo & Badge */}
            <div className="flex items-center gap-4">
              {logoImage && (
                <img
                  src={logoImage}
                  alt={company.name}
                  className="w-12 h-12 rounded-2xl object-cover"
                  style={{ boxShadow: 'var(--shadow-card)' }}
                />
              )}
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: 'var(--color-primary-100)',
                  color: 'var(--color-primary-700)',
                }}
              >
                <Sparkles className="w-4 h-4" />
                <span>{company.specialization || 'Косметологія'}</span>
              </div>
            </div>

            {/* Main title */}
            <div className="space-y-4">
              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight"
                style={{
                  fontFamily: 'var(--font-accent)',
                  color: 'var(--color-text)',
                }}
              >
                {title}
              </h1>
              {subtitle && (
                <p
                  className="text-lg lg:text-xl leading-relaxed max-w-md"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {subtitle}
                </p>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <a
                href={ctaLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-8 py-4 font-semibold transition-all hover:scale-105 hover:shadow-xl"
                style={{
                  backgroundColor: 'var(--color-primary-500)',
                  color: 'var(--color-primary-contrast)',
                  borderRadius: theme.borderRadius.button,
                  boxShadow: '0 10px 40px -10px var(--color-primary-500)',
                }}
              >
                <MessageCircle className="w-5 h-5" />
                {ctaText}
                <ArrowRight className="w-4 h-4" />
              </a>

              {company.phone && (
                <a
                  href={`tel:${company.phone}`}
                  className="inline-flex items-center gap-3 px-8 py-4 font-semibold transition-all hover:scale-105"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text)',
                    borderRadius: theme.borderRadius.button,
                    border: '2px solid var(--color-surface-border)',
                  }}
                >
                  <Phone className="w-5 h-5" style={{ color: 'var(--color-primary-500)' }} />
                  {company.phone}
                </a>
              )}
            </div>

            {/* Trust indicators */}
            <div className="flex items-center gap-6 pt-4">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-medium"
                      style={{
                        backgroundColor: 'var(--color-primary-100)',
                        borderColor: 'var(--color-background)',
                        color: 'var(--color-primary-600)',
                      }}
                    >
                      {['👩', '👱‍♀️', '👩‍🦰', '👧'][i]}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>500+</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>задоволених клієнтів</p>
                </div>
              </div>

              <div className="h-8 w-px" style={{ backgroundColor: 'var(--color-surface-border)' }} />

              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-current" style={{ color: 'var(--color-primary-500)' }} />
                <span className="font-semibold" style={{ color: 'var(--color-text)' }}>4.9</span>
                <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>рейтинг</span>
              </div>
            </div>
          </div>

          {/* Right side - Image composition - 7 columns */}
          <div className="lg:col-span-7 relative">
            <div className="relative aspect-[4/3] lg:aspect-auto lg:h-[600px]">
              {/* Main image */}
              {coverImage ? (
                <div
                  className="absolute inset-0 rounded-3xl overflow-hidden"
                  style={{ boxShadow: 'var(--shadow-elevated)' }}
                >
                  <img
                    src={coverImage}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                  {/* Gradient overlay */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(135deg, var(--color-primary-500) 0%, transparent 50%)',
                      opacity: 0.1,
                    }}
                  />
                </div>
              ) : (
                // Placeholder with gradient
                <div
                  className="absolute inset-0 rounded-3xl"
                  style={{
                    background: 'linear-gradient(135deg, var(--color-primary-100), var(--color-secondary-100))',
                  }}
                />
              )}

              {/* Floating card - Services preview */}
              <div
                className="absolute -bottom-6 -left-6 p-6 rounded-2xl backdrop-blur-sm max-w-xs"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  boxShadow: 'var(--shadow-elevated)',
                  border: '1px solid var(--color-surface-border)',
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-primary-100)' }}
                  >
                    <Sparkles className="w-5 h-5" style={{ color: 'var(--color-primary-500)' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                      Професійний догляд
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      Індивідуальний підхід
                    </p>
                  </div>
                </div>
                <div
                  className="h-1 rounded-full"
                  style={{
                    background: 'linear-gradient(to right, var(--color-primary-500), var(--color-secondary-500))',
                  }}
                />
              </div>

              {/* Floating badge - top right */}
              <div
                className="absolute -top-4 -right-4 px-6 py-3 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500))',
                  boxShadow: '0 10px 40px -10px var(--color-primary-500)',
                }}
              >
                <p className="text-white font-semibold text-sm">✨ Новий клієнт -10%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave transition to next section */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path
            d="M0 100V50C360 80 720 20 1080 50C1260 65 1380 75 1440 70V100H0Z"
            style={{ fill: 'var(--color-background-alt)' }}
          />
        </svg>
      </div>
    </section>
  )
}

// Gradient Hero - for vibrant brands
function GradientHero({ title, subtitle, ctaText, ctaLink, theme, company }: HeroVariantProps) {
  const telegramBotLink = `https://t.me/i_want_procedure_bot?start=${company.slug || company.id}`
  const finalCtaLink = ctaLink || telegramBotLink

  return (
    <section
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500))',
      }}
    >
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse opacity-30 bg-white" />
        <div className="absolute -bottom-1/4 -left-1/4 w-80 h-80 rounded-full blur-3xl animate-pulse opacity-20 bg-white" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto py-20">
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium mb-6"
        >
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
            href={finalCtaLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white font-semibold hover:scale-105 transition-transform shadow-xl"
            style={{
              color: 'var(--color-primary-600)',
              borderRadius: theme.borderRadius.button,
            }}
          >
            <MessageCircle className="w-5 h-5" />
            {ctaText}
            <ArrowRight className="w-4 h-4" />
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
        <svg viewBox="0 0 1440 120" fill="none" className="w-full">
          <path
            d="M0 120V60C240 90 480 100 720 80C960 60 1200 30 1440 40V120H0Z"
            style={{ fill: 'var(--color-background)' }}
          />
        </svg>
      </div>
    </section>
  )
}

// Minimal Hero - clean and elegant
function MinimalHero({ title, subtitle, ctaText, ctaLink, theme, company }: HeroVariantProps) {
  const telegramBotLink = `https://t.me/i_want_procedure_bot?start=${company.slug || company.id}`
  const finalCtaLink = ctaLink || telegramBotLink

  return (
    <section
      className="min-h-[80vh] flex items-center py-20"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
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
          style={{
            fontFamily: 'var(--font-accent)',
            color: 'var(--color-text)',
          }}
        >
          {title}
        </h1>

        {subtitle && (
          <p
            className="text-lg md:text-xl mb-8 max-w-2xl mx-auto"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {subtitle}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href={finalCtaLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 font-semibold hover:opacity-90 transition-opacity"
            style={{
              backgroundColor: 'var(--color-primary-500)',
              color: 'var(--color-primary-contrast)',
              borderRadius: theme.borderRadius.button,
            }}
          >
            <MessageCircle className="w-5 h-5" />
            {ctaText}
            <ArrowRight className="w-4 h-4" />
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
      </div>
    </section>
  )
}
