/**
 * Color utilities for generating CSS variables from company colors
 */

interface HSL {
  h: number
  s: number
  l: number
}

interface ColorConfig {
  primary: string
  secondary: string
  background: string
  accentFont: string
  bodyFont: string
}

/**
 * Convert HEX color to HSL
 */
export function hexToHsl(hex: string): HSL {
  // Remove # if present
  hex = hex.replace(/^#/, '')

  // Parse hex values
  const r = parseInt(hex.slice(0, 2), 16) / 255
  const g = parseInt(hex.slice(2, 4), 16) / 255
  const b = parseInt(hex.slice(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

/**
 * Convert HSL to HEX color
 */
export function hslToHex(hsl: HSL): string {
  const h = hsl.h / 360
  const s = hsl.s / 100
  const l = hsl.l / 100

  let r, g, b

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q

    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Generate color shades from a base color
 * Returns shades from 50 (lightest) to 900 (darkest)
 */
export function generateShades(hex: string): Record<number, string> {
  const hsl = hexToHsl(hex)

  return {
    50: hslToHex({ ...hsl, l: 95 }),
    100: hslToHex({ ...hsl, l: 90 }),
    200: hslToHex({ ...hsl, l: 80 }),
    300: hslToHex({ ...hsl, l: 70 }),
    400: hslToHex({ ...hsl, l: 60 }),
    500: hex, // Original color
    600: hslToHex({ ...hsl, l: Math.max(hsl.l - 10, 35) }),
    700: hslToHex({ ...hsl, l: Math.max(hsl.l - 20, 25) }),
    800: hslToHex({ ...hsl, l: Math.max(hsl.l - 30, 15) }),
    900: hslToHex({ ...hsl, l: Math.max(hsl.l - 40, 10) }),
  }
}

/**
 * Determine if a color is light or dark
 * Returns true if color is light (needs dark text)
 */
export function isLightColor(hex: string): boolean {
  const hsl = hexToHsl(hex)
  return hsl.l > 60
}

/**
 * Get contrast color (black or white) for text on given background
 */
export function getContrastColor(hex: string): string {
  return isLightColor(hex) ? '#1f2937' : '#ffffff'
}

/**
 * Generate CSS variables string from color config
 */
export function generateCssVariables(config: ColorConfig): string {
  const primary = generateShades(config.primary)
  const secondary = generateShades(config.secondary)
  const bg = generateShades(config.background)

  const primaryContrast = getContrastColor(config.primary)
  const secondaryContrast = getContrastColor(config.secondary)

  return `
    :root {
      /* Primary color shades */
      --color-primary-50: ${primary[50]};
      --color-primary-100: ${primary[100]};
      --color-primary-200: ${primary[200]};
      --color-primary-300: ${primary[300]};
      --color-primary-400: ${primary[400]};
      --color-primary-500: ${primary[500]};
      --color-primary-600: ${primary[600]};
      --color-primary-700: ${primary[700]};
      --color-primary-800: ${primary[800]};
      --color-primary-900: ${primary[900]};
      --color-primary-contrast: ${primaryContrast};

      /* Secondary color shades */
      --color-secondary-50: ${secondary[50]};
      --color-secondary-100: ${secondary[100]};
      --color-secondary-200: ${secondary[200]};
      --color-secondary-500: ${secondary[500]};
      --color-secondary-600: ${secondary[600]};
      --color-secondary-700: ${secondary[700]};
      --color-secondary-contrast: ${secondaryContrast};

      /* Background colors */
      --color-background: ${config.background};
      --color-background-alt: ${bg[100]};
      --color-background-muted: ${bg[200]};
      --color-surface: #ffffff;
      --color-surface-hover: ${bg[50]};

      /* Text colors */
      --color-text: #1f2937;
      --color-text-muted: #6b7280;
      --color-text-light: #9ca3af;

      /* Fonts */
      --font-accent: '${config.accentFont}', serif;
      --font-body: '${config.bodyFont}', sans-serif;
    }
  `
}

/**
 * Default colors if company doesn't have custom ones
 */
export const defaultColors: ColorConfig = {
  primary: '#e91e63',
  secondary: '#9c27b0',
  background: '#ffffff',
  accentFont: 'Inter',
  bodyFont: 'Inter',
}
