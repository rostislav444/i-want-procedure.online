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
      {/* Wave shape at top - fixed 100px height */}
      {showTopWave && sectionIndex > 0 && (
        <div
          className="absolute left-0 right-0 overflow-hidden pointer-events-none"
          style={{
            top: '-99px',
            height: '100px',
            transform: flipWave ? 'scaleX(-1)' : undefined,
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
  // All waves: 100px height, smooth parabolic/sinusoidal curves
  // Using cubic bezier curves for smooth parabolic shapes

  // Wave variant 1 - Single smooth parabola
  if (variant === 1) {
    return (
      <svg
        viewBox="0 0 1440 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full block"
        style={{ height: '100px' }}
        preserveAspectRatio="none"
      >
        <path
          d="M0 100 L0 60 C360 0, 1080 0, 1440 60 L1440 100 Z"
          fill={fill}
        />
      </svg>
    )
  }

  // Wave variant 2 - Two smooth humps
  if (variant === 2) {
    return (
      <svg
        viewBox="0 0 1440 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full block"
        style={{ height: '100px' }}
        preserveAspectRatio="none"
      >
        <path
          d="M0 100 L0 70 C180 20, 360 20, 540 50 C720 80, 900 20, 1080 20 C1260 20, 1350 50, 1440 70 L1440 100 Z"
          fill={fill}
        />
      </svg>
    )
  }

  // Wave variant 3 - Classic sine wave (2 full cycles)
  if (variant === 3) {
    return (
      <svg
        viewBox="0 0 1440 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full block"
        style={{ height: '100px' }}
        preserveAspectRatio="none"
      >
        <path
          d="M0 100 L0 50 C180 10, 360 10, 540 50 C720 90, 900 90, 1080 50 C1260 10, 1350 30, 1440 50 L1440 100 Z"
          fill={fill}
        />
      </svg>
    )
  }

  // Wave variant 4 - Asymmetric smooth curve
  if (variant === 4) {
    return (
      <svg
        viewBox="0 0 1440 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full block"
        style={{ height: '100px' }}
        preserveAspectRatio="none"
      >
        <path
          d="M0 100 L0 80 C300 80, 500 15, 800 15 C1100 15, 1300 60, 1440 60 L1440 100 Z"
          fill={fill}
        />
      </svg>
    )
  }

  // Wave variant 5 - Three gentle bumps
  if (variant === 5) {
    return (
      <svg
        viewBox="0 0 1440 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full block"
        style={{ height: '100px' }}
        preserveAspectRatio="none"
      >
        <path
          d="M0 100 L0 60 C120 30, 240 30, 360 50 C480 70, 600 30, 720 30 C840 30, 960 70, 1080 50 C1200 30, 1320 30, 1440 60 L1440 100 Z"
          fill={fill}
        />
      </svg>
    )
  }

  // Wave variant 6 - Wide parabola
  if (variant === 6) {
    return (
      <svg
        viewBox="0 0 1440 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full block"
        style={{ height: '100px' }}
        preserveAspectRatio="none"
      >
        <path
          d="M0 100 L0 70 C480 10, 960 10, 1440 70 L1440 100 Z"
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
