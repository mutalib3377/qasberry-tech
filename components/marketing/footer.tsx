'use client'
// components/marketing/footer.tsx
// Qasberry 4-column marketing footer.
// Columns: Brand + tagline | Platform links | Learn links | Newsletter signup
// Newsletter input uses shared Input + Button components.

import Link from 'next/link'
import { useState } from 'react'
import { Zap, ArrowRight, Globe, ExternalLink, Share2 } from 'lucide-react'
import { Input } from '@/components/shared/Input'
import { Button } from '@/components/shared/Button'

// ── Link columns config ───────────────────────────────────────────────────────

const PLATFORM_LINKS = [
  { label: 'Features',     href: '/#features' },
  { label: 'Careers',      href: '/#careers'  },
  { label: 'How It Works', href: '/#how'      },
  { label: 'Pricing',      href: '/#pricing'  },
  { label: 'Community',    href: '/community' },
]

const LEARN_LINKS = [
  { label: 'Browse Courses', href: '/courses'    },
  { label: 'My Dashboard',   href: '/dashboard'  },
  { label: 'My Roadmap',     href: '/onboarding' },
  { label: 'Certificates',   href: '/dashboard'  },
]

const LEGAL_LINKS = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Use',   href: '/terms'   },
  { label: 'Cookie Policy',  href: '/cookies' },
]

const SOCIAL_LINKS = [
  { label: 'Twitter',  href: 'https://twitter.com',  icon: Share2       },
  { label: 'LinkedIn', href: 'https://linkedin.com', icon: ExternalLink },
  { label: 'Website',  href: 'https://qasberry.com', icon: Globe        },
]


// ── Component ─────────────────────────────────────────────────────────────────

export function Footer() {
  const [email,     setEmail]     = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleNewsletter(e: React.FormEvent) {
    e.preventDefault()
    if (email.trim()) {
      // No newsletter backend yet — show confirmation, store nothing sensitive
      setSubmitted(true)
      setEmail('')
    }
  }

  return (
    <footer className="bg-brand-navy text-white">

      {/* ── Main grid ─────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Col 1 — Brand */}
          <div className="space-y-5">
            <Link href="/" className="flex items-center gap-2.5 group w-fit">
              <div className="w-8 h-8 rounded-lg bg-brand-purple flex items-center justify-center shadow-md shadow-brand-purple/30">
                <Zap size={16} className="text-white" />
              </div>
              <span className="font-bold tracking-tight text-lg">Qasberry</span>
            </Link>

            <p className="text-sm text-white/50 leading-relaxed max-w-[220px]">
              The AI learning academy built for every professional—not just tech people.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-brand-purple/80 flex items-center justify-center transition-colors"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Col 2 — Platform */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-white/40">
              Platform
            </h4>
            <ul className="space-y-2.5">
              {PLATFORM_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-white/55 hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Learn */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-white/40">
              Learn
            </h4>
            <ul className="space-y-2.5">
              {LEARN_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-white/55 hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="pt-2 space-y-2.5">
              {LEGAL_LINKS.map(({ label, href }) => (
                <div key={label}>
                  <Link
                    href={href}
                    className="text-xs text-white/35 hover:text-white/60 transition-colors"
                  >
                    {label}
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Col 4 — Newsletter */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-white/40">
              Stay in the loop
            </h4>
            <p className="text-sm text-white/50 leading-relaxed">
              Get AI learning tips, new course launches, and career insights—weekly.
            </p>

            {submitted ? (
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                <span>✓</span>
                <span>You&apos;re subscribed!</span>
              </div>
            ) : (
              <form onSubmit={handleNewsletter} className="space-y-2.5">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/10 border-white/10 text-white placeholder:text-white/30 focus:ring-brand-lavender focus:border-brand-lavender"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="w-full gap-1.5"
                >
                  Subscribe <ArrowRight size={13} />
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom bar ──────────────────────────────────────────────────────── */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} Qasberry. All rights reserved.
          </p>
          <p className="text-xs text-white/20">
            Built with ♥ for AI-forward professionals everywhere.
          </p>
        </div>
      </div>
    </footer>
  )
}
