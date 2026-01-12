'use client'

import React from 'react'

export interface ContainerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

const maxWidths = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  full: '100%',
}

export function Container({
  size = 'xl',
  children,
  className = '',
  style,
}: ContainerProps) {
  const baseStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: maxWidths[size],
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingLeft: '1rem',
    paddingRight: '1rem',
    ...style,
  }

  return (
    <div style={baseStyle} className={className}>
      {children}
    </div>
  )
}
