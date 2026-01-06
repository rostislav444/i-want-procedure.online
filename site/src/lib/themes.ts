/**
 * Industry-specific design themes for the website builder
 * Each theme has unique colors, typography, shapes, and styling
 */

export interface IndustryTheme {
  id: string
  name: string
  // Colors
  primaryColor: string
  secondaryColor: string
  accentColor: string
  gradientFrom: string
  gradientTo: string
  // Typography
  headingFont: string
  bodyFont: string
  // Visual style
  borderRadius: 'sharp' | 'rounded' | 'pill'
  shadowStyle: 'none' | 'soft' | 'dramatic'
  backgroundPattern: 'none' | 'dots' | 'waves' | 'geometric'
  // Section defaults
  heroStyle: 'minimal' | 'gradient' | 'image-bg' | 'split'
  cardStyle: 'flat' | 'elevated' | 'glass' | 'bordered'
  buttonStyle: 'solid' | 'outline' | 'gradient' | 'glow'
}

export const themes: Record<string, IndustryTheme> = {
  cosmetology: {
    id: 'cosmetology',
    name: 'Косметологія',
    primaryColor: '#e91e63',
    secondaryColor: '#fce4ec',
    accentColor: '#fbbf24',
    gradientFrom: '#ec4899',
    gradientTo: '#f472b6',
    headingFont: 'Playfair Display',
    bodyFont: 'Inter',
    borderRadius: 'rounded',
    shadowStyle: 'soft',
    backgroundPattern: 'none',
    heroStyle: 'gradient',
    cardStyle: 'glass',
    buttonStyle: 'gradient',
  },

  medical: {
    id: 'medical',
    name: 'Медицина',
    primaryColor: '#0891b2',
    secondaryColor: '#ecfeff',
    accentColor: '#06b6d4',
    gradientFrom: '#0ea5e9',
    gradientTo: '#22d3ee',
    headingFont: 'Plus Jakarta Sans',
    bodyFont: 'Inter',
    borderRadius: 'sharp',
    shadowStyle: 'soft',
    backgroundPattern: 'none',
    heroStyle: 'minimal',
    cardStyle: 'bordered',
    buttonStyle: 'solid',
  },

  massage: {
    id: 'massage',
    name: 'Масаж',
    primaryColor: '#059669',
    secondaryColor: '#ecfdf5',
    accentColor: '#a3e635',
    gradientFrom: '#10b981',
    gradientTo: '#34d399',
    headingFont: 'Cormorant Garamond',
    bodyFont: 'Nunito',
    borderRadius: 'rounded',
    shadowStyle: 'none',
    backgroundPattern: 'waves',
    heroStyle: 'image-bg',
    cardStyle: 'flat',
    buttonStyle: 'outline',
  },

  sport: {
    id: 'sport',
    name: 'Спорт',
    primaryColor: '#f97316',
    secondaryColor: '#fff7ed',
    accentColor: '#eab308',
    gradientFrom: '#f97316',
    gradientTo: '#fb923c',
    headingFont: 'Bebas Neue',
    bodyFont: 'Roboto',
    borderRadius: 'sharp',
    shadowStyle: 'dramatic',
    backgroundPattern: 'geometric',
    heroStyle: 'split',
    cardStyle: 'elevated',
    buttonStyle: 'glow',
  },

  beauty: {
    id: 'beauty',
    name: 'Краса',
    primaryColor: '#a855f7',
    secondaryColor: '#faf5ff',
    accentColor: '#d4af37',
    gradientFrom: '#a855f7',
    gradientTo: '#c084fc',
    headingFont: 'Cormorant',
    bodyFont: 'Lato',
    borderRadius: 'pill',
    shadowStyle: 'soft',
    backgroundPattern: 'dots',
    heroStyle: 'gradient',
    cardStyle: 'glass',
    buttonStyle: 'gradient',
  },

  wellness: {
    id: 'wellness',
    name: 'Wellness',
    primaryColor: '#14b8a6',
    secondaryColor: '#f0fdfa',
    accentColor: '#5eead4',
    gradientFrom: '#2dd4bf',
    gradientTo: '#5eead4',
    headingFont: 'Josefin Sans',
    bodyFont: 'Open Sans',
    borderRadius: 'rounded',
    shadowStyle: 'none',
    backgroundPattern: 'none',
    heroStyle: 'minimal',
    cardStyle: 'flat',
    buttonStyle: 'outline',
  },
}

