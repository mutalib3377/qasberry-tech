'use client'
// components/shared/Input.tsx
// Qasberry design system text input.
// Supports: default, focus (purple border), error, disabled states.
// Forwards all native <input> props via React.forwardRef.

import React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Optional error message — shows red border + message below input */
  error?: string
  /** Optional label rendered above the input */
  label?: string
  /** Leading icon slot (e.g. a Lucide icon element) */
  leftIcon?: React.ReactNode
  /** Trailing icon slot */
  rightIcon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, label, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id ?? `input-${Math.random().toString(36).slice(2, 7)}`

    return (
      <div className="w-full space-y-1.5">
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-brand-charcoal"
          >
            {label}
          </label>
        )}

        {/* Input wrapper */}
        <div className="relative flex items-center">
          {/* Left icon */}
          {leftIcon && (
            <span className="pointer-events-none absolute left-3 text-brand-muted">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={[
              'w-full rounded-xl border bg-white text-brand-charcoal placeholder:text-brand-muted',
              'px-4 py-2.5 text-sm',
              'transition-all duration-200',
              // Focus
              'focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-brand-purple',
              // Error
              error
                ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
                : 'border-brand-border',
              // Disabled
              'disabled:bg-brand-offwhite disabled:cursor-not-allowed disabled:opacity-60',
              // Icon padding
              leftIcon  ? 'pl-10' : '',
              rightIcon ? 'pr-10' : '',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            {...props}
          />

          {/* Right icon */}
          {rightIcon && (
            <span className="pointer-events-none absolute right-3 text-brand-muted">
              {rightIcon}
            </span>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p className="text-xs text-red-500 mt-1">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
