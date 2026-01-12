'use client'

import { useState } from 'react'
import { Star, Quote, ChevronLeft, ChevronRight, User } from 'lucide-react'
import { Company } from '../types'
import { IndustryTheme } from '../types'

interface Testimonial {
  author: string
  text: string
  rating?: number
  date?: string
  avatar?: string
  role?: string
}

interface TestimonialsContent {
  title?: string
  subtitle?: string
  testimonials?: Testimonial[]
  layout?: 'carousel' | 'grid' | 'stacked'
}

interface Props {
  content: TestimonialsContent
  theme: IndustryTheme
  company: Company
  sectionIndex?: number
  isAltBackground?: boolean
}

const defaultTestimonials: Testimonial[] = [
  {
    author: 'Олена К.',
    text: 'Чудовий сервіс! Дуже задоволена результатом. Обов\'язково повернусь знову.',
    rating: 5,
  },
  {
    author: 'Марія П.',
    text: 'Професійний підхід та приємна атмосфера. Рекомендую всім!',
    rating: 5,
  },
  {
    author: 'Анна С.',
    text: 'Найкращий спеціаліст у місті. Завжди задоволена результатом.',
    rating: 5,
  },
]

export function TestimonialsSection({ content, theme, company, isAltBackground = true }: Props) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'

  const title = content.title || 'Відгуки клієнтів'
  const subtitle = content.subtitle
  const testimonials = content.testimonials?.length ? content.testimonials : defaultTestimonials
  const layout = content.layout || 'carousel'

  // Dynamic colors based on background
  const bgColor = isAltBackground ? 'var(--color-background-alt)' : 'var(--color-background)'
  const textColor = isAltBackground ? 'var(--color-text-on-alt)' : 'var(--color-text)'
  const textMutedColor = isAltBackground ? 'var(--color-text-muted-on-alt)' : 'var(--color-text-muted)'
  const surfaceColor = isAltBackground ? 'var(--color-surface-on-alt)' : 'var(--color-surface)'

  return (
    <section className="py-16 md:py-24" style={{ backgroundColor: bgColor }}>
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
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

        {/* Testimonials */}
        {layout === 'carousel' && (
          <CarouselLayout testimonials={testimonials} theme={theme} apiUrl={apiUrl} textColor={textColor} textMutedColor={textMutedColor} surfaceColor={surfaceColor} />
        )}

        {layout === 'grid' && (
          <GridLayout testimonials={testimonials} theme={theme} apiUrl={apiUrl} textColor={textColor} textMutedColor={textMutedColor} surfaceColor={surfaceColor} />
        )}

        {layout === 'stacked' && (
          <StackedLayout testimonials={testimonials} theme={theme} apiUrl={apiUrl} textColor={textColor} textMutedColor={textMutedColor} surfaceColor={surfaceColor} />
        )}
      </div>
    </section>
  )
}

interface LayoutProps {
  testimonials: Testimonial[]
  theme: IndustryTheme
  apiUrl: string
  textColor: string
  textMutedColor: string
  surfaceColor: string
}

