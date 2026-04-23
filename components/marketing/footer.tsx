// components/marketing/footer.tsx
// Site footer for all marketing pages.

import Link from 'next/link'
import { Zap } from 'lucide-react'

const LINKS = {
  Platform: [
    { label: 'Features',    href: '/#features' },
    { label: 'Careers',     href: '/#careers' },
    { label: 'How it works',href: '/#how' },
  ],
  Learn: [
    { label: 'My Dashboard',href: '/dashboard' },
    { label: 'My Roadmap',  href: '/onboarding' },
  ],
  Legal: [
    { label: 'Privacy',     href: '/privacy' },
    { label: 'Terms',       href: '/terms' },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-white/5 py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-12 justify-between">
          {/* Brand */}
          <div className="space-y-4 max-w-xs">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center">
                <Zap size={16} className="text-white" />
              </div>
              <span className="text-white font-bold text-lg tracking-tight">Qasberry</span>
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed">
              The AI learning academy built for every professional — not just tech people.
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-3 gap-8">
            {Object.entries(LINKS).map(([group, items]) => (
              <div key={group}>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-4">
                  {group}
                </p>
                <ul className="space-y-2.5">
                  {items.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-600 text-sm">
            © {new Date().getFullYear()} Qasberry. All rights reserved.
          </p>
          <p className="text-slate-700 text-xs">
            Built with ♥ for AI-forward professionals everywhere.
          </p>
        </div>
      </div>
    </footer>
  )
}
