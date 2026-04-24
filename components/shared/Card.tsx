// components/shared/Card.tsx
// Qasberry design system card wrapper.
// White background, brand-border, 12px radius, 24px padding.
// Optional `hover` prop adds lift shadow on interaction.

import React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Adds hover:shadow-md and subtle translateY lift */
  hover?: boolean
  /** Removes default 24px padding — useful when card contains an image header */
  noPadding?: boolean
}

export function Card({
  children,
  className = '',
  hover = false,
  noPadding = false,
  ...props
}: CardProps) {
  return (
    <div
      className={[
        'bg-white rounded-xl border border-brand-border',
        noPadding ? '' : 'p-6',
        hover
          ? 'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer'
          : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}

// ── Sub-components for convenience ────────────────────────────────────────────

export function CardHeader({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`border-b border-brand-border pb-4 mb-4 ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <h3 className={`text-base font-semibold text-brand-charcoal ${className}`}>
      {children}
    </h3>
  )
}

export function CardFooter({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`border-t border-brand-border pt-4 mt-4 ${className}`}>
      {children}
    </div>
  )
}
