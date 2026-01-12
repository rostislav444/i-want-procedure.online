'use client'

import { MessageCircle, Phone, ArrowRight, Sparkles, Star } from 'lucide-react'
import { Company } from '../types'
import { IndustryTheme } from '../types'

// Background settings types
type HeroBackgroundMode = 'image' | 'primary' | 'secondary' | 'background'
type HeroGradientType = 'none' | 'top-bottom' | 'bottom-top' | 'left-right' | 'right-left' | 'perimeter' | 'vignette' | 'vignette-inverse'
type HeroGradientColor = 'black' | 'white' | 'primary' | 'secondary' | 'background'

interface HeroContent {
  title?: string
  subtitle?: string
  image?: string // For split hero - person/product image
  background_image?: string // For elegant hero - background image
  cta_text?: string
  cta_link?: string
  style?: 'minimal' | 'gradient' | 'image-bg' | 'split' | 'modern' | 'asymmetric' | 'stats' | 'cards' | 'testimonial' | 'elegant'
  // Stats content
  stats?: Array<{ value: string; label: string }>
  // Testimonial content
  testimonial?: { text: string; author: string; role?: string }
  // Background settings
  background_mode?: HeroBackgroundMode
  gradient_type?: HeroGradientType
  gradient_color?: HeroGradientColor
  overlay_enabled?: boolean
  overlay_opacity?: number
}

// Helper to get CSS color for gradient based on color type
function getGradientColorValue(colorType: HeroGradientColor, opacity: number): string {
  const alpha = opacity / 100
  switch (colorType) {
    case 'black':
      return `rgba(0,0,0,${alpha})`
    case 'white':
      return `rgba(255,255,255,${alpha})`
    case 'primary':
      // Using color-mix for CSS variable with opacity
      return `color-mix(in srgb, var(--color-primary-500) ${opacity}%, transparent)`
    case 'secondary':
      return `color-mix(in srgb, var(--color-secondary-500) ${opacity}%, transparent)`
    case 'background':
      return `color-mix(in srgb, var(--color-background) ${opacity}%, transparent)`
    default:
      return `rgba(0,0,0,${alpha})`
  }
}

// Helper function to generate gradient CSS based on type and color
function getGradientStyle(type: HeroGradientType, opacity: number = 40, colorType: HeroGradientColor = 'black'): string {
  const color = getGradientColorValue(colorType, opacity)
  const transparent = 'transparent'

  switch (type) {
    case 'top-bottom':
      return `linear-gradient(to bottom, ${color} 0%, ${transparent} 50%, ${transparent} 100%)`
    case 'bottom-top':
      return `linear-gradient(to top, ${color} 0%, ${transparent} 50%, ${transparent} 100%)`
    case 'left-right':
      return `linear-gradient(to right, ${color} 0%, ${transparent} 50%, ${transparent} 100%)`
    case 'right-left':
      return `linear-gradient(to left, ${color} 0%, ${transparent} 50%, ${transparent} 100%)`
    case 'perimeter':
      return `linear-gradient(to bottom, ${color} 0%, ${transparent} 30%, ${transparent} 70%, ${color} 100%)`
    case 'vignette':
      return `radial-gradient(ellipse at center, ${transparent} 0%, ${color} 100%)`
    case 'vignette-inverse':
      return `radial-gradient(ellipse at center, ${color} 0%, ${transparent} 70%)`
    default:
      return 'none'
  }
}

// Helper to get background color based on mode
function getBackgroundByMode(mode: HeroBackgroundMode): string {
  switch (mode) {
    case 'primary':
      return 'var(--color-primary-500)'
    case 'secondary':
      return 'var(--color-secondary-500)'
    case 'background':
      return 'var(--color-background)'
    default:
      return 'var(--color-background)'
  }
}

interface Props {
  content: HeroContent
  theme: IndustryTheme
  company: Company
  sectionIndex?: number
  isAltBackground?: boolean
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

