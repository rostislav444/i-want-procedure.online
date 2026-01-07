'use client'

interface Props {
  /** Section index (0-based) - used to calculate wave variant */
  sectionIndex: number
  /** Whether the NEXT section has alt background */
  nextIsAlt: boolean
  /** Total number of wave variants available */
  totalVariants?: number
}

export function WaveTransition({ sectionIndex, nextIsAlt, totalVariants = 4 }: Props) {
  // Calculate wave variant based on section index (1-4)
  const variant = (sectionIndex % totalVariants) + 1

  // Calculate horizontal shift based on odd/even
  const isEven = sectionIndex % 2 === 0
  const translateX = isEven ? '0' : '-5%'
  const scaleX = isEven ? '1' : '-1' // Flip horizontally for odd sections

  // Fill color based on next section's background
  const fillColor = nextIsAlt ? 'var(--color-background-alt)' : 'var(--color-background)'

  return (
    <div
      className="absolute bottom-0 left-0 right-0 leading-[0]"
      style={{
        transform: `translateX(${translateX}) scaleX(${scaleX})`,
      }}
    >
      <WaveSvg variant={variant} fill={fillColor} />
    </div>
  )
}

function WaveSvg({ variant, fill }: { variant: number; fill: string }) {
  // Wave variant 1 - Smooth single curve
  if (variant === 1) {
    return (
      <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
        <path
          d="M0 100V50C360 80 720 20 1080 50C1260 65 1380 75 1440 70V100H0Z"
          style={{ fill }}
        />
      </svg>
    )
  }

  // Wave variant 2 - Higher amplitude
  if (variant === 2) {
    return (
      <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
        <path
          d="M0 120V60C240 100 480 20 720 50C960 80 1200 30 1440 70V120H0Z"
          style={{ fill }}
        />
      </svg>
    )
  }

  // Wave variant 3 - Gentle curve
  if (variant === 3) {
    return (
      <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
        <path
          d="M0 80V40C480 70 960 20 1440 50V80H0Z"
          style={{ fill }}
        />
      </svg>
    )
  }

  // Wave variant 4 - Asymmetric
  if (variant === 4) {
    return (
      <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
        <path
          d="M0 100V70C200 90 500 25 800 45C1100 65 1300 80 1440 55V100H0Z"
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
