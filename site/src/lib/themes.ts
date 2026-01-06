/**
 * Industry-specific SHAPE themes for the website builder
 * Themes define forms, shadows, patterns - NOT colors
 * Colors are controlled separately via CSS variables from company settings
 */

export interface IndustryTheme {
  id: string
  name: string
  // Border radius
  borderRadius: {
    base: string
    card: string
    button: string
    input: string
  }
  // Shadows
  shadow: {
    card: string
    button: string
    elevated: string
  }
  // Visual style identifiers
  heroStyle: 'minimal' | 'gradient' | 'wave' | 'diagonal' | 'image-bg'
  cardStyle: 'flat' | 'elevated' | 'glass' | 'bordered'
  buttonStyle: 'solid' | 'outline' | 'gradient' | 'glow'
  backgroundPattern: 'none' | 'dots' | 'waves' | 'geometric'
  // Spacing
  spacing: 'compact' | 'normal' | 'spacious'
}

export const themes: Record<string, IndustryTheme> = {
  cosmetology: {
    id: 'cosmetology',
    name: 'Косметологія',
    borderRadius: {
      base: '16px',
      card: '24px',
      button: '12px',
      input: '8px',
    },
    shadow: {
      card: '0 10px 40px rgba(0, 0, 0, 0.06)',
      button: '0 4px 15px var(--color-primary-500, #e91e63)40',
      elevated: '0 20px 60px rgba(0, 0, 0, 0.08)',
    },
    heroStyle: 'gradient',
    cardStyle: 'glass',
    buttonStyle: 'gradient',
    backgroundPattern: 'none',
    spacing: 'spacious',
  },

  medical: {
    id: 'medical',
    name: 'Медицина',
    borderRadius: {
      base: '4px',
      card: '8px',
      button: '4px',
      input: '4px',
    },
    shadow: {
      card: '0 2px 8px rgba(0, 0, 0, 0.08)',
      button: 'none',
      elevated: '0 4px 16px rgba(0, 0, 0, 0.1)',
    },
    heroStyle: 'minimal',
    cardStyle: 'bordered',
    buttonStyle: 'solid',
    backgroundPattern: 'none',
    spacing: 'compact',
  },

  massage: {
    id: 'massage',
    name: 'Масаж',
    borderRadius: {
      base: '12px',
      card: '16px',
      button: '8px',
      input: '8px',
    },
    shadow: {
      card: '0 8px 30px rgba(0, 0, 0, 0.05)',
      button: 'none',
      elevated: '0 15px 45px rgba(0, 0, 0, 0.07)',
    },
    heroStyle: 'wave',
    cardStyle: 'flat',
    buttonStyle: 'outline',
    backgroundPattern: 'waves',
    spacing: 'normal',
  },

  sport: {
    id: 'sport',
    name: 'Спорт',
    borderRadius: {
      base: '0',
      card: '0',
      button: '0',
      input: '0',
    },
    shadow: {
      card: '4px 4px 0 rgba(0, 0, 0, 0.1)',
      button: '2px 2px 0 var(--color-primary-700, #c2185b)',
      elevated: '8px 8px 0 rgba(0, 0, 0, 0.15)',
    },
    heroStyle: 'diagonal',
    cardStyle: 'elevated',
    buttonStyle: 'glow',
    backgroundPattern: 'geometric',
    spacing: 'compact',
  },

  beauty: {
    id: 'beauty',
    name: 'Краса',
    borderRadius: {
      base: '20px',
      card: '28px',
      button: '9999px',
      input: '12px',
    },
    shadow: {
      card: '0 12px 35px rgba(0, 0, 0, 0.06)',
      button: '0 0 20px var(--color-primary-500, #a855f7)30',
      elevated: '0 25px 70px rgba(0, 0, 0, 0.08)',
    },
    heroStyle: 'gradient',
    cardStyle: 'glass',
    buttonStyle: 'gradient',
    backgroundPattern: 'dots',
    spacing: 'spacious',
  },

  wellness: {
    id: 'wellness',
    name: 'Wellness',
    borderRadius: {
      base: '12px',
      card: '16px',
      button: '8px',
      input: '6px',
    },
    shadow: {
      card: '0 5px 20px rgba(0, 0, 0, 0.04)',
      button: 'none',
      elevated: '0 10px 40px rgba(0, 0, 0, 0.06)',
    },
    heroStyle: 'minimal',
    cardStyle: 'flat',
    buttonStyle: 'outline',
    backgroundPattern: 'none',
    spacing: 'spacious',
  },
}

