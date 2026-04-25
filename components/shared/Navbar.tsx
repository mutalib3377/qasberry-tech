'use client'
// components/shared/Navbar.tsx
// Qasberry public navigation bar.
//
// Two visual states managed by scroll listener:
//   transparent  — over the dark hero section (top of page)
//   white + blur — once user scrolls past 60px
//
// Desktop: links + Sign in text + Get started button
// Mobile:  hamburger icon → full-screen Framer Motion drawer

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'
import { Menu, X, Zap } from 'lucide-react'
import { Button } from '@/components/shared/Button'

// ── Nav links config ──────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: 'Courses',   href: '/courses'   },
  { label: 'Careers',   href: '/#careers'  },
  { label: 'Community', href: '/community' },
  { label: 'Pricing',   href: '/#pricing'  },
]

// ── Framer variants ───────────────────────────────────────────────────────────

const drawerVariants = {
  closed: { x: '100%', opacity: 0 },
  open:   { x: '0%',  opacity: 1, transition: { type: 'tween' as const, duration: 0.28, ease: 'easeOut' as const } },
  exit:   { x: '100%', opacity: 0, transition: { type: 'tween' as const, duration: 0.22, ease: 'easeIn'  as const } },
}

const linkVariants = {
  closed: { opacity: 0, x: 24 },
  open:   (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.08 + i * 0.06, ease: 'easeOut' as const, duration: 0.22 },
  }),
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Navbar() {
  const [scrolled,   setScrolled]   = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  const closeDrawer = () => setDrawerOpen(false)

  return (
    <>
      {/* ── Main header ───────────────────────────────────────────────────── */}
      <header
        className={[
          'fixed top-0 left-0 right-0 z-50',
          'transition-all duration-300',
          scrolled
            ? 'bg-white/90 backdrop-blur-xl border-b border-brand-border shadow-sm'
            : 'bg-transparent',
        ].join(' ')}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 flex-shrink-0 group"
          >
            <div className="w-8 h-8 rounded-lg bg-brand-purple flex items-center justify-center shadow-md shadow-brand-purple/30 group-hover:shadow-brand-purple/50 transition-shadow">
              <Zap size={16} className="text-white" />
            </div>
            <span
              className={`font-bold tracking-tight text-lg transition-colors ${
                scrolled ? 'text-brand-charcoal' : 'text-white'
              }`}
            >
              Qasberry
            </span>
          </Link>

          {/* Desktop links */}
          <nav className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={[
                  'text-sm font-medium transition-colors',
                  scrolled
                    ? 'text-brand-muted hover:text-brand-charcoal'
                    : 'text-white/70 hover:text-white',
                ].join(' ')}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
            <SignedOut>
              <SignInButton mode="modal">
                <button
                  className={`text-sm font-medium transition-colors ${
                    scrolled
                      ? 'text-brand-muted hover:text-brand-charcoal'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  Sign in
                </button>
              </SignInButton>
              <SignInButton mode="modal">
                <Button size="sm" id="nav-get-started-btn">
                  Get started free
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button size="sm" variant="secondary">Dashboard</Button>
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setDrawerOpen(true)}
            className={`md:hidden p-2 rounded-lg transition-colors ${
              scrolled
                ? 'text-brand-charcoal hover:bg-brand-offwhite'
                : 'text-white hover:bg-white/10'
            }`}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      {/* ── Mobile full-screen drawer ──────────────────────────────────────── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDrawer}
              className="fixed inset-0 z-50 bg-brand-navy/60 backdrop-blur-sm"
            />

            {/* Drawer panel */}
            <motion.div
              key="drawer"
              variants={drawerVariants}
              initial="closed"
              animate="open"
              exit="exit"
              className="fixed top-0 right-0 z-50 h-full w-80 bg-white shadow-2xl flex flex-col"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-brand-border">
                <Link href="/" onClick={closeDrawer} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-brand-purple flex items-center justify-center">
                    <Zap size={13} className="text-white" />
                  </div>
                  <span className="font-bold text-brand-charcoal">Qasberry</span>
                </Link>
                <button
                  onClick={closeDrawer}
                  className="p-1.5 rounded-lg text-brand-muted hover:bg-brand-offwhite transition-colors"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Drawer links */}
              <nav className="flex-1 px-6 py-6 space-y-1">
                {NAV_LINKS.map((link, i) => (
                  <motion.div key={link.href} custom={i} variants={linkVariants} initial="closed" animate="open">
                    <Link
                      href={link.href}
                      onClick={closeDrawer}
                      className="block px-3 py-3 rounded-xl text-sm font-medium text-brand-muted hover:text-brand-charcoal hover:bg-brand-offwhite transition-colors"
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* Drawer auth */}
              <div className="px-6 py-6 border-t border-brand-border space-y-3">
                <SignedOut>
                  <SignInButton mode="modal">
                    <Button variant="secondary" className="w-full" onClick={closeDrawer}>
                      Sign in
                    </Button>
                  </SignInButton>
                  <SignInButton mode="modal">
                    <Button className="w-full" onClick={closeDrawer}>
                      Get started free
                    </Button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <Link href="/dashboard" onClick={closeDrawer}>
                    <Button className="w-full">Go to Dashboard</Button>
                  </Link>
                </SignedIn>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
