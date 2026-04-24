'use client'
// components/shared/Button.tsx
// Qasberry design system button.
// Uses class-variance-authority (cva) for type-safe variant management.
//
// Variants:  primary | secondary | ghost | destructive
// Sizes:     sm | md | lg
// Props:     isLoading — shows spinner, disables interaction

import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import React from 'react'

// ── Variant definitions ────────────────────────────────────────────────────────

const buttonVariants = cva(
  // Base styles — applied to every variant
  [
    'inline-flex items-center justify-center gap-2',
    'font-semibold rounded-xl',
    'transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'select-none',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: [
          'bg-brand-purple text-white',
          'hover:bg-brand-purple-dark',
          'shadow-md shadow-brand-purple/20',
          'hover:shadow-lg hover:shadow-brand-purple/30',
          'active:scale-[0.98]',
        ].join(' '),

        secondary: [
          'bg-brand-offwhite text-brand-charcoal border border-brand-border',
          'hover:bg-white hover:border-brand-purple/40',
          'active:scale-[0.98]',
        ].join(' '),

        ghost: [
          'bg-transparent text-brand-muted',
          'hover:bg-brand-offwhite hover:text-brand-charcoal',
          'active:scale-[0.98]',
        ].join(' '),

        destructive: [
          'bg-red-600 text-white',
          'hover:bg-red-700',
          'shadow-md shadow-red-600/20',
          'active:scale-[0.98]',
        ].join(' '),
      },

      size: {
        sm: 'h-8  px-3   text-xs',
        md: 'h-10 px-5   text-sm',
        lg: 'h-12 px-7   text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size:    'md',
    },
  }
)

// ── Props ──────────────────────────────────────────────────────────────────────

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Button({
  className = '',
  variant,
  size,
  isLoading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${buttonVariants({ variant, size })} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  )
}
