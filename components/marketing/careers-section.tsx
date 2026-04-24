// components/marketing/careers-section.tsx
// "Career Tracks" grid — original dark design restored.

import Link from 'next/link'

interface Career { id: string; name: string; slug: string; courseCount: number }
interface Props   { careers: Career[] }

const CAREER_META: Record<string, { emoji: string; description: string }> = {
  developer:    { emoji: '💻', description: 'Master Copilot, AI-driven debugging, and LLM integration.'           },
  entrepreneur: { emoji: '🚀', description: 'Automate operations and leverage AI for rapid scaling.'              },
  kid:          { emoji: '🌟', description: 'Fun, safe introductions to how AI works and creates.'                },
  lawyer:       { emoji: '⚖️', description: 'Legal research and document analysis with AI assistance.'            },
  marketer:     { emoji: '📊', description: 'AI for content strategy, SEO, and predictive analytics.'            },
  nurse:        { emoji: '👩‍⚕️', description: 'Documentation automation and patient monitoring AI tools.'       },
  student:      { emoji: '🎓', description: 'AI study habits and research tools for the modern student.'         },
  teacher:      { emoji: '🧑‍🏫', description: 'Lesson planning and personalised learning paths with AI.'        },
}
const DEFAULT_META = { emoji: '✨', description: 'Discover how AI can transform your professional workflow.' }

export function CareersSection({ careers }: Props) {
  return (
    <section id="careers" className="bg-[#0a0a0f] py-20 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Heading */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-widest">Career Tracks</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
            Built for your profession
          </h2>
          <p className="text-slate-500 text-base max-w-xl mx-auto">
            From healthcare to finance, law to education — Qasberry has a dedicated AI learning track for your career.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {careers.map((career) => {
            const meta = CAREER_META[career.slug] ?? DEFAULT_META
            return (
              <Link
                key={career.id}
                href={`/courses?career=${career.slug}`}
                className="group p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-violet-500/30 hover:bg-white/[0.06] transition-all duration-200 flex flex-col"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl">{meta.emoji}</span>
                  <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
                    {career.courseCount} {career.courseCount === 1 ? 'course' : 'courses'}
                  </span>
                </div>
                <h3 className="text-white font-semibold mb-1.5 text-sm">{career.name}</h3>
                <p className="text-slate-600 text-xs leading-relaxed flex-1">{meta.description}</p>
                <p className="text-violet-500 text-xs font-semibold mt-4 group-hover:text-violet-400 transition-colors">
                  Start this track →
                </p>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