  // Background settings
  const backgroundMode = content.background_mode || 'image'
  const gradientType = content.gradient_type || 'none'
  const gradientColor = content.gradient_color || 'black'
  const overlayEnabled = content.overlay_enabled ?? true
  const overlayOpacity = content.overlay_opacity ?? 40

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
        image={content.image}
        backgroundMode={backgroundMode}
        gradientType={gradientType}
        gradientColor={gradientColor}
        overlayEnabled={overlayEnabled}
        overlayOpacity={overlayOpacity}
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
        apiUrl={apiUrl}
        backgroundImage={content.background_image}
        backgroundMode={backgroundMode}
        gradientType={gradientType}
        gradientColor={gradientColor}
        overlayEnabled={overlayEnabled}
        overlayOpacity={overlayOpacity}
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

  // Split hero - 50/50 layout
  if (style === 'split') {
    return (
      <SplitHero
        title={title}
        subtitle={subtitle}
        ctaText={ctaText}
        ctaLink={ctaLink}
        theme={theme}
        company={company}
        apiUrl={apiUrl}
        image={content.image}
        backgroundMode={backgroundMode}
        gradientType={gradientType}
        gradientColor={gradientColor}
        overlayEnabled={overlayEnabled}
        overlayOpacity={overlayOpacity}
      />
    )
  }

  // Stats hero - with big numbers
  if (style === 'stats') {
    return (
      <StatsHero
        title={title}
        subtitle={subtitle}
        ctaText={ctaText}
        ctaLink={ctaLink}
        theme={theme}
        company={company}
        apiUrl={apiUrl}
        backgroundImage={content.background_image}
        backgroundMode={backgroundMode}
        gradientType={gradientType}
        gradientColor={gradientColor}
        overlayEnabled={overlayEnabled}
        overlayOpacity={overlayOpacity}
        stats={content.stats}
      />
    )
  }

  // Cards hero - with floating service cards
  if (style === 'cards') {
    return (
      <CardsHero
        title={title}
        subtitle={subtitle}
        ctaText={ctaText}
        ctaLink={ctaLink}
        theme={theme}
        company={company}
        apiUrl={apiUrl}
        backgroundImage={content.background_image}
        backgroundMode={backgroundMode}
        gradientType={gradientType}
        gradientColor={gradientColor}
        overlayEnabled={overlayEnabled}
        overlayOpacity={overlayOpacity}
      />
    )
  }

  // Testimonial hero - with customer review
  if (style === 'testimonial') {
    return (
      <TestimonialHero
        title={title}
        subtitle={subtitle}
        ctaText={ctaText}
        ctaLink={ctaLink}
        theme={theme}
        company={company}
        apiUrl={apiUrl}
        backgroundImage={content.background_image}
        backgroundMode={backgroundMode}
        gradientType={gradientType}
        gradientColor={gradientColor}
        overlayEnabled={overlayEnabled}
        overlayOpacity={overlayOpacity}
        testimonial={content.testimonial}
      />
    )
  }

