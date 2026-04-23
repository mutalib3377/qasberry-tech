'use client'
// components/marketing/cta-banner.tsx
// Bottom CTA section before footer.

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs'
import Link from 'next/link'
import { ArrowRight, Zap } from 'lucide-react'

interface Props {
  courseCount: number
}

export function CtaBanner({ courseCount }: Props) {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="py-24 px-6" ref={ref}>
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-600/20 via-purple-900/10 to-cyan-900/10 p-12 text-center"
        >
          {/* Glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-violet-600/15 blur-[80px]" />
          </div>

          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm font-medium">
              <Zap size={13} />
              {courseCount > 0 ? `${courseCount} course${courseCount !== 1 ? 's' : ''} available now` : 'Launching soon'}
            </div>

            <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
              Your AI future starts today.
            </h2>

            <p className="text-slate-400 text-lg max-w-xl mx-auto text-balance">
              Join Qasberry, get your free personalised roadmap, and become the AI-forward professional your industry needs.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <SignedOut>
                <SignInButton mode="modal">
                  <button
                    id="cta-get-started-btn"
                    className="group inline-flex items-center gap-2.5 px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50 text-lg"
                  >
                    Get started — it&apos;s free
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/onboarding"
                  id="cta-roadmap-btn"
                  className="group inline-flex items-center gap-2.5 px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50 text-lg"
                >
                  Build my roadmap
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </SignedIn>
            </div>

            <p className="text-slate-600 text-sm">No credit card required · Cancel any time</p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
