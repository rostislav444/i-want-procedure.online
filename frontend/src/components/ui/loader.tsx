'use client'

import { cn } from '@/lib/utils'

interface LoaderProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

/**
 * Animated loader inspired by the Procedure logo orbit.
 * Three colored orbs (pink, blue, orange) rotate on an elliptical path.
 * Use for full-page / layout loading states only.
 */
export function Loader({ className, size = 'md', text }: LoaderProps) {
  const sizes = {
    sm: { container: 'w-10 h-10', orb: 'w-2 h-2' },
    md: { container: 'w-16 h-16', orb: 'w-3 h-3' },
    lg: { container: 'w-24 h-24', orb: 'w-4 h-4' },
  }

  const s = sizes[size]

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div className={cn('relative', s.container)}>
        {/* Orbit ring */}
        <div className="absolute inset-0 rounded-full border-2 border-pink-200/40 dark:border-pink-400/20" />

        {/* Pink orb */}
        <div className="absolute inset-0 animate-orbit">
          <div className={cn(
            s.orb,
            'absolute rounded-full shadow-lg',
            'bg-gradient-to-br from-pink-400 to-rose-500',
            'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2'
          )} />
        </div>

        {/* Blue orb */}
        <div className="absolute inset-0 animate-orbit" style={{ animationDelay: '-0.6s' }}>
          <div className={cn(
            s.orb,
            'absolute rounded-full shadow-lg',
            'bg-gradient-to-br from-blue-400 to-blue-600',
            'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2'
          )} />
        </div>

        {/* Orange orb */}
        <div className="absolute inset-0 animate-orbit" style={{ animationDelay: '-1.2s' }}>
          <div className={cn(
            s.orb,
            'absolute rounded-full shadow-lg',
            'bg-gradient-to-br from-amber-400 to-orange-500',
            'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2'
          )} />
        </div>

        {/* Center glow */}
        <div className="absolute inset-[30%] rounded-full bg-gradient-to-br from-pink-200/20 to-purple-200/20 dark:from-pink-400/10 dark:to-purple-400/10 blur-sm" />
      </div>

      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
      )}
    </div>
  )
}

/**
 * Skeleton table loader — shows a ghost table while data is loading.
 * Much less jarring than a spinner, content "fades in" over the skeleton.
 */
export function TableSkeleton({ rows = 8, cols = 7, className }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={cn('animate-pulse', className)}>
      {/* Header row */}
      <div className="flex gap-4 p-3 border-b bg-muted/30">
        <div className="w-6" />
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className={cn('h-4 bg-muted rounded', i === 0 ? 'flex-[2]' : 'flex-1')} />
        ))}
      </div>
      {/* Body rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 p-3 border-b">
          <div className="w-6" />
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className={cn(
                'h-4 bg-muted/60 rounded',
                c === 0 ? 'flex-[2]' : 'flex-1',
              )}
              style={{ opacity: 1 - r * 0.08 }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * Generic content skeleton for cards/grids.
 */
export function CardsSkeleton({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-4 space-y-3">
          <div className="h-8 w-20 bg-muted rounded" />
          <div className="h-4 w-28 bg-muted/60 rounded" />
        </div>
      ))}
    </div>
  )
}

/**
 * Wrapper that fades in content smoothly.
 */
export function FadeIn({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('animate-fadeIn', className)}>
      {children}
    </div>
  )
}
