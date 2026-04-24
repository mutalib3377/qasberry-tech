'use client'
// components/marketing/hero-section.tsx
// Original dark Qasberry hero — restored.
// Adds the career AI search input as the primary CTA, replacing the plain button.

import { motion } from 'framer-motion'
import { QasberryBotInput } from './qasberry-bot-input'

const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: (d: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.65, ease: 'easeOut', delay: d },
  }),
}

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0a0a0f] pt-16">

      {/* ── Background radials ───────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top-right violet glow */}
        <div className="absolute top-[-20%] right-[-10%] w-[700px] h-[700px] bg-violet-600/15 rounded-full blur-[120px]" />
        {/* Bottom-left cyan glow */}
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[100px]" />
        {/* Center subtle glow beneath content */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[400px] bg-violet-800/10 rounded-full blur-[80px]" />
      </div>

      {/* ── Subtle grid overlay ──────────────────────────────────────────── */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">

        {/* Top badge */}
        <motion.div
          initial="hidden" animate="visible" custom={0}
          variants={fadeUp}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-slate-400 text-xs font-medium tracking-widest uppercase">
            AI Learning for Every Career
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial="hidden" animate="visible" custom={0.1}
          variants={fadeUp}
          className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.08] tracking-tight mb-6"
        >
          Tell Qasberry{' '}
          <span className="gradient-text">who you are.</span>
          <br />
          Get ahead of AI in your field.
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial="hidden" animate="visible" custom={0.2}
          variants={fadeUp}
          className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed mb-10"
        >
          Personalised AI education roadmaps for every profession.
          Master the tools reshaping your industry — starting today.
        </motion.p>

        {/* ── Career search input — the main CTA ─────────────────────────── */}
        <motion.div
          initial="hidden" animate="visible" custom={0.3}
          variants={fadeUp}
          className="mb-10"
        >
          {/*
            Decorative container that makes the input feel elevated:
            layered glow border + glass backdrop.
          */}
          <div className="relative max-w-3xl mx-auto">
            {/* Outer purple glow ring */}
            <div className="absolute -inset-px rounded-full bg-gradient-to-r from-violet-600/40 via-transparent to-cyan-500/40 blur-sm" />

            {/* Inner glass surface */}
            <div className="relative rounded-full bg-white/[0.06] backdrop-blur-xl border border-white/10 p-1.5 shadow-2xl shadow-black/40">
              <QasberryBotInput />
            </div>
          </div>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial="hidden" animate="visible" custom={0.45}
          variants={fadeUp}
          className="flex items-center justify-center gap-6 text-xs text-slate-600"
        >
          <span className="flex items-center gap-1.5">
            <span className="text-emerald-500">✓</span> No credit card required
          </span>
          <span className="w-px h-3 bg-slate-800" />
          <span className="flex items-center gap-1.5">
            <span className="text-emerald-500">✓</span> Free roadmap in seconds
          </span>
          <span className="w-px h-3 bg-slate-800" />
          <span className="flex items-center gap-1.5">
            <span className="text-emerald-500">✓</span> 8 career tracks
          </span>
        </motion.div>
      </div>

      {/* ── Bottom fade into next section ────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0f] to-transparent pointer-events-none" />
    </section>
  )
}