/**
 * Get theme by ID, falling back to cosmetology theme
 */
export function getTheme(themeId?: string): IndustryTheme {
  return themes[themeId || 'cosmetology'] || themes.cosmetology
}

/**
 * Generate CSS variables for theme shapes (not colors)
 */
export function getThemeShapeVars(theme: IndustryTheme): string {
  return `
    /* Theme shape variables */
    --radius-base: ${theme.borderRadius.base};
    --radius-card: ${theme.borderRadius.card};
    --radius-button: ${theme.borderRadius.button};
    --radius-input: ${theme.borderRadius.input};

    --shadow-card: ${theme.shadow.card};
    --shadow-button: ${theme.shadow.button};
    --shadow-elevated: ${theme.shadow.elevated};
  `
}

/**
 * Get card styles object based on theme
 */
export function getCardStyles(theme: IndustryTheme): Record<string, string> {
  const base = {
    borderRadius: theme.borderRadius.card,
  }

  switch (theme.cardStyle) {
    case 'flat':
      return {
        ...base,
        background: 'var(--color-surface)',
        boxShadow: 'none',
        border: 'none',
      }
    case 'elevated':
      return {
        ...base,
        background: 'var(--color-surface)',
        boxShadow: theme.shadow.card,
        border: 'none',
      }
    case 'glass':
      return {
        ...base,
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(12px)',
        boxShadow: theme.shadow.card,
        border: '1px solid var(--color-primary-100)',
      }
    case 'bordered':
      return {
        ...base,
        background: 'var(--color-surface)',
        boxShadow: 'none',
        border: '1px solid var(--color-primary-200)',
      }
    default:
      return base
  }
}

/**
 * Get button styles object based on theme
 */
export function getButtonStyles(theme: IndustryTheme): Record<string, string> {
  const base = {
    borderRadius: theme.borderRadius.button,
    fontWeight: '600',
    fontFamily: 'var(--font-body)',
  }

  switch (theme.buttonStyle) {
    case 'solid':
      return {
        ...base,
        background: 'var(--color-primary-500)',
        color: 'var(--color-primary-contrast)',
        border: 'none',
        boxShadow: 'none',
      }
    case 'outline':
      return {
        ...base,
        background: 'transparent',
        color: 'var(--color-primary-500)',
        border: '2px solid var(--color-primary-500)',
        boxShadow: 'none',
      }
    case 'gradient':
      return {
        ...base,
        background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500))',
        color: 'var(--color-primary-contrast)',
        border: 'none',
        boxShadow: theme.shadow.button,
      }
    case 'glow':
      return {
        ...base,
        background: 'var(--color-primary-500)',
        color: 'var(--color-primary-contrast)',
        border: 'none',
        boxShadow: `0 0 20px var(--color-primary-500)60`,
      }
    default:
      return base
  }
}

/**
 * Get section spacing based on theme
 */
export function getSectionSpacing(theme: IndustryTheme): { py: string; px: string } {
  switch (theme.spacing) {
    case 'compact':
      return { py: '3rem', px: '1rem' }
    case 'spacious':
      return { py: '6rem', px: '2rem' }
    case 'normal':
    default:
      return { py: '4rem', px: '1.5rem' }
  }
}
