'use client'

interface Props {
  children: React.ReactNode
  /** Background color/gradient of this section */
  backgroundColor: string
  /** Section index for wave variant calculation */
  sectionIndex: number
  /** Whether to show wave at top */
  showTopWave?: boolean
  /** Additional className */
  className?: string
}

/**
 * Section wrapper with integrated wave shape at the top.
 * The wave is part of the section itself, not a separate overlay.
 * This creates seamless transitions between sections.
 */
export function WaveSection({
  children,
  backgroundColor,
  sectionIndex,
  showTopWave = true,
  className = ''
}: Props) {
  // Calculate wave variant (6 variants, cycling)
  const variant = (sectionIndex % 6) + 1
  // Flip wave horizontally on odd sections
  const flipWave = sectionIndex % 2 === 1

  return (
    <div className={`relative ${className}`}>
      {/* Wave shape at top - this IS part of the section background */}
      {showTopWave && sectionIndex > 0 && (
        <div
          className="absolute top-0 left-0 right-0 overflow-hidden pointer-events-none"
          style={{
            transform: `translateY(-99%) ${flipWave ? 'scaleX(-1)' : ''}`,
          }}
        >
          <WaveSvg variant={variant} fill={backgroundColor} />
        </div>
      )}

      {/* Main section content with background */}
      <div style={{ backgroundColor }}>
        {children}
      </div>
    </div>
  )
}

function WaveSvg({ variant, fill }: { variant: number; fill: string }) {
  // All waves: viewBox height determines wave amplitude
  // Path goes from left edge, curves up/down, ends at right edge, then fills down to bottom

  // Wave variant 1 - Gentle single curve (1 peak)
  if (variant === 1) {
    return (
      <svg
        viewBox="0 0 1440 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto block"
        preserveAspectRatio="none"
      >
        <path
          d="M0 80 L0 50 Q360 10, 720 40 Q1080 70, 1440 35 L1440 80 Z"
          fill={fill}
        />
      </svg>
    )
  }

  // Wave variant 2 - Two peaks, one valley
  if (variant === 2) {
    return (
      <svg
        viewBox="0 0 1440 90"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto block"
        preserveAspectRatio="none"
      >
        <path
          d="M0 90 L0 45 Q180 15, 400 35 Q620 55, 800 25 Q1000 -5, 1200 30 Q1350 50, 1440 40 L1440 90 Z"
          fill={fill}
        />
      </svg>
    )
  }

  // Wave variant 3 - Two peaks, two valleys (smoother)
  if (variant === 3) {
    return (
      <svg
        viewBox="0 0 1440 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto block"
        preserveAspectRatio="none"
      >
        <path
          d="M0 100 L0 55 Q200 25, 360 50 Q520 75, 720 40 Q920 5, 1080 45 Q1240 85, 1440 55 L1440 100 Z"
          fill={fill}
        />
      </svg>
    )
  }

  // Wave variant 4 - Asymmetric with steep rise
  if (variant === 4) {
    return (
      <svg
        viewBox="0 0 1440 85"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto block"
        preserveAspectRatio="none"
      >
        <path
          d="M0 85 L0 60 Q300 35, 600 45 Q800 50, 950 20 Q1100 -5, 1250 30 Q1350 50, 1440 45 L1440 85 Z"
          fill={fill}
        />
      </svg>
    )
  }

  // Wave variant 5 - Three small peaks
  if (variant === 5) {
    return (
      <svg
        viewBox="0 0 1440 75"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto block"
        preserveAspectRatio="none"
      >
        <path
          d="M0 75 L0 50 Q120 25, 280 40 Q440 55, 560 30 Q680 5, 840 35 Q1000 65, 1160 35 Q1320 10, 1440 40 L1440 75 Z"
          fill={fill}
        />
      </svg>
    )
  }

  // Wave variant 6 - Deep single curve with wide radius
  if (variant === 6) {
    return (
      <svg
        viewBox="0 0 1440 95"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto block"
        preserveAspectRatio="none"
      >
        <path
          d="M0 95 L0 70 Q400 15, 720 30 Q1040 45, 1440 65 L1440 95 Z"
          fill={fill}
        />
      </svg>
    )
  }

  return null
}

/**
 * Helper to determine if a section should have alt background
 */
export function shouldUseAltBackground(sectionIndex: number, heroIsMain: boolean = true): boolean {
  if (sectionIndex === 0) return !heroIsMain
  return sectionIndex % 2 === 1
}
