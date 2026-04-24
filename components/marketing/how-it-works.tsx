// components/marketing/how-it-works.tsx
// "How it works" 3-step section — original dark design restored.

const STEPS = [
  {
    number: '01',
    title:  'Define Your Goal',
    body:   "Describe your role and what you want to achieve with AI. Qasberry's engine analyses your industry context.",
  },
  {
    number: '02',
    title:  'Get Your AI Roadmap',
    body:   'Receive a customised curriculum featuring the exact AI tools and workflows most relevant to your job.',
  },
  {
    number: '03',
    title:  'Learn & Earn Credentials',
    body:   'Complete bite-sized modules, practise with AI assistants, and earn verified professional certificates.',
  },
]

export function HowItWorks() {
  return (
    <section id="how" className="bg-[#0d0d14] py-20 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Heading */}
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
            How Qasberry works
          </h2>
          <p className="text-slate-500 text-base max-w-lg mx-auto">
            Your transition to AI-enhanced work in three simple steps.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((step, i) => (
            <div key={step.number} className="relative pl-6">
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-5 left-full w-full h-px bg-gradient-to-r from-violet-500/30 to-transparent -translate-y-1/2 z-0" />
              )}

              {/* Step number */}
              <div className="text-5xl font-bold text-violet-500/10 leading-none mb-5 select-none">
                {step.number}
              </div>

              <h3 className="text-white font-semibold text-lg mb-2">{step.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
