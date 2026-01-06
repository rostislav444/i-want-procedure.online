'use client'

import React from 'react'

export interface TextProps {
  variant?: 'default' | 'muted' | 'small' | 'large' | 'lead'
  children: React.ReactNode
  className?: string
  centered?: boolean
  style?: React.CSSProperties
  as?: 'p' | 'span' | 'div'
}

const variantStyles = {
  default: {
    fontSize: '1rem',
    lineHeight: 1.6,
    color: 'var(--color-text)',
  },
  muted: {
    fontSize: '1rem',
    lineHeight: 1.6,
    color: 'var(--color-text-muted)',
  },
  small: {
    fontSize: '0.875rem',
    lineHeight: 1.5,
    color: 'var(--color-text-muted)',
  },
  large: {
    fontSize: '1.125rem',
    lineHeight: 1.7,
    color: 'var(--color-text)',
  },
  lead: {
    fontSize: 'clamp(1.125rem, 2vw, 1.25rem)',
    lineHeight: 1.7,
    color: 'var(--color-text-muted)',
  },
}

export function Text({
  variant = 'default',
  children,
  className = '',
  centered = false,
  style,
  as = 'p',
}: TextProps) {
  const Tag = as
  const variantStyle = variantStyles[variant]

  const baseStyle: React.CSSProperties = {
    fontFamily: 'var(--font-body)',
    textAlign: centered ? 'center' : 'left',
    margin: 0,
    ...variantStyle,
    ...style,
  }

  return (
    <Tag style={baseStyle} className={className}>
      {children}
    </Tag>
  )
}
