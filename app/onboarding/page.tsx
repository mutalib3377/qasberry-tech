'use client'
// app/onboarding/page.tsx
// AI Roadmap bot — the centrepiece Phase 3 feature.
// User enters their career; AI returns a personalised 8-step roadmap.

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight, Loader2, RotateCcw, CheckCircle2,
  BookOpen, Wrench, Bot, Database, MessageSquare,
  TrendingUp, Shield, Palette, Home, Lock, Zap,
} from 'lucide-react'
import type { Roadmap, RoadmapSkillTag } from '@/types'

// ── Skill tag colours & icons ───────────────────────────────────────────────

const TAG_META: Record<RoadmapSkillTag, { color: string; icon: React.ReactNode; label: string }> = {
  fundamentals:  { color: 'bg-violet-500/15 text-violet-400 border-violet-500/20',   icon: <CheckCircle2 size={12} />, label: 'Fundamentals' },
  tools:         { color: 'bg-blue-500/15 text-blue-400 border-blue-500/20',         icon: <Wrench size={12} />,       label: 'Tools' },
  automation:    { color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',         icon: <Bot size={12} />,           label: 'Automation' },
  data:          { color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',icon: <Database size={12} />,     label: 'Data' },
  communication: { color: 'bg-sky-500/15 text-sky-400 border-sky-500/20',            icon: <MessageSquare size={12} />,label: 'Communication' },
  strategy:      { color: 'bg-amber-500/15 text-amber-400 border-amber-500/20',      icon: <TrendingUp size={12} />,   label: 'Strategy' },
  safety:        { color: 'bg-rose-500/15 text-rose-400 border-rose-500/20',         icon: <Shield size={12} />,       label: 'Safety' },
  creativity:    { color: 'bg-pink-500/15 text-pink-400 border-pink-500/20',         icon: <Palette size={12} />,      label: 'Creativity' },
}

// ── Suggestion pills ─────────────────────────────────────────────────────────
const SUGGESTIONS = [
  'Nurse', 'Lawyer', 'Teacher', 'Civil Engineer',
  'Accountant', 'Social Worker', 'Pharmacist', 'HR Manager',
]

// ── Step card component ──────────────────────────────────────────────────────
function StepCard({ step, index }: { step: Roadmap['steps'][number]; index: number }) {
  const meta = TAG_META[step.skillTag] ?? TAG_META.fundamentals
  const hasCourse = !!step.courseId
  const priceLabel = step.isFree
    ? 'Free'
    : step.price != null && Number(step.price) > 0
      ? `₦${Number(step.price).toLocaleString()}`
      : null

  const inner = (
    <div
      className={`group relative flex gap-4 p-5 rounded-2xl border transition-all ${
        hasCourse
          ? 'border-slate-800 bg-slate-900/40 hover:border-violet-500/50 hover:bg-slate-900/70 cursor-pointer'
          : 'border-slate-800 bg-slate-900/40'
      }`}
    >
      {/* Step number */}
      <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
        <span className="text-slate-400 text-sm font-bold font-mono">{String(step.order).padStart(2, '0')}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-white font-semibold text-base leading-snug">{step.title}</h3>
          <div className="flex items-center gap-2 flex-shrink-0">
            {priceLabel && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${
                step.isFree
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                  : 'bg-blue-500/15 text-blue-400 border-blue-500/20'
              }`}>
                {step.isFree ? <Zap size={10} /> : <Lock size={10} />}
                {priceLabel}
              </span>
            )}
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${meta.color}`}>
              {meta.icon}
              {meta.label}
            </span>
          </div>
        </div>
        <p className="text-slate-400 text-sm leading-relaxed">{step.description}</p>
        {hasCourse && (
          <p className="text-violet-400 text-xs font-medium group-hover:text-violet-300 transition-colors flex items-center gap-1">
            Start course <ArrowRight size={11} />
          </p>
        )}
      </div>
    </div>
  )

  if (hasCourse && step.courseId) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.08 }}
      >
        <Link href={`/courses/${step.courseSlug ?? step.courseId}`}>
          {inner}
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      {inner}
    </motion.div>
  )
}


