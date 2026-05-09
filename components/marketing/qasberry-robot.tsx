'use client'
// components/marketing/qasberry-robot.tsx
// Animated hovering robot "Qasberry" — greets the user on the hero with
// a typewriter speech bubble before they enter their career.

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/* ── Messages Qasberry cycles through ───────────────────────────────────── */
const MESSAGES = [
  "Hi! I'm Qasberry 👋 Tell me your career…",
  "I'll build your personal AI roadmap in seconds ⚡",
  'Already helped nurses, lawyers, teachers & more 🚀',
  'No tech background needed — just your profession 🎯',
  "What do you do for a living? Let's get started! 💡",
]

/* ── Typewriter hook ─────────────────────────────────────────────────────── */
function useTypewriter(text: string, speed = 38) {
  const [displayed, setDisplayed] = useState('')
  useEffect(() => {
    setDisplayed('')
    let i = 0
    const id = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) clearInterval(id)
    }, speed)
    return () => clearInterval(id)
  }, [text, speed])
  return displayed
}

/* ── Robot SVG ───────────────────────────────────────────────────────────── */
function RobotSVG({ blink }: { blink: boolean }) {
  return (
    <svg
      viewBox="0 0 120 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full drop-shadow-[0_0_24px_rgba(139,92,246,0.55)]"
    >
      {/* ── Antenna ── */}
      <line x1="60" y1="4" x2="60" y2="18" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" />
      <circle cx="60" cy="4" r="4" fill="#a78bfa">
        <animate attributeName="opacity" values="1;0.3;1" dur="1.4s" repeatCount="indefinite" />
      </circle>

      {/* ── Head ── */}
      <rect x="22" y="18" width="76" height="58" rx="16" fill="#1e1b4b" stroke="#7c3aed" strokeWidth="2" />

      {/* Head top shine */}
      <rect x="30" y="22" width="60" height="10" rx="5" fill="white" opacity="0.05" />

      {/* ── Eyes ── */}
      {/* Left eye */}
      <rect x="34" y="34" width="20" height={blink ? 2 : 16} rx="4" fill="#7c3aed"
        style={{ transition: 'height 0.08s ease', transformOrigin: '44px 42px' }} />
      <rect x="36" y="36" width="8" height={blink ? 0 : 6} rx="2" fill="#c4b5fd" opacity="0.6"
        style={{ transition: 'height 0.08s' }} />

      {/* Right eye */}
      <rect x="66" y="34" width="20" height={blink ? 2 : 16} rx="4" fill="#06b6d4"
        style={{ transition: 'height 0.08s ease', transformOrigin: '76px 42px' }} />
      <rect x="68" y="36" width="8" height={blink ? 0 : 6} rx="2" fill="#a5f3fc" opacity="0.6"
        style={{ transition: 'height 0.08s' }} />

      {/* Eye glow when open */}
      {!blink && (
        <>
          <ellipse cx="44" cy="48" rx="10" ry="5" fill="#7c3aed" opacity="0.25" />
          <ellipse cx="76" cy="48" rx="10" ry="5" fill="#06b6d4" opacity="0.25" />
        </>
      )}

      {/* ── Mouth / speaker grille ── */}
      <rect x="38" y="60" width="44" height="8" rx="4" fill="#312e81" stroke="#7c3aed" strokeWidth="1" />
      <rect x="44" y="62" width="6" height="4" rx="1" fill="#7c3aed" opacity="0.8">
        <animate attributeName="opacity" values="0.8;0.3;0.8" dur="0.6s" repeatCount="indefinite" />
      </rect>
      <rect x="54" y="62" width="6" height="4" rx="1" fill="#7c3aed" opacity="0.5">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="0.6s" begin="0.1s" repeatCount="indefinite" />
      </rect>
      <rect x="64" y="62" width="6" height="4" rx="1" fill="#7c3aed" opacity="0.8">
        <animate attributeName="opacity" values="0.8;0.3;0.8" dur="0.6s" begin="0.2s" repeatCount="indefinite" />
      </rect>

      {/* ── Neck ── */}
      <rect x="50" y="76" width="20" height="10" rx="4" fill="#1e1b4b" stroke="#7c3aed" strokeWidth="1.5" />

      {/* ── Body ── */}
      <rect x="18" y="86" width="84" height="50" rx="14" fill="#1e1b4b" stroke="#7c3aed" strokeWidth="2" />

      {/* Body chest panel */}
      <rect x="34" y="96" width="52" height="28" rx="8" fill="#0f0e2a" stroke="#7c3aed" strokeWidth="1" />

      {/* Chest lights */}
      <circle cx="46" cy="110" r="5" fill="#7c3aed">
        <animate attributeName="fill" values="#7c3aed;#a78bfa;#7c3aed" dur="1.8s" repeatCount="indefinite" />
      </circle>
      <circle cx="60" cy="110" r="5" fill="#06b6d4">
        <animate attributeName="fill" values="#06b6d4;#67e8f9;#06b6d4" dur="1.4s" begin="0.3s" repeatCount="indefinite" />
      </circle>
      <circle cx="74" cy="110" r="5" fill="#7c3aed">
        <animate attributeName="fill" values="#7c3aed;#a78bfa;#7c3aed" dur="2s" begin="0.6s" repeatCount="indefinite" />
      </circle>

      {/* ── Arms ── */}
      {/* Left arm */}
      <rect x="2" y="88" width="16" height="36" rx="8" fill="#1e1b4b" stroke="#7c3aed" strokeWidth="1.5">
        <animateTransform attributeName="transform" type="rotate"
          values="0 10 106; 8 10 106; 0 10 106" dur="3s" repeatCount="indefinite" />
      </rect>
      {/* Right arm */}
      <rect x="102" y="88" width="16" height="36" rx="8" fill="#1e1b4b" stroke="#7c3aed" strokeWidth="1.5">
        <animateTransform attributeName="transform" type="rotate"
          values="0 110 106; -8 110 106; 0 110 106" dur="3s" repeatCount="indefinite" />
      </rect>

      {/* ── Bottom edge highlight ── */}
      <rect x="30" y="130" width="60" height="4" rx="2" fill="#7c3aed" opacity="0.3" />
    </svg>
  )
}

