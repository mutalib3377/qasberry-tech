'use client'
// components/marketing/hero-section.tsx
// Full-screen animated hero with gradient orbs and career input CTA.

import { motion } from 'framer-motion'
import Link from 'next/link'
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs'
import { ArrowRight, Sparkles } from 'lucide-react'

const PROFESSIONS = [
  'Nurse', 'Lawyer', 'Teacher', 'Engineer',
  'Doctor', 'Designer', 'Accountant', 'Journalist',
]

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-6 pt-24 pb-16">
      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-cyan-600/8 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-purple-900/10 blur-[140px]" />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm font-medium"
        >
          <Sparkles size={14} />
          AI-powered personalised learning
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08]"
        >
          <span className="text-white">Tell Qasberry</span>
          <br />
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 45%, #06b6d4 100%)',
            }}
          >
            who you are.
          </span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed text-balance"
        >
          Get your personalised AI learning roadmap and be ahead of everyone in your field —
          whether you&apos;re a{' '}
          <span className="text-white font-medium">
            {PROFESSIONS.slice(0, 4).join(', ')}
          </span>{' '}
          or anything in between.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
        >
          <SignedOut>
            <SignInButton mode="modal">
              <button
                id="hero-get-started-btn"
                className="group inline-flex items-center gap-2.5 px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-2xl transition-all duration-200 shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 text-lg"
              >
                Get my roadmap
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </SignInButton>
            <Link
              href="/#features"
              className="inline-flex items-center gap-2 px-8 py-4 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white font-medium rounded-2xl transition-all duration-200 backdrop-blur-sm text-lg"
            >
              Learn more
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              href="/onboarding"
              id="hero-roadmap-btn"
              className="group inline-flex items-center gap-2.5 px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-2xl transition-all duration-200 shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 text-lg"
            >
              Build my roadmap
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white font-medium rounded-2xl transition-all duration-200 text-lg"
            >
              My Dashboard
            </Link>
          </SignedIn>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex items-center justify-center gap-3 pt-4"
        >
          <div className="flex -space-x-2">
            {['#7c3aed','#2563eb','#059669','#d97706','#dc2626'].map((color, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border-2 border-[#0a0a0f] flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: color }}
              >
                {['N','L','T','E','D'][i]}
              </div>
            ))}
          </div>
          <p className="text-slate-500 text-sm">
            Join professionals already learning with Qasberry
          </p>
        </motion.div>

        {/* Floating profession pills */}
        <div className="hidden lg:flex items-center justify-center gap-3 pt-2 flex-wrap">
          {PROFESSIONS.map((p, i) => (
            <motion.span
              key={p}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + i * 0.07 }}
              className="px-3 py-1.5 rounded-full border border-white/8 bg-white/5 text-slate-400 text-xs backdrop-blur-sm"
            >
              {p}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  )
}
