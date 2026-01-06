'use client'

import React from 'react'
import { IndustryTheme, getSectionSpacing } from '@/lib/themes'

export interface SectionProps {
  background?: 'default' | 'alt' | 'primary' | 'secondary' | 'gradient' | 'transparent'
  spacing?: 'none' | 'sm' | 'md' | 'lg'
  children: React.ReactNode
  className?: string
  theme?: IndustryTheme
  style?: React.CSSProperties
  id?: string
}

const spacingStyles = {
  none: { py: '0', px: '0' },
  sm: { py: '2rem', px: '1rem' },
  md: { py: '4rem', px: '1.5rem' },
  lg: { py: '6rem', px: '2rem' },
}

function getBackgroundStyles(background: SectionProps['background']): React.CSSProperties {
  switch (background) {
    case 'alt':
      return {
        backgroundColor: 'var(--color-background-alt)',
      }
    case 'primary':
      return {
        backgroundColor: 'var(--color-primary-500)',
        color: 'var(--color-primary-contrast)',
      }
    case 'secondary':
      return {
        backgroundColor: 'var(--color-secondary-500)',
        color: 'var(--color-secondary-contrast)',
      }
    case 'gradient':
      return {
        background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500))',
        color: 'var(--color-primary-contrast)',
      }
    case 'transparent':
      return {
        backgroundColor: 'transparent',
      }
    case 'default':
    default:
      return {
        backgroundColor: 'var(--color-background)',
      }
  }
}

export function Section({
  background = 'default',
  spacing = 'md',
  children,
  className = '',
  theme,
  style,
  id,
}: SectionProps) {
  // Use theme spacing if provided, otherwise use default
  const themeSpacing = theme ? getSectionSpacing(theme) : null
  const sectionSpacing = spacing === 'md' && themeSpacing ? themeSpacing : spacingStyles[spacing]

  const backgroundStyle = getBackgroundStyles(background)

  const baseStyle: React.CSSProperties = {
    paddingTop: sectionSpacing.py,
    paddingBottom: sectionSpacing.py,
    paddingLeft: sectionSpacing.px,
    paddingRight: sectionSpacing.px,
    position: 'relative',
    overflow: 'hidden',
    ...backgroundStyle,
    ...style,
  }

  return (
    <section id={id} style={baseStyle} className={className}>
      {children}
    </section>
  )
}