// ── Main page ────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const searchParams  = useSearchParams()
  const [careerInput, setCareerInput] = useState(() => searchParams.get('career') ?? '')
  const [loading,     setLoading]     = useState(false)
  const [roadmap,     setRoadmap]     = useState<Roadmap | null>(null)
  const [error,       setError]       = useState<string | null>(null)

  // Auto-generate if the hero bot input navigated here with ?career=...
  useEffect(() => {
    const pre = searchParams.get('career')
    if (pre) generateRoadmap(pre)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function generateRoadmap(career?: string) {
    const input = (career ?? careerInput).trim()
    if (!input) return
    if (!career) setCareerInput(input)

    setLoading(true)
    setError(null)
    setRoadmap(null)

    try {
      const res  = await fetch('/api/bot/roadmap', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ careerInput: input }),
      })
      const data = await res.json() as { success: boolean; data?: Roadmap; error?: string }

      if (data.success && data.data) {
        setRoadmap(data.data)
      } else {
        setError(data.error ?? 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setRoadmap(null)
    setError(null)
    setCareerInput('')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Background orb */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-600/8 blur-[120px]" />
      </div>

      {/* Nav strip */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Qasberry" width={30} height={30} className="rounded-xl" />
          <span className="text-white font-bold text-base">Qasberry</span>
        </Link>
        <Link href="/dashboard" className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors">
          <Home size={14} />
          Dashboard
        </Link>
      </header>

      <main className="relative z-10 max-w-2xl mx-auto px-6 py-16 space-y-12">

        {/* Input phase */}
        <AnimatePresence mode="wait">
          {!roadmap && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              {/* Header */}
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm font-medium">
                  <Bot size={14} />
                  AI Roadmap Generator
                </div>
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                  What&apos;s your career?
                </h1>
                <p className="text-slate-400 text-lg">
                  Tell us your profession and we&apos;ll instantly build a personalised AI learning roadmap just for you.
                </p>
              </div>

              {/* Input */}
              <div className="space-y-4">
                <div className="relative">
                  <input
                    id="career-input"
                    value={careerInput}
                    onChange={(e) => setCareerInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') generateRoadmap() }}
                    placeholder="e.g. Paediatric Nurse, Family Lawyer, Secondary School Teacher…"
                    className="w-full px-5 py-4 pr-14 rounded-2xl bg-slate-900 border border-slate-700 text-white text-base placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all"
                    disabled={loading}
                  />
                  <button
                    id="generate-roadmap-btn"
                    onClick={() => generateRoadmap()}
                    disabled={loading || !careerInput.trim()}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 rounded-xl flex items-center justify-center transition-colors"
                  >
                    {loading
                      ? <Loader2 size={16} className="animate-spin text-white" />
                      : <ArrowRight size={16} className="text-white" />
                    }
                  </button>
                </div>

                {/* Suggestion pills */}
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setCareerInput(s); generateRoadmap(s) }}
                      disabled={loading}
                      className="px-3 py-1.5 rounded-xl border border-slate-700 hover:border-violet-500/50 bg-slate-900 hover:bg-violet-500/10 text-slate-400 hover:text-violet-300 text-xs transition-all disabled:opacity-40"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 text-sm">
                  {error}
                </div>
              )}

              {/* Loading state */}
              {loading && (
                <div className="flex flex-col items-center gap-4 py-8 text-center">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-2 border-violet-500/20" />
                    <div className="absolute inset-0 rounded-full border-2 border-t-violet-500 animate-spin" />
                    <div className="absolute inset-3 rounded-full bg-violet-600/20 flex items-center justify-center">
                      <Bot size={16} className="text-violet-400" />
                    </div>
                  </div>
                  <div>
                    <p className="text-white font-medium">Analysing your career…</p>
                    <p className="text-slate-500 text-sm mt-1">Our AI is personalising your roadmap</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Roadmap phase */}
          {roadmap && (
            <motion.div
              key="roadmap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Roadmap header */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-medium">
                    <Bot size={12} />
                    Your personalised roadmap
                  </div>
                  <button
                    id="reset-roadmap-btn"
                    onClick={reset}
                    className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm transition-colors"
                  >
                    <RotateCcw size={13} />
                    Try again
                  </button>
                </div>

                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                  AI Roadmap for{' '}
                  <span
                    className="bg-clip-text text-transparent"
                    style={{ backgroundImage: 'linear-gradient(135deg,#7c3aed,#a78bfa,#06b6d4)' }}
                  >
                    {roadmap.career}
                  </span>
                </h1>
                <p className="text-slate-400 text-base leading-relaxed">{roadmap.summary}</p>
              </motion.div>

              {/* Steps — or empty state */}
              {roadmap.steps.length > 0 ? (
                <>
                  <div className="flex items-center gap-2 text-xs text-slate-500 -mb-1">
                    <BookOpen size={12} />
                    <span>{roadmap.steps.length} course{roadmap.steps.length !== 1 ? 's' : ''} matched to your career</span>
                  </div>
                  <div className="space-y-3">
                    {roadmap.steps.map((step, i) => (
                      <StepCard key={step.order} step={step} index={i} />
                    ))}
                  </div>

                  {/* CTA after roadmap */}
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="p-6 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-600/10 to-cyan-900/5 text-center space-y-4"
                  >
                    <div className="flex items-center justify-center gap-2 text-violet-300">
                      <BookOpen size={18} />
                      <span className="font-semibold">Ready to start learning?</span>
                    </div>
                    <p className="text-slate-400 text-sm">
                      Click any course above to get started, or browse all available courses on your dashboard.
                    </p>
                    <Link
                      id="browse-courses-btn"
                      href="/dashboard"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-violet-500/20"
                    >
                      Go to dashboard
                      <ArrowRight size={15} />
                    </Link>
                  </motion.div>
                </>
              ) : (
                /* No relevant courses found for this career */
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-8 rounded-2xl border border-slate-800 bg-slate-900/40 text-center space-y-4"
                >
                  <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto">
                    <BookOpen size={24} className="text-slate-500" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-white font-semibold">No courses yet for this career</h3>
                    <p className="text-slate-400 text-sm max-w-sm mx-auto">
                      {roadmap.summary}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <button
                      onClick={reset}
                      className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-sm font-medium rounded-xl transition-colors"
                    >
                      <RotateCcw size={13} /> Try a different career
                    </button>
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                      Browse all courses <ArrowRight size={13} />
                    </Link>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
