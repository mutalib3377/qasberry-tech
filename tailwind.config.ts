// tailwind.config.ts
// Qasberry Tailwind CSS configuration.
// Extends the default theme with the Inter font variable, design tokens,
// and animation utilities used across all phases.

import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        // Maps to the CSS variable set by next/font/google in layout.tsx
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      colors: {
        // ── Semantic CSS-variable tokens (existing) ──────────────────────────
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: 'var(--card)',
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },

        // ── Qasberry Brand Design Tokens (Phase A) ───────────────────────────
        brand: {
          purple:         '#5B4BD5', // primary CTA, active states
          'purple-dark':  '#4A3BBF', // hover on purple buttons
          'purple-light': '#7B6FE8', // soft glow, focus rings
          navy:           '#1A1040', // hero background, dark sections
          lavender:       '#A89CEC', // career pills, subtle accents
          charcoal:       '#1C1C1E', // admin sidebar background
          offwhite:       '#F8F8FA', // light section backgrounds, card fills
          border:         '#E4E4E7', // card borders on light backgrounds
          muted:          '#71717A', // secondary text, placeholder text
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        // Used by the Qasberry bot floating animation (Phase 3)
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        // Gentle pulsing glow for the bot character
        glow: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        // Staggered reveal for roadmap steps (Phase 3)
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Shimmer for loading skeletons
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        glow: 'glow 3s ease-in-out infinite',
        'fade-up': 'fade-up 0.5s ease-out forwards',
        shimmer: 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
}

export default config
