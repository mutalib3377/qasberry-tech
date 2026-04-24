'use client'
// components/shared/ProgressBar.tsx
// Animated purple progress bar.
// Variants: thin (4px, used in course cards) | thick (8px, used in player topbar)
// Animates width via CSS transition; accessible with role="progressbar".

import React from 'react'

export interface ProgressBarProps {
  /** Current value (0–100 percentage, OR use value + max) */
  value: number
  /** Optional max value — if provided, percentage = value/max*100 */
  max?: number
  /** Visual variant */
  variant?: 'thin' | 'thick'
  /** Show percentage label at the end */
  showLabel?: boolean
  /** Additional className for the outer wrapper */
  className?: string
}

export function ProgressBar({
  value,
  max,
  variant = 'thin',
  showLabel = false,
  className = '',
}: ProgressBarProps) {
  const pct = max && max > 0 ? Math.min(100, Math.round((value / max) * 100)) : Math.min(100, value)

  const heights: Record<NonNullable<ProgressBarProps['variant']>, string> = {
    thin:  'h-1',
    thick: 'h-2',
  }

  return (
    <div className={`flex items-center gap-2 w-full ${className}`}>
      {/* Track */}
      <div
        className={`flex-1 ${heights[variant]} rounded-full bg-brand-border overflow-hidden`}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {/* Fill */}
        <div
          className="h-full rounded-full bg-brand-purple transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Optional label */}
      {showLabel && (
        <span className="text-xs font-medium text-brand-muted tabular-nums w-9 text-right">
          {pct}%
        </span>
      )}
    </div>
  )
}