  // Elegant hero - luxury feel
  if (style === 'elegant') {
    return (
      <ElegantHero
        title={title}
        subtitle={subtitle}
        ctaText={ctaText}
        ctaLink={ctaLink}
        theme={theme}
        company={company}
        apiUrl={apiUrl}
        backgroundImage={content.background_image}
        backgroundMode={backgroundMode}
        gradientType={gradientType}
        gradientColor={gradientColor}
        overlayEnabled={overlayEnabled}
        overlayOpacity={overlayOpacity}
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
      image={content.image}
      backgroundMode={backgroundMode}
      gradientType={gradientType}
      gradientColor={gradientColor}
      overlayEnabled={overlayEnabled}
      overlayOpacity={overlayOpacity}
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
  image?: string // For split hero - person/product image
  backgroundImage?: string // For elegant hero - background image
  // Background settings
  backgroundMode?: HeroBackgroundMode
  gradientType?: HeroGradientType
  gradientColor?: HeroGradientColor
  overlayEnabled?: boolean
  overlayOpacity?: number
}

// Modern Asymmetric Hero - Premium cosmetology design
function ModernHero({ title, subtitle, ctaText, ctaLink, theme, company, apiUrl, image }: HeroVariantProps) {
  // Use provided image first, then fall back to company cover image
  const coverImage = image
    ? (image.startsWith('http') ? image : `${apiUrl}${image}`)
    : company.cover_image_url
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

    </section>
  )
}

// Gradient Hero - for vibrant brands
function GradientHero({ title, subtitle, ctaText, ctaLink, theme, company, apiUrl, backgroundImage }: HeroVariantProps) {
  const telegramBotLink = `https://t.me/i_want_procedure_bot?start=${company.slug || company.id}`
  const finalCtaLink = ctaLink || telegramBotLink
  const bgImage = backgroundImage
    ? (backgroundImage.startsWith('http') ? backgroundImage : `${apiUrl}${backgroundImage}`)
    : null

  return (
    <section
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500))',
      }}
    >
      {/* Background image with gradient overlay */}
      {bgImage && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${bgImage})` }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary-500) 0%, var(--color-secondary-500) 100%)',
              opacity: 0.85,
            }}
          />
        </>
      )}
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

// Split Hero - 50/50 image and text
function SplitHero({ title, subtitle, ctaText, ctaLink, theme, company, apiUrl, image }: HeroVariantProps) {
  // Use provided image first, then fall back to company cover image
  const coverImage = image
    ? (image.startsWith('http') ? image : `${apiUrl}${image}`)
    : company.cover_image_url
      ? `${apiUrl}${company.cover_image_url}`
      : null

  return (
    <section className="min-h-screen grid lg:grid-cols-2" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Left - Content */}
      <div className="flex items-center justify-center p-8 lg:p-16">
        <div className="max-w-lg">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6"
            style={{
              backgroundColor: 'var(--color-primary-100)',
              color: 'var(--color-primary-700)',
            }}
          >
            <Sparkles className="w-4 h-4" />
            <span>{company.specialization || 'Косметологія'}</span>
          </div>

          <h1
            className="text-4xl lg:text-5xl xl:text-6xl font-bold mb-6"
            style={{ fontFamily: 'var(--font-accent)', color: 'var(--color-text)' }}
          >
            {title}
          </h1>

          {subtitle && (
            <p className="text-lg mb-8" style={{ color: 'var(--color-text-muted)' }}>
              {subtitle}
            </p>
          )}

          <div className="flex flex-wrap gap-4">
            <a
              href={ctaLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 font-semibold transition-all hover:scale-105"
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
                className="inline-flex items-center gap-2 px-8 py-4 font-semibold"
                style={{
                  color: 'var(--color-text)',
                  border: '2px solid var(--color-surface-border)',
                  borderRadius: theme.borderRadius.button,
                }}
              >
                <Phone className="w-5 h-5" style={{ color: 'var(--color-primary-500)' }} />
                {company.phone}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Right - Image */}
      <div className="relative min-h-[50vh] lg:min-h-screen">
        {coverImage ? (
          <img src={coverImage} alt={title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, var(--color-primary-200), var(--color-secondary-200))' }}
          />
        )}
        {/* Overlay with brand color */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to right, var(--color-background), transparent 30%)' }}
        />
      </div>
    </section>
  )
}

// Stats Hero - with prominent statistics
interface StatsHeroProps extends HeroVariantProps {
  stats?: Array<{ value: string; label: string }>
}

function StatsHero({ title, subtitle, ctaText, ctaLink, theme, company, apiUrl, backgroundImage, backgroundMode = 'image', gradientType = 'none', gradientColor = 'black', overlayEnabled = true, overlayOpacity = 40, stats }: StatsHeroProps) {
  const defaultStats = [
    { value: '500+', label: 'Задоволених клієнтів' },
    { value: '10+', label: 'Років досвіду' },
    { value: '4.9', label: 'Рейтинг Google' },
    { value: '50+', label: 'Видів послуг' },
  ]

  const displayStats = stats || defaultStats
  const bgImage = backgroundImage
    ? (backgroundImage.startsWith('http') ? backgroundImage : `${apiUrl}${backgroundImage}`)
    : null

  const showImage = backgroundMode === 'image' && bgImage
  const solidBgColor = backgroundMode !== 'image' ? getBackgroundByMode(backgroundMode) : 'var(--color-background)'

  return (
    <section className="min-h-screen flex items-center py-20 relative overflow-hidden" style={{ backgroundColor: solidBgColor }}>
      {/* Background image */}
      {showImage && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
      )}
      {/* Gradient overlay */}
      {overlayEnabled && gradientType !== 'none' && (
        <div
          className="absolute inset-0"
          style={{ background: getGradientStyle(gradientType, overlayOpacity, gradientColor) }}
        />
      )}
      {/* Default overlay for image mode - use selected gradient color */}
      {showImage && overlayEnabled && gradientType === 'none' && (
        <div
          className="absolute inset-0"
          style={{
            background: getGradientStyle('perimeter', overlayOpacity, gradientColor),
          }}
        />
      )}
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6"
            style={{ backgroundColor: 'var(--color-primary-100)', color: 'var(--color-primary-700)' }}
          >
            <Sparkles className="w-4 h-4" />
            <span>{company.specialization || 'Косметологія'}</span>
          </div>

          <h1
            className="text-4xl md:text-6xl font-bold mb-6"
            style={{ fontFamily: 'var(--font-accent)', color: 'var(--color-text)' }}
          >
            {title}
          </h1>

          {subtitle && (
            <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8" style={{ color: 'var(--color-text-muted)' }}>
              {subtitle}
            </p>
          )}

          <a
            href={ctaLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 font-semibold transition-all hover:scale-105"
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
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {displayStats.map((stat, index) => (
            <div
              key={index}
              className="text-center p-6 rounded-2xl"
              style={{ backgroundColor: 'var(--color-surface)', boxShadow: 'var(--shadow-card)' }}
            >
              <div
                className="text-4xl md:text-5xl font-bold mb-2"
                style={{ color: 'var(--color-primary-500)' }}
              >
                {stat.value}
              </div>
              <div style={{ color: 'var(--color-text-muted)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Cards Hero - with floating service cards
function CardsHero({ title, subtitle, ctaText, ctaLink, theme, company, apiUrl, backgroundImage, backgroundMode = 'image', gradientType = 'none', gradientColor = 'black', overlayEnabled = true, overlayOpacity = 40 }: HeroVariantProps) {
  const services = [
    { name: 'Чистка обличчя', price: 'від 800 ₴', icon: '✨' },
    { name: 'Мезотерапія', price: 'від 1500 ₴', icon: '💉' },
    { name: 'Пілінг', price: 'від 600 ₴', icon: '🌸' },
  ]

  const bgImage = backgroundImage
    ? (backgroundImage.startsWith('http') ? backgroundImage : `${apiUrl}${backgroundImage}`)
    : null

  const showImage = backgroundMode === 'image' && bgImage
  const solidBgColor = backgroundMode !== 'image' ? getBackgroundByMode(backgroundMode) : 'var(--color-background)'

  return (
    <section className="min-h-screen relative overflow-hidden py-20" style={{ backgroundColor: solidBgColor }}>
      {/* Background image */}
      {showImage && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
      )}
      {/* Gradient overlay */}
      {overlayEnabled && gradientType !== 'none' && (
        <div
          className="absolute inset-0"
          style={{ background: getGradientStyle(gradientType, overlayOpacity, gradientColor) }}
        />
      )}
      {/* Default overlay for image mode - use selected gradient color */}
      {showImage && overlayEnabled && gradientType === 'none' && (
        <div
          className="absolute inset-0"
          style={{
            background: getGradientStyle('perimeter', overlayOpacity, gradientColor),
          }}
        />
      )}
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Content */}
          <div>
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6"
              style={{ backgroundColor: 'var(--color-primary-100)', color: 'var(--color-primary-700)' }}
            >
              <Sparkles className="w-4 h-4" />
              <span>{company.specialization || 'Косметологія'}</span>
            </div>

            <h1
              className="text-4xl lg:text-5xl font-bold mb-6"
              style={{ fontFamily: 'var(--font-accent)', color: 'var(--color-text)' }}
            >
              {title}
            </h1>

            {subtitle && (
              <p className="text-lg mb-8" style={{ color: 'var(--color-text-muted)' }}>
                {subtitle}
              </p>
            )}

            <a
              href={ctaLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 font-semibold transition-all hover:scale-105"
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
          </div>

          {/* Right - Floating Cards */}
          <div className="relative h-[400px] lg:h-[500px]">
            {services.map((service, index) => (
              <div
                key={index}
                className="absolute p-6 rounded-2xl backdrop-blur-sm transition-transform hover:scale-105"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  boxShadow: 'var(--shadow-elevated)',
                  top: `${index * 25}%`,
                  left: `${index * 15}%`,
                  transform: `rotate(${(index - 1) * 3}deg)`,
                  zIndex: services.length - index,
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: 'var(--color-primary-100)' }}
                  >
                    {service.icon}
                  </div>
                  <div>
                    <div className="font-semibold" style={{ color: 'var(--color-text)' }}>{service.name}</div>
                    <div style={{ color: 'var(--color-primary-500)' }}>{service.price}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// Testimonial Hero - with customer review
interface TestimonialHeroProps extends HeroVariantProps {
  testimonial?: { text: string; author: string; role?: string }
}

function TestimonialHero({ title, subtitle, ctaText, ctaLink, theme, company, apiUrl, backgroundImage, backgroundMode = 'image', gradientType = 'none', gradientColor = 'black', overlayEnabled = true, overlayOpacity = 40, testimonial }: TestimonialHeroProps) {
  const defaultTestimonial = {
    text: 'Найкращий салон, в якому я була! Професійний підхід, затишна атмосфера та чудовий результат.',
    author: 'Олена К.',
    role: 'Постійна клієнтка',
  }

  const review = testimonial || defaultTestimonial
  const bgImage = backgroundImage
    ? (backgroundImage.startsWith('http') ? backgroundImage : `${apiUrl}${backgroundImage}`)
    : null

  const showImage = backgroundMode === 'image' && bgImage
  const solidBgColor = backgroundMode !== 'image' ? getBackgroundByMode(backgroundMode) : 'var(--color-background)'

  return (
    <section className="min-h-screen flex items-center py-20 relative overflow-hidden" style={{ backgroundColor: solidBgColor }}>
      {/* Background image */}
      {showImage && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
      )}
      {/* Gradient overlay */}
      {overlayEnabled && gradientType !== 'none' && (
        <div
          className="absolute inset-0"
          style={{ background: getGradientStyle(gradientType, overlayOpacity, gradientColor) }}
        />
      )}
      {/* Default overlay for image mode - use selected gradient color */}
      {showImage && overlayEnabled && gradientType === 'none' && (
        <div
          className="absolute inset-0"
          style={{
            background: getGradientStyle('perimeter', overlayOpacity, gradientColor),
          }}
        />
      )}
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Main content */}
          <div>
            <h1
              className="text-4xl lg:text-5xl font-bold mb-6"
              style={{ fontFamily: 'var(--font-accent)', color: 'var(--color-text)' }}
            >
              {title}
            </h1>

            {subtitle && (
              <p className="text-lg mb-8" style={{ color: 'var(--color-text-muted)' }}>
                {subtitle}
              </p>
            )}

            <a
              href={ctaLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 font-semibold transition-all hover:scale-105"
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
          </div>

          {/* Right - Testimonial card */}
          <div
            className="relative p-8 rounded-3xl"
            style={{
              backgroundColor: 'var(--color-surface)',
              boxShadow: 'var(--shadow-elevated)',
            }}
          >
            {/* Quote marks */}
            <div
              className="absolute -top-4 -left-4 w-12 h-12 rounded-full flex items-center justify-center text-2xl"
              style={{ backgroundColor: 'var(--color-primary-500)' }}
            >
              <span className="text-white">"</span>
            </div>

            {/* Stars */}
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-current" style={{ color: 'var(--color-primary-500)' }} />
              ))}
            </div>

            <p className="text-lg mb-6" style={{ color: 'var(--color-text)' }}>
              {review.text}
            </p>

            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                style={{ backgroundColor: 'var(--color-primary-100)', color: 'var(--color-primary-600)' }}
              >
                {review.author[0]}
              </div>
              <div>
                <div className="font-semibold" style={{ color: 'var(--color-text)' }}>{review.author}</div>
                {review.role && (
                  <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{review.role}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Elegant Hero - luxury minimalist design
function ElegantHero({ title, subtitle, ctaText, ctaLink, theme, company, apiUrl, backgroundImage, backgroundMode = 'image', gradientType = 'none', gradientColor = 'black', overlayEnabled = true, overlayOpacity = 40 }: HeroVariantProps) {
  const logoImage = company.logo_url ? `${apiUrl}${company.logo_url}` : null
  const bgImage = backgroundImage
    ? (backgroundImage.startsWith('http') ? backgroundImage : `${apiUrl}${backgroundImage}`)
    : null

  // Determine background style based on mode
  const showImage = backgroundMode === 'image' && bgImage
  const solidBgColor = backgroundMode !== 'image' ? getBackgroundByMode(backgroundMode) : 'var(--color-background)'

  return (
    <section
      className="min-h-screen flex items-center py-20 relative overflow-hidden"
      style={{ backgroundColor: solidBgColor }}
    >
      {/* Background image */}
      {showImage && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
      )}
      {/* Gradient overlay */}
      {overlayEnabled && gradientType !== 'none' && (
        <div
          className="absolute inset-0"
          style={{ background: getGradientStyle(gradientType, overlayOpacity, gradientColor) }}
        />
      )}
      {/* Default overlay for image mode - use selected gradient color */}
      {showImage && overlayEnabled && gradientType === 'none' && (
        <div
          className="absolute inset-0"
          style={{
            background: getGradientStyle('perimeter', overlayOpacity, gradientColor),
          }}
        />
      )}
      <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
        {/* Logo */}
        {logoImage && (
          <div className="mb-8">
            <img
              src={logoImage}
              alt={company.name}
              className="w-20 h-20 mx-auto rounded-2xl object-cover"
              style={{ boxShadow: 'var(--shadow-card)' }}
            />
          </div>
        )}

        {/* Decorative line */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="w-16 h-px" style={{ backgroundColor: 'var(--color-primary-300)' }} />
          <Sparkles className="w-4 h-4" style={{ color: 'var(--color-primary-500)' }} />
          <div className="w-16 h-px" style={{ backgroundColor: 'var(--color-primary-300)' }} />
        </div>

        <h1
          className="text-4xl md:text-6xl lg:text-7xl font-light mb-6 tracking-tight"
          style={{ fontFamily: 'var(--font-accent)', color: 'var(--color-text)' }}
        >
          {title}
        </h1>

        {subtitle && (
          <p
            className="text-lg md:text-xl max-w-2xl mx-auto mb-12 font-light"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {subtitle}
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={ctaLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-10 py-4 font-medium tracking-wide uppercase text-sm transition-all hover:scale-105"
            style={{
              backgroundColor: 'var(--color-primary-500)',
              color: 'var(--color-primary-contrast)',
              borderRadius: theme.borderRadius.button,
              letterSpacing: '0.1em',
            }}
          >
            {ctaText}
            <ArrowRight className="w-4 h-4" />
          </a>

          {company.phone && (
            <a
              href={`tel:${company.phone}`}
              className="inline-flex items-center gap-2 px-8 py-4 font-medium transition-colors"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <Phone className="w-4 h-4" />
              {company.phone}
            </a>
          )}
        </div>

        {/* Bottom decorative element */}
        <div className="mt-16 flex items-center justify-center gap-6">
          <div className="text-center">
            <div className="text-2xl font-light" style={{ color: 'var(--color-primary-500)' }}>10+</div>
            <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>років досвіду</div>
          </div>
          <div className="w-px h-8" style={{ backgroundColor: 'var(--color-surface-border)' }} />
          <div className="text-center">
            <div className="text-2xl font-light" style={{ color: 'var(--color-primary-500)' }}>500+</div>
            <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>клієнтів</div>
          </div>
          <div className="w-px h-8" style={{ backgroundColor: 'var(--color-surface-border)' }} />
          <div className="text-center">
            <div className="text-2xl font-light" style={{ color: 'var(--color-primary-500)' }}>4.9</div>
            <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>рейтинг</div>
          </div>
        </div>
      </div>
    </section>
  )
}