/**
 * Get theme by ID, falling back to cosmetology theme
 */
export function getTheme(themeId?: string): IndustryTheme {
  return themes[themeId || 'cosmetology'] || themes.cosmetology
}

/**
 * Get CSS custom properties for a theme
 */
export function getThemeCSSVars(theme: IndustryTheme): Record<string, string> {
  return {
    '--theme-primary': theme.primaryColor,
    '--theme-secondary': theme.secondaryColor,
    '--theme-accent': theme.accentColor,
    '--theme-gradient-from': theme.gradientFrom,
    '--theme-gradient-to': theme.gradientTo,
  }
}

/**
 * Get border radius value based on theme style
 */
export function getBorderRadius(theme: IndustryTheme): string {
  switch (theme.borderRadius) {
    case 'sharp':
      return '4px'
    case 'rounded':
      return '12px'
    case 'pill':
      return '9999px'
    default:
      return '12px'
  }
}

/**
 * Get card border radius (typically larger than base)
 */
export function getCardRadius(theme: IndustryTheme): string {
  switch (theme.borderRadius) {
    case 'sharp':
      return '8px'
    case 'rounded':
      return '16px'
    case 'pill':
      return '24px'
    default:
      return '16px'
  }
}

/**
 * Get button border radius
 */
export function getButtonRadius(theme: IndustryTheme): string {
  switch (theme.borderRadius) {
    case 'sharp':
      return '4px'
    case 'rounded':
      return '12px'
    case 'pill':
      return '9999px'
    default:
      return '12px'
  }
}

/**
 * Get box shadow based on theme style
 */
export function getBoxShadow(theme: IndustryTheme): string {
  switch (theme.shadowStyle) {
    case 'none':
      return 'none'
    case 'soft':
      return `0 4px 20px ${theme.primaryColor}15`
    case 'dramatic':
      return `0 8px 30px ${theme.primaryColor}30, 0 4px 10px rgba(0,0,0,0.1)`
    default:
      return 'none'
  }
}

/**
 * Get card styles based on theme
 */
export function getCardStyles(theme: IndustryTheme): Record<string, string> {
  const base = {
    borderRadius: getCardRadius(theme),
  }

  switch (theme.cardStyle) {
    case 'flat':
      return {
        ...base,
        background: 'var(--card)',
        boxShadow: 'none',
        border: 'none',
      }
    case 'elevated':
      return {
        ...base,
        background: 'var(--card)',
        boxShadow: getBoxShadow(theme),
        border: 'none',
      }
    case 'glass':
      return {
        ...base,
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(12px)',
        boxShadow: getBoxShadow(theme),
        border: `1px solid ${theme.primaryColor}20`,
      }
    case 'bordered':
      return {
        ...base,
        background: 'var(--card)',
        boxShadow: 'none',
        border: `1px solid ${theme.primaryColor}30`,
      }
    default:
      return base
  }
}

/**
 * Get button styles based on theme
 */
export function getButtonStyles(theme: IndustryTheme): Record<string, string> {
  const base = {
    borderRadius: getButtonRadius(theme),
    fontWeight: '600',
  }

  switch (theme.buttonStyle) {
    case 'solid':
      return {
        ...base,
        background: theme.primaryColor,
        color: '#ffffff',
        border: 'none',
        boxShadow: 'none',
      }
    case 'outline':
      return {
        ...base,
        background: 'transparent',
        color: theme.primaryColor,
        border: `2px solid ${theme.primaryColor}`,
        boxShadow: 'none',
      }
    case 'gradient':
      return {
        ...base,
        background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
        color: '#ffffff',
        border: 'none',
        boxShadow: `0 4px 15px ${theme.primaryColor}40`,
      }
    case 'glow':
      return {
        ...base,
        background: theme.primaryColor,
        color: '#ffffff',
        border: 'none',
        boxShadow: `0 0 20px ${theme.primaryColor}60, 0 4px 15px ${theme.primaryColor}40`,
      }
    default:
      return base
  }
}
