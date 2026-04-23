'use client'
// components/marketing/how-it-works.tsx
// Step-by-step "How Qasberry works" section.

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { MessageSquare, Cpu, BookOpen, Award } from 'lucide-react'

const STEPS = [
  {
    number: '01',
    icon:   <MessageSquare size={22} />,
    title:  'Tell us your career',
    desc:   'Enter your profession or job title. The more specific the better — "paediatric nurse" beats "healthcare worker".',
    color:  'text-violet-400 border-violet-500/30 bg-violet-500/10',
  },
  {
    number: '02',
    icon:   <Cpu size={22} />,
    title:  'AI builds your roadmap',
    desc:   'In seconds, our AI analyses how AI is transforming your field and generates a personalised 8-step learning pathway.',
    color:  'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
  },
  {
    number: '03',
    icon:   <BookOpen size={22} />,
    title:  'Complete your courses',
    desc:   'Watch career-specific video lessons, complete quizzes, and track your progress — all at your own pace.',
    color:  'text-blue-400 border-blue-500/30 bg-blue-500/10',
  },
  {
    number: '04',
    icon:   <Award size={22} />,
    title:  'Earn your certificate',
    desc:   'Get a verified Qasberry certificate on completion. Share it on LinkedIn and stand out as an AI-forward professional.',
    color:  'text-amber-400 border-amber-500/30 bg-amber-500/10',
  },
]

export function HowItWorks() {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="how" className="py-24 px-6" ref={ref}>
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-20 space-y-3"
        >
          <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest">
            How it works
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
            From career to certified in 4 steps
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto text-balance">
            No setup required. No fluff. Just a clear, direct path to becoming AI-proficient in your field.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line (desktop) */}
          <div className="hidden lg:block absolute top-12 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="flex flex-col items-center text-center gap-4"
              >
                {/* Icon circle */}
                <div className={`relative w-20 h-20 rounded-2xl border flex items-center justify-center ${step.color} flex-shrink-0`}>
                  {step.icon}
                  <span className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-[10px] text-slate-400 font-bold font-mono">
                    {step.number}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-white font-semibold text-lg">{step.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
