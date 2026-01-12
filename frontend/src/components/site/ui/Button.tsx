'use client'

import React from 'react'
import Link from 'next/link'
import { IndustryTheme } from '@/lib/themes'

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient'
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  children: React.ReactNode
  href?: string
  onClick?: () => void
  className?: string
  disabled?: boolean
  fullWidth?: boolean
  theme?: IndustryTheme
  type?: 'button' | 'submit' | 'reset'
}

const sizeStyles = {
  sm: {
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    gap: '0.375rem',
  },
  md: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    gap: '0.5rem',
  },
  lg: {
    padding: '1rem 2rem',
    fontSize: '1.125rem',
    gap: '0.625rem',
  },
}

function getVariantStyles(variant: ButtonProps['variant'], theme?: IndustryTheme): React.CSSProperties {
  const borderRadius = theme?.borderRadius.button || '8px'

  switch (variant) {
    case 'primary':
      return {
        backgroundColor: 'var(--color-primary-500)',
        color: 'var(--color-primary-contrast)',
        border: 'none',
        borderRadius,
        boxShadow: theme?.shadow.button || 'none',
      }
    case 'secondary':
      return {
        backgroundColor: 'var(--color-secondary-500)',
        color: 'var(--color-secondary-contrast)',
        border: 'none',
        borderRadius,
      }
    case 'outline':
      return {
        backgroundColor: 'transparent',
        color: 'var(--color-primary-500)',
        border: '2px solid var(--color-primary-500)',
        borderRadius,
      }
    case 'ghost':
      return {
        backgroundColor: 'transparent',
        color: 'var(--color-primary-500)',
        border: 'none',
        borderRadius,
      }
    case 'gradient':
      return {
        background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500))',
        color: 'var(--color-primary-contrast)',
        border: 'none',
        borderRadius,
        boxShadow: theme?.shadow.button || '0 4px 15px var(--color-primary-500)40',
      }
    default:
      return {
        backgroundColor: 'var(--color-primary-500)',
        color: 'var(--color-primary-contrast)',
        border: 'none',
        borderRadius,
      }
  }
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  children,
  href,
  onClick,
  className = '',
  disabled = false,
  fullWidth = false,
  theme,
  type = 'button',
}: ButtonProps) {
  const sizeStyle = sizeStyles[size]
  const variantStyle = getVariantStyles(variant, theme)

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sizeStyle.gap,
    padding: sizeStyle.padding,
    fontSize: sizeStyle.fontSize,
    fontWeight: 600,
    fontFamily: 'var(--font-body)',
    textDecoration: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'all 0.2s ease',
    width: fullWidth ? '100%' : 'auto',
    ...variantStyle,
  }

  const content = (
    <>
      {icon && iconPosition === 'left' && <span style={{ display: 'flex' }}>{icon}</span>}
      <span>{children}</span>
      {icon && iconPosition === 'right' && <span style={{ display: 'flex' }}>{icon}</span>}
    </>
  )

  if (href && !disabled) {
    return (
      <Link href={href} style={baseStyle} className={className}>
        {content}
      </Link>
    )
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={baseStyle}
      className={className}
    >
      {content}
    </button>
  )
}
