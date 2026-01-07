'use client'

interface Props {
  /** Section index (0-based) - used to calculate wave variant */
  sectionIndex: number
  /** Whether the NEXT section has alt background */
  nextIsAlt: boolean
  /** Total number of wave variants available */
  totalVariants?: number
}

export function WaveTransition({ sectionIndex, nextIsAlt, totalVariants = 6 }: Props) {
  // Calculate wave variant based on section index (1-6)
  const variant = (sectionIndex % totalVariants) + 1

  // Flip horizontally for odd sections for more variety
  const isEven = sectionIndex % 2 === 0
  const scaleX = isEven ? '1' : '-1'

  // Fill color based on next section's background
  const fillColor = nextIsAlt ? 'var(--color-background-alt)' : 'var(--color-background)'

  return (
    <div
      className="absolute bottom-0 left-0 right-0 leading-[0] overflow-hidden"
      style={{
        transform: `scaleX(${scaleX})`,
      }}
    >
      <WaveSvg variant={variant} fill={fillColor} />
    </div>
  )
}

function WaveSvg({ variant, fill }: { variant: number; fill: string }) {
  // Wave variant 1 - Gentle single curve (1 peak)
  if (variant === 1) {
    return (
      <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block">
        <path
          d="M0 80 L0 50 Q360 10, 720 40 Q1080 70, 1440 35 L1440 80 Z"
          style={{ fill }}
        />
      </svg>
    )
  }

  // Wave variant 2 - Two peaks, one valley (2 peaks 1 valley)
  if (variant === 2) {
    return (
      <svg viewBox="0 0 1440 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block">
        <path
          d="M0 90 L0 45 Q180 15, 400 35 Q620 55, 800 25 Q1000 -5, 1200 30 Q1350 50, 1440 40 L1440 90 Z"
          style={{ fill }}
        />
      </svg>
    )
  }

  // Wave variant 3 - Two peaks, two valleys (2-2 pattern, smoother)
  if (variant === 3) {
    return (
      <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block">
        <path
          d="M0 100 L0 55 Q200 25, 360 50 Q520 75, 720 40 Q920 5, 1080 45 Q1240 85, 1440 55 L1440 100 Z"
          style={{ fill }}
        />
      </svg>
    )
  }

  // Wave variant 4 - Asymmetric with steep rise (wide curve on left, narrow peak on right)
  if (variant === 4) {
    return (
      <svg viewBox="0 0 1440 85" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block">
        <path
          d="M0 85 L0 60 Q300 35, 600 45 Q800 50, 950 20 Q1100 -5, 1250 30 Q1350 50, 1440 45 L1440 85 Z"
          style={{ fill }}
        />
      </svg>
    )
  }

  // Wave variant 5 - Three small peaks (3 bumps)
  if (variant === 5) {
    return (
      <svg viewBox="0 0 1440 75" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block">
        <path
          d="M0 75 L0 50 Q120 25, 280 40 Q440 55, 560 30 Q680 5, 840 35 Q1000 65, 1160 35 Q1320 10, 1440 40 L1440 75 Z"
          style={{ fill }}
        />
      </svg>
    )
  }

  // Wave variant 6 - Deep single curve with wider radius
  if (variant === 6) {
    return (
      <svg viewBox="0 0 1440 95" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block">
        <path
          d="M0 95 L0 70 Q400 15, 720 30 Q1040 45, 1440 65 L1440 95 Z"
          style={{ fill }}
        />
      </svg>
    )
  }

  return null
}

/**
 * Helper to determine if a section should have alt background
 * @param sectionIndex - 0-based index of the section
 * @param heroIsMain - whether hero uses main background (usually true for dark themes)
 * @returns true if section should use alt (light) background
 */
export function shouldUseAltBackground(sectionIndex: number, heroIsMain: boolean = true): boolean {
  // Hero (index 0) is always main background
  // Then alternate: 1=alt, 2=main, 3=alt, 4=main, etc.
  if (sectionIndex === 0) return !heroIsMain
  return sectionIndex % 2 === 1
}