/* ── Main component ──────────────────────────────────────────────────────── */
export function QasberryRobot() {
  const [msgIndex, setMsgIndex]   = useState(0)
  const [blink,    setBlink]      = useState(false)
  const [showBubble, setShowBubble] = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cycle through messages
  useEffect(() => {
    const rotate = () => {
      setShowBubble(false)
      setTimeout(() => {
        setMsgIndex(i => (i + 1) % MESSAGES.length)
        setShowBubble(true)
      }, 400)
    }
    timerRef.current = setInterval(rotate, 4500)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  // Blink every ~3-4 seconds
  useEffect(() => {
    const doBlink = () => {
      setBlink(true)
      setTimeout(() => setBlink(false), 150)
    }
    const blinkLoop = () => {
      doBlink()
      setTimeout(blinkLoop, 3000 + Math.random() * 1500)
    }
    const id = setTimeout(blinkLoop, 2000)
    return () => clearTimeout(id)
  }, [])

  const typed = useTypewriter(MESSAGES[msgIndex], 36)

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      {/* ── Speech bubble ────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {showBubble && (
          <motion.div
            key={msgIndex}
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative max-w-xs px-5 py-3 rounded-2xl bg-white/[0.07] border border-violet-500/30 backdrop-blur-md shadow-lg shadow-violet-900/20"
          >
            <p className="text-white text-sm leading-relaxed min-h-[2.5rem]">
              {typed}
              {/* blinking cursor */}
              <span className="inline-block w-0.5 h-4 bg-violet-400 ml-0.5 animate-pulse align-middle" />
            </p>
            {/* bubble tail pointing down */}
            <span
              className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-0 h-0"
              style={{
                borderLeft: '10px solid transparent',
                borderRight: '10px solid transparent',
                borderTop: '10px solid rgba(139,92,246,0.30)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating robot ───────────────────────────────────────────────── */}
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        className="relative w-28 h-36"
      >
        {/* Glow platform beneath robot */}
        <motion.div
          animate={{ scaleX: [1, 0.82, 1], opacity: [0.6, 0.3, 0.6] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-20 h-4 rounded-full bg-violet-600/40 blur-md"
        />

        <RobotSVG blink={blink} />
      </motion.div>

      {/* ── Name label ───────────────────────────────────────────────────── */}
      <motion.span
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className="text-xs text-violet-400 font-semibold tracking-widest uppercase"
      >
        Qasberry AI
      </motion.span>
    </div>
  )
}
