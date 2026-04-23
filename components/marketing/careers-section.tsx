'use client'
// components/marketing/careers-section.tsx
// Career tracks grid — fetched server-side, rendered with animations.

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, BookOpen } from 'lucide-react'
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs'

// Career → gradient colour mapping (cycles through palette by index)
const CARD_PALETTES = [
  { bg: 'from-violet-500/15 to-purple-900/10',  border: 'border-violet-500/20',  dot: 'bg-violet-500',  text: 'text-violet-400' },
  { bg: 'from-blue-500/15 to-blue-900/10',       border: 'border-blue-500/20',    dot: 'bg-blue-500',    text: 'text-blue-400' },
  { bg: 'from-cyan-500/15 to-cyan-900/10',       border: 'border-cyan-500/20',    dot: 'bg-cyan-500',    text: 'text-cyan-400' },
  { bg: 'from-emerald-500/15 to-green-900/10',   border: 'border-emerald-500/20', dot: 'bg-emerald-500', text: 'text-emerald-400' },
  { bg: 'from-amber-500/15 to-yellow-900/10',    border: 'border-amber-500/20',   dot: 'bg-amber-500',   text: 'text-amber-400' },
  { bg: 'from-rose-500/15 to-red-900/10',        border: 'border-rose-500/20',    dot: 'bg-rose-500',    text: 'text-rose-400' },
]

interface Career {
  id:          string
  name:        string
  slug:        string
  courseCount: number
}

interface Props {
  careers: Career[]
}

export function CareersSection({ careers }: Props) {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="careers" className="py-24 px-6 relative" ref={ref}>
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-950/5 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16 space-y-3"
        >
          <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest">
            Career Tracks
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
            Built for your profession
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto text-balance">
            From healthcare to finance, law to education — Qasberry has a dedicated AI learning track for your career.
          </p>
        </motion.div>

        {/* Careers grid */}
        {careers.length === 0 ? (
          <div className="text-center py-16 text-slate-600">
            Career tracks coming soon — check back shortly!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {careers.map((career, i) => {
              const palette = CARD_PALETTES[i % CARD_PALETTES.length]
              return (
                <motion.div
                  key={career.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className={`group p-6 rounded-2xl bg-gradient-to-br border ${palette.bg} ${palette.border} hover:scale-[1.02] transition-all duration-300 cursor-pointer`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${palette.dot}`} />
                    <span className={`flex items-center gap-1 text-xs ${palette.text}`}>
                      <BookOpen size={11} />
                      {career.courseCount} {career.courseCount === 1 ? 'course' : 'courses'}
                    </span>
                  </div>
                  <h3 className="text-white font-bold text-xl mb-2 leading-tight">{career.name}</h3>
                  <p className="text-slate-500 text-sm mb-5">
                    AI skills tailored for {career.name.toLowerCase()} professionals.
                  </p>
                  <SignedOut>
                    <SignInButton mode="modal">
                      <button className={`inline-flex items-center gap-1.5 text-sm font-medium ${palette.text} group-hover:gap-2.5 transition-all`}>
                        Start this track
                        <ArrowRight size={14} />
                      </button>
                    </SignInButton>
                  </SignedOut>
                  <SignedIn>
                    <Link
                      href="/onboarding"
                      className={`inline-flex items-center gap-1.5 text-sm font-medium ${palette.text} group-hover:gap-2.5 transition-all`}
                    >
                      Start this track
                      <ArrowRight size={14} />
                    </Link>
                  </SignedIn>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
