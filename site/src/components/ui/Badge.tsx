'use client'

import React from 'react'
import { IndustryTheme } from '@/lib/themes'

export interface BadgeProps {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'success' | 'warning'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  className?: string
  theme?: IndustryTheme
}

const sizeStyles = {
  sm: {
    padding: '0.25rem 0.5rem',
    fontSize: '0.75rem',
  },
  md: {
    padding: '0.375rem 0.75rem',
    fontSize: '0.875rem',
  },
  lg: {
    padding: '0.5rem 1rem',
    fontSize: '1rem',
  },
}

function getVariantStyles(variant: BadgeProps['variant'], theme?: IndustryTheme): React.CSSProperties {
  const borderRadius = theme?.borderRadius.base || '8px'

  switch (variant) {
    case 'primary':
      return {
        backgroundColor: 'var(--color-primary-100)',
        color: 'var(--color-primary-700)',
        borderRadius,
      }
    case 'secondary':
      return {
        backgroundColor: 'var(--color-secondary-100)',
        color: 'var(--color-secondary-700)',
        borderRadius,
      }
    case 'outline':
      return {
        backgroundColor: 'transparent',
        color: 'var(--color-primary-500)',
        border: '1px solid var(--color-primary-500)',
        borderRadius,
      }
    case 'success':
      return {
        backgroundColor: '#dcfce7',
        color: '#166534',
        borderRadius,
      }
    case 'warning':
      return {
        backgroundColor: '#fef3c7',
        color: '#92400e',
        borderRadius,
      }
    case 'default':
    default:
      return {
        backgroundColor: 'var(--color-background-alt)',
        color: 'var(--color-text)',
        borderRadius,
      }
  }
}

export function Badge({
  variant = 'default',
  size = 'md',
  children,
  className = '',
  theme,
}: BadgeProps) {
  const sizeStyle = sizeStyles[size]
  const variantStyle = getVariantStyles(variant, theme)

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: sizeStyle.padding,
    fontSize: sizeStyle.fontSize,
    fontWeight: 500,
    fontFamily: 'var(--font-body)',
    lineHeight: 1,
    whiteSpace: 'nowrap',
    ...variantStyle,
  }

  return (
    <span style={baseStyle} className={className}>
      {children}
    </span>
  )
}
