'use client'
// components/marketing/features-section.tsx
// Feature highlights grid with animated entrance on scroll.

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { Brain, Zap, BookOpen, Award, Users, Shield } from 'lucide-react'

const FEATURES = [
  {
    icon:    <Brain size={24} />,
    color:   'from-violet-500/20 to-violet-600/5 border-violet-500/15 text-violet-400',
    title:   'AI-Personalised Roadmap',
    desc:    'Tell us your career. Our AI instantly builds an 8-step learning roadmap tailored to how AI impacts your specific field.',
  },
  {
    icon:    <BookOpen size={24} />,
    color:   'from-blue-500/20 to-blue-600/5 border-blue-500/15 text-blue-400',
    title:   'Career-Specific Courses',
    desc:    'Expert-led video courses built for your profession — not generic AI tutorials. Learn only what\'s relevant to you.',
  },
  {
    icon:    <Zap size={24} />,
    color:   'from-cyan-500/20 to-cyan-600/5 border-cyan-500/15 text-cyan-400',
    title:   'Learn at Your Pace',
    desc:    'Modular lessons you can complete in minutes. Progress is saved automatically so you can pick up exactly where you left off.',
  },
  {
    icon:    <Users size={24} />,
    color:   'from-emerald-500/20 to-emerald-600/5 border-emerald-500/15 text-emerald-400',
    title:   'Peer Communities',
    desc:    'Connect with professionals in your career track. Share challenges, discoveries, and real-world AI applications.',
  },
  {
    icon:    <Award size={24} />,
    color:   'from-amber-500/20 to-amber-600/5 border-amber-500/15 text-amber-400',
    title:   'Verified Certificates',
    desc:    'Earn a Qasberry certificate on course completion — shareable on LinkedIn to demonstrate your AI proficiency.',
  },
  {
    icon:    <Shield size={24} />,
    color:   'from-rose-500/20 to-rose-600/5 border-rose-500/15 text-rose-400',
    title:   'Responsible AI Focus',
    desc:    'Every course includes an ethics and safety module covering bias, privacy, and responsible AI adoption in your field.',
  },
]

export function FeaturesSection() {
  const ref    = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="features" className="py-24 px-6" ref={ref}>
      <div className="max-w-7xl mx-auto">
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16 space-y-3"
        >
          <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest">
            Why Qasberry
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
            Everything you need to master AI
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto text-balance">
            Not a generic MOOC. A focused, career-first AI platform built for professionals who don&apos;t have time to waste.
          </p>
        </motion.div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative p-6 rounded-2xl bg-gradient-to-br border backdrop-blur-sm group hover:scale-[1.02] transition-transform duration-300 ${f.color}`}
            >
              <div className="mb-4">{f.icon}</div>
              <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