function CarouselLayout({ testimonials, theme, apiUrl, textColor, textMutedColor, surfaceColor }: LayoutProps) {
  const [current, setCurrent] = useState(0)

  const next = () => setCurrent((c) => (c + 1) % testimonials.length)
  const prev = () => setCurrent((c) => (c - 1 + testimonials.length) % testimonials.length)

  const testimonial = testimonials[current]

  return (
    <div className="max-w-3xl mx-auto">
      <div
        className="p-8 md:p-12 text-center relative"
        style={{
          backgroundColor: surfaceColor,
          borderRadius: theme.borderRadius.card,
          boxShadow: theme.shadow.elevated,
        }}
      >
        {/* Quote icon */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: 'var(--color-primary-100)' }}
        >
          <Quote className="w-8 h-8" style={{ color: 'var(--color-primary-500)' }} />
        </div>

        {/* Rating */}
        {testimonial.rating && (
          <div className="flex items-center justify-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className="w-5 h-5"
                fill={i < testimonial.rating! ? 'var(--color-primary-500)' : 'transparent'}
                style={{ color: 'var(--color-primary-500)' }}
              />
            ))}
          </div>
        )}

        {/* Text */}
        <p
          className="text-xl md:text-2xl leading-relaxed mb-8"
          style={{ fontFamily: 'var(--font-accent)', color: textColor }}
        >
          "{testimonial.text}"
        </p>

        {/* Author */}
        <div className="flex items-center justify-center gap-4">
          {testimonial.avatar ? (
            <img
              src={testimonial.avatar.startsWith('http') ? testimonial.avatar : `${apiUrl}${testimonial.avatar}`}
              alt={testimonial.author}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-primary-100)' }}
            >
              <User className="w-6 h-6" style={{ color: 'var(--color-primary-500)' }} />
            </div>
          )}
          <div className="text-left">
            <p className="font-semibold" style={{ color: textColor }}>
              {testimonial.author}
            </p>
            {testimonial.role && (
              <p className="text-sm" style={{ color: textMutedColor }}>
                {testimonial.role}
              </p>
            )}
          </div>
        </div>

        {/* Navigation */}
        {testimonials.length > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={prev}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
              style={{ backgroundColor: 'var(--color-primary-100)' }}
            >
              <ChevronLeft className="w-5 h-5" style={{ color: 'var(--color-primary-500)' }} />
            </button>
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className="w-2 h-2 rounded-full transition-colors"
                  style={{
                    backgroundColor: i === current ? 'var(--color-primary-500)' : 'var(--color-primary-200)',
                  }}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
              style={{ backgroundColor: 'var(--color-primary-100)' }}
            >
              <ChevronRight className="w-5 h-5" style={{ color: 'var(--color-primary-500)' }} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function GridLayout({ testimonials, theme, apiUrl, textColor, textMutedColor, surfaceColor }: LayoutProps) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {testimonials.map((testimonial, index) => (
        <div
          key={index}
          className="p-6"
          style={{
            backgroundColor: surfaceColor,
            borderRadius: theme.borderRadius.card,
            boxShadow: theme.shadow.card,
          }}
        >
          {/* Rating */}
          {testimonial.rating && (
            <div className="flex items-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="w-4 h-4"
                  fill={i < testimonial.rating! ? 'var(--color-primary-500)' : 'transparent'}
                  style={{ color: 'var(--color-primary-500)' }}
                />
              ))}
            </div>
          )}

          {/* Text */}
          <p className="mb-4" style={{ color: textColor }}>
            "{testimonial.text}"
          </p>

          {/* Author */}
          <div className="flex items-center gap-3">
            {testimonial.avatar ? (
              <img
                src={testimonial.avatar.startsWith('http') ? testimonial.avatar : `${apiUrl}${testimonial.avatar}`}
                alt={testimonial.author}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-primary-100)' }}
              >
                <User className="w-5 h-5" style={{ color: 'var(--color-primary-500)' }} />
              </div>
            )}
            <div>
              <p className="font-semibold text-sm" style={{ color: textColor }}>
                {testimonial.author}
              </p>
              {testimonial.date && (
                <p className="text-xs" style={{ color: textMutedColor }}>
                  {testimonial.date}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function StackedLayout({ testimonials, theme, apiUrl, textColor, textMutedColor, surfaceColor }: LayoutProps) {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {testimonials.map((testimonial, index) => (
        <div
          key={index}
          className="p-6 flex gap-6"
          style={{
            backgroundColor: surfaceColor,
            borderRadius: theme.borderRadius.card,
            boxShadow: theme.shadow.card,
            borderLeft: '4px solid var(--color-primary-500)',
          }}
        >
          {/* Avatar */}
          {testimonial.avatar ? (
            <img
              src={testimonial.avatar.startsWith('http') ? testimonial.avatar : `${apiUrl}${testimonial.avatar}`}
              alt={testimonial.author}
              className="w-16 h-16 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--color-primary-100)' }}
            >
              <User className="w-8 h-8" style={{ color: 'var(--color-primary-500)' }} />
            </div>
          )}

          <div>
            {/* Rating */}
            {testimonial.rating && (
              <div className="flex items-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4"
                    fill={i < testimonial.rating! ? 'var(--color-primary-500)' : 'transparent'}
                    style={{ color: 'var(--color-primary-500)' }}
                  />
                ))}
              </div>
            )}

            {/* Text */}
            <p className="mb-3" style={{ color: textColor }}>
              "{testimonial.text}"
            </p>

            {/* Author */}
            <p className="font-semibold text-sm" style={{ color: 'var(--color-primary-500)' }}>
              {testimonial.author}
              {testimonial.date && (
                <span style={{ color: textMutedColor }}> · {testimonial.date}</span>
              )}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
