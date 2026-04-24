'use client'
// components/marketing/qasberry-bot-input.tsx
// Frosted-glass career search pill — for the dark hero section.
// On submit: POST /api/bot/roadmap → navigate to /roadmap?career=...
// Clicking a career chip pre-fills the input.

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2, Bot } from 'lucide-react'

const CHIPS = [
  { label: 'Nurse',     emoji: '👩‍⚕️' },
  { label: 'Lawyer',    emoji: '⚖️'  },
  { label: 'Teacher',   emoji: '🧑‍🏫' },
  { label: 'Developer', emoji: '💻'  },
  { label: 'Marketer',  emoji: '📊'  },
]

export function QasberryBotInput() {
  const [value,   setValue]   = useState('')
  const [loading, setLoading] = useState(false)
  const router    = useRouter()
  const inputRef  = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const query = value.trim()
    if (!query || loading) return

    setLoading(true)
    try {
      const res  = await fetch('/api/bot/roadmap', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: query }),
      })
      const data = await res.json()
      const career = data?.career ?? query
      router.push(`/roadmap?career=${encodeURIComponent(career)}`)
    } catch {
      router.push(`/roadmap?career=${encodeURIComponent(query)}`)
    } finally {
      setLoading(false)
    }
  }

  function fillCareer(label: string) {
    setValue(`I am a ${label} looking to use AI in my work`)
    inputRef.current?.focus()
  }

  return (
    <div className="w-full space-y-4">
      {/* ── Input row ─────────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="flex items-center gap-0 w-full">
        {/* Bot icon */}
        <div className="pl-5 pr-3 text-slate-500 flex-shrink-0">
          <Bot size={20} />
        </div>

        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. I am a Senior Nurse looking to automate documentation..."
          className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-white placeholder:text-slate-500 text-sm py-3 min-w-0"
        />

        {/* Submit button */}
        <button
          type="submit"
          disabled={!value.trim() || loading}
          className="flex-shrink-0 flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-6 py-3 rounded-full transition-all duration-200 m-1 shadow-lg shadow-violet-600/30"
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <>Show my roadmap <ArrowRight size={14} /></>
          )}
        </button>
      </form>

      {/* ── Career chips ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap justify-center gap-2.5 pt-1">
        {CHIPS.map(({ label, emoji }) => (
          <button
            key={label}
            type="button"
            onClick={() => fillCareer(label)}
            className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/10 hover:border-white/25 hover:text-white transition-all duration-200"
          >
            {emoji} {label}
          </button>
        ))}
      </div>
    </div>
  )
}
