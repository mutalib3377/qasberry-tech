'use client'
// components/marketing/marketing-nav.tsx
// Sticky navigation bar for all public marketing pages.

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'
import { Zap, Menu, X } from 'lucide-react'

export function MarketingNav() {
  const [scrolled,      setScrolled]      = useState(false)
  const [mobileOpen,    setMobileOpen]    = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/5 shadow-xl shadow-black/20'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:shadow-violet-500/50 transition-shadow">
            <Zap size={16} className="text-white" />
          </div>
          <span className="text-white font-bold tracking-tight text-lg">Qasberry</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/#features" className="text-slate-400 hover:text-white text-sm transition-colors">Features</Link>
          <Link href="/#careers"  className="text-slate-400 hover:text-white text-sm transition-colors">Careers</Link>
          <Link href="/community" className="text-slate-400 hover:text-white text-sm transition-colors">Community</Link>
          <Link href="/#how"      className="text-slate-400 hover:text-white text-sm transition-colors">How it works</Link>
        </nav>

        {/* Auth */}
        <div className="hidden md:flex items-center gap-3">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-slate-400 hover:text-white text-sm transition-colors">
                Sign in
              </button>
            </SignInButton>
            <SignInButton mode="modal">
              <button
                id="nav-get-started-btn"
                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-violet-500/20"
              >
                Get started free
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Dashboard
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-slate-400 hover:text-white transition-colors"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-white/5 px-6 py-5 space-y-4">
          <Link href="/#features" onClick={() => setMobileOpen(false)} className="block text-slate-300 hover:text-white py-2 text-sm">Features</Link>
          <Link href="/#careers"  onClick={() => setMobileOpen(false)} className="block text-slate-300 hover:text-white py-2 text-sm">Careers</Link>
          <Link href="/community" onClick={() => setMobileOpen(false)} className="block text-slate-300 hover:text-white py-2 text-sm">Community</Link>
          <Link href="/#how"      onClick={() => setMobileOpen(false)} className="block text-slate-300 hover:text-white py-2 text-sm">How it works</Link>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="w-full mt-2 px-4 py-3 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors">
                Get started free
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className="block w-full px-4 py-3 bg-violet-600 text-white text-sm font-semibold rounded-xl text-center">
              Dashboard
            </Link>
          </SignedIn>
        </div>
      )}
    </header>
  )
}
