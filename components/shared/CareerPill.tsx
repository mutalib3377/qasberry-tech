// components/shared/CareerPill.tsx
// Lavender background pill used for career category quick-select chips.
// Used in: HeroSection, CommunityPage, CareerGrid.

import React from 'react'

export interface CareerPillProps {
  /** Career category emoji (e.g. "👩‍⚕️") */
  emoji: string
  /** Career label (e.g. "Nurse") */
  label: string
  /** Optional click handler */
  onClick?: () => void
  /** Whether the pill is currently selected / active */
  active?: boolean
  /** Additional className overrides */
  className?: string
}

export function CareerPill({
  emoji,
  label,
  onClick,
  active = false,
  className = '',
}: CareerPillProps) {
  const base = [
    'inline-flex items-center gap-1.5',
    'px-3.5 py-1.5 rounded-full',
    'text-sm font-medium',
    'transition-all duration-200',
    'select-none',
    onClick ? 'cursor-pointer' : '',
  ]

  const variants = active
    ? 'bg-brand-purple text-white shadow-md shadow-brand-purple/20'
    : 'bg-brand-lavender/20 text-brand-navy border border-brand-lavender/40 hover:bg-brand-lavender/35'

  const Tag = onClick ? 'button' : 'span'

  return (
    <Tag
      // @ts-expect-error — Tag is either button or span, both accept className / onClick
      className={[...base, variants, className].filter(Boolean).join(' ')}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
    >
      <span role="img" aria-label={label} className="text-base leading-none">
        {emoji}
      </span>
      <span>{label}</span>
    </Tag>
  )
}
