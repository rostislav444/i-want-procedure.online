'use client'

import React from 'react'

type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4'

export interface HeadingProps {
  level?: 1 | 2 | 3 | 4
  children: React.ReactNode
  className?: string
  centered?: boolean
  style?: React.CSSProperties
  color?: 'default' | 'primary' | 'muted' | 'inherit'
}

const levelStyles = {
  1: {
    fontSize: 'clamp(2rem, 5vw, 3.5rem)',
    fontWeight: 700,
    lineHeight: 1.1,
    marginBottom: '1.5rem',
  },
  2: {
    fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
    fontWeight: 700,
    lineHeight: 1.2,
    marginBottom: '1rem',
  },
  3: {
    fontSize: 'clamp(1.25rem, 3vw, 1.75rem)',
    fontWeight: 600,
    lineHeight: 1.3,
    marginBottom: '0.75rem',
  },
  4: {
    fontSize: 'clamp(1rem, 2vw, 1.25rem)',
    fontWeight: 600,
    lineHeight: 1.4,
    marginBottom: '0.5rem',
  },
}

function getColorStyle(color: HeadingProps['color']): string {
  switch (color) {
    case 'primary':
      return 'var(--color-primary-500)'
    case 'muted':
      return 'var(--color-text-muted)'
    case 'inherit':
      return 'inherit'
    case 'default':
    default:
      return 'var(--color-text)'
  }
}

export function Heading({
  level = 2,
  children,
  className = '',
  centered = false,
  style,
  color = 'default',
}: HeadingProps) {
  const Tag: HeadingTag = `h${level}` as HeadingTag
  const levelStyle = levelStyles[level]

  const baseStyle: React.CSSProperties = {
    fontFamily: 'var(--font-accent)',
    color: getColorStyle(color),
    textAlign: centered ? 'center' : 'left',
    margin: 0,
    ...levelStyle,
    ...style,
  }

  return React.createElement(
    Tag,
    { style: baseStyle, className },
    children
  )
}
