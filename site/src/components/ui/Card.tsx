'use client'

import React from 'react'
import { IndustryTheme } from '@/lib/themes'

export interface CardProps {
  variant?: 'default' | 'elevated' | 'glass' | 'bordered'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  children: React.ReactNode
  className?: string
  theme?: IndustryTheme
  onClick?: () => void
  style?: React.CSSProperties
}

const paddingStyles = {
  none: '0',
  sm: '1rem',
  md: '1.5rem',
  lg: '2rem',
}

function getVariantStyles(variant: CardProps['variant'], theme?: IndustryTheme): React.CSSProperties {
  const borderRadius = theme?.borderRadius.card || '16px'

  switch (variant) {
    case 'elevated':
      return {
        backgroundColor: 'var(--color-surface)',
        borderRadius,
        boxShadow: theme?.shadow.card || '0 10px 40px rgba(0, 0, 0, 0.06)',
        border: 'none',
      }
    case 'glass':
      return {
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius,
        boxShadow: theme?.shadow.card || '0 10px 40px rgba(0, 0, 0, 0.06)',
        border: '1px solid var(--color-primary-100)',
      }
    case 'bordered':
      return {
        backgroundColor: 'var(--color-surface)',
        borderRadius,
        boxShadow: 'none',
        border: '1px solid var(--color-primary-200)',
      }
    case 'default':
    default:
      return {
        backgroundColor: 'var(--color-surface)',
        borderRadius,
        boxShadow: 'none',
        border: 'none',
      }
  }
}

export function Card({
  variant = 'default',
  padding = 'md',
  children,
  className = '',
  theme,
  onClick,
  style,
}: CardProps) {
  const variantStyle = getVariantStyles(variant, theme)

  const baseStyle: React.CSSProperties = {
    padding: paddingStyles[padding],
    transition: 'all 0.2s ease',
    cursor: onClick ? 'pointer' : 'default',
    ...variantStyle,
    ...style,
  }

  return (
    <div
      style={baseStyle}
      className={className}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  )
}

// Sub-components for structured cards
export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div style={{ marginBottom: '1rem' }} className={className}>
      {children}
    </div>
  )
}

export function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div style={{ marginTop: '1rem' }} className={className}>
      {children}
    </div>
  )
}

Card.Header = CardHeader
Card.Content = CardContent
Card.Footer = CardFooter
