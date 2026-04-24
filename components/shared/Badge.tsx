// components/shared/Badge.tsx
// Status pill badges for course/content states.
// Automatically applies appropriate colors based on the status string.
//
// Recognized values: Published | Draft | Free | Paid
// Falls back to a neutral grey for any unrecognized string.

import React from 'react'

type BadgeStatus = 'Published' | 'Draft' | 'Free' | 'Paid' | string

export interface BadgeProps {
  status: BadgeStatus
  className?: string
}

const statusStyles: Record<string, string> = {
  // Content status
  Published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Draft:     'bg-amber-50  text-amber-700  border-amber-200',

  // Pricing
  Free:      'bg-sky-50    text-sky-700    border-sky-200',
  Paid:      'bg-violet-50 text-violet-700 border-violet-200',

  // Role badges
  SUPER_ADMIN:    'bg-red-50     text-red-700    border-red-200',
  ADMIN:          'bg-orange-50  text-orange-700 border-orange-200',
  INSTRUCTOR:     'bg-blue-50    text-blue-700   border-blue-200',
  STUDENT:        'bg-slate-50   text-slate-700  border-slate-200',
}

// Fallback for unrecognised values
const defaultStyle = 'bg-brand-offwhite text-brand-muted border-brand-border'

export function Badge({ status, className = '' }: BadgeProps) {
  const styles = statusStyles[status] ?? defaultStyle

  return (
    <span
      className={[
        'inline-flex items-center',
        'px-2.5 py-0.5',
        'rounded-full',
        'text-xs font-semibold',
        'border',
        'whitespace-nowrap',
        styles,
        className,
      ].join(' ')}
    >
      {status}
    </span>
  )
}
