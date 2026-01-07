'use client'

interface Props {
  variant?: 1 | 2 | 3 | 4
  fillColor?: string
  flip?: boolean
}

export function WaveTransition({ variant = 1, fillColor = 'var(--color-background-alt)', flip = false }: Props) {
  const transform = flip ? 'scaleY(-1)' : undefined

  // Wave variant 1 - Smooth single curve
  if (variant === 1) {
    return (
      <div className="absolute bottom-0 left-0 right-0 leading-[0]" style={{ transform }}>
        <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <path
            d="M0 100V50C360 80 720 20 1080 50C1260 65 1380 75 1440 70V100H0Z"
            style={{ fill: fillColor }}
          />
        </svg>
      </div>
    )
  }

  // Wave variant 2 - Double wave
  if (variant === 2) {
    return (
      <div className="absolute bottom-0 left-0 right-0 leading-[0]" style={{ transform }}>
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <path
            d="M0 120V80C180 100 360 60 540 70C720 80 900 40 1080 50C1260 60 1350 90 1440 80V120H0Z"
            style={{ fill: fillColor }}
          />
        </svg>
      </div>
    )
  }

  // Wave variant 3 - Triple small waves
  if (variant === 3) {
    return (
      <div className="absolute bottom-0 left-0 right-0 leading-[0]" style={{ transform }}>
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <path
            d="M0 80V40C120 55 240 30 360 40C480 50 600 25 720 35C840 45 960 20 1080 30C1200 40 1320 55 1440 45V80H0Z"
            style={{ fill: fillColor }}
          />
        </svg>
      </div>
    )
  }

  // Wave variant 4 - Asymmetric dramatic curve
  if (variant === 4) {
    return (
      <div className="absolute bottom-0 left-0 right-0 leading-[0]" style={{ transform }}>
        <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <path
            d="M0 100V70C200 90 400 30 700 40C1000 50 1200 80 1440 60V100H0Z"
            style={{ fill: fillColor }}
          />
        </svg>
      </div>
    )
  }

  return null
}
