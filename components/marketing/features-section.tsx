// components/marketing/features-section.tsx
// "Why Qasberry" 6-feature grid — original dark design restored.

import { Map, BookOpen, Clock, Users, ShieldCheck, Lock } from 'lucide-react'

const FEATURES = [
  { icon: Map,         title: 'AI-Personalised Roadmap',    body: 'Strategic paths tailored to your specific professional objectives and experience level.'          },
  { icon: BookOpen,    title: 'Career-Specific Courses',    body: 'Industry-vetted content focusing on the AI tools that actually matter in your field.'              },
  { icon: Clock,       title: 'Learn at Your Pace',         body: 'Bite-sized modules designed to fit into a busy professional schedule.'                            },
  { icon: Users,       title: 'Peer Communities',           body: 'Connect with other professionals in your field who are also adopting AI.'                         },
  { icon: ShieldCheck, title: 'Verified Certificates',      body: 'Earn credentials that demonstrate your AI proficiency to employers.'                              },
  { icon: Lock,        title: 'Responsible AI Focus',       body: 'Training on ethics, security, and the safe implementation of AI tools in your workplace.'        },
]

export function FeaturesSection() {
  return (
    <section className="bg-[#0a0a0f] py-20 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Heading */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 mb-4">
            <span className="text-xs font-semibold text-violet-400 uppercase tracking-widest">Why Qasberry</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
            Everything you need to master AI
          </h2>
          <p className="text-slate-500 text-base max-w-xl mx-auto">
            Not a generic MOOC. A focused, career-first AI platform built for professionals who don&apos;t have time to waste.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-violet-500/20 hover:bg-white/[0.05] transition-all duration-200 group"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4 group-hover:bg-violet-500/20 transition-colors">
                <Icon size={18} className="text-violet-400" strokeWidth={1.5} />
              </div>
              <h3 className="text-white font-semibold mb-2">{title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
