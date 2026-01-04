'use client'

import Image from 'next/image'
import { useTheme } from './ThemeProvider'

interface LogoProps {
  className?: string
  width?: number
  height?: number
}

export default function Logo({ className = 'h-10 w-auto', width = 180, height = 60 }: LogoProps) {
  const { theme, mounted } = useTheme()

  // Dark theme = logo with light text, Light theme = logo with dark text
  const logoSrc = mounted && theme === 'dark' ? '/logo-dark.png' : '/logo-light.png'

  return (
    <Image
      src={logoSrc}
      alt="Procedure"
      width={width}
      height={height}
      className={className}
      priority
    />
  )
}
