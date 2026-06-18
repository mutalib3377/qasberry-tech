'use client'
// components/dashboard/dashboard-client.tsx
// Rich student dashboard UI — enrollments, certificates, roadmap CTA.

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  BookOpen, Award, ArrowRight, Zap,
  LayoutDashboard, GraduationCap, ExternalLink,
} from 'lucide-react'

// Clerk UserButton must be lazy-loaded (ssr:false) to prevent hydration mismatch
const UserButton = dynamic(
  () => import('@clerk/nextjs').then((m) => m.UserButton),
  { ssr: false }
)

// ── Role labels ──────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN:     'Super Admin',
  CONTENT_MANAGER: 'Content Manager',
  MODERATOR:       'Moderator',
  STUDENT:         'Student',
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Enrollment {
  id:              string
  courseId:        string
  courseTitle:     string
  courseThumbnail: string | null
  career:          string
  lessonCount:     number
  completedCount:  number
  enrolledAt:      string
}

interface Certificate {
  id:         string
  courseTitle:string
  issuedAt:   string
  url:        string | null
}

interface Props {
  firstName:    string
  role:         string
  enrollments:  Enrollment[]
  certificates: Certificate[]
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color }: {
  label: string; value: number | string
  icon: React.ReactNode; color: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-5 rounded-2xl border ${color} flex items-center gap-4`}
    >
      <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-current/10 flex items-center justify-center opacity-80">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-sm text-slate-400">{label}</p>
      </div>
    </motion.div>
  )
}

// ── Enrollment card ───────────────────────────────────────────────────────────

function EnrollmentCard({ e, index }: { e: Enrollment; index: number }) {
  const pct = e.lessonCount > 0
    ? Math.round((e.completedCount / e.lessonCount) * 100)
    : 0
  const isComplete = pct === 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="group flex flex-col gap-4 p-5 rounded-2xl border border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70 transition-all"
    >
      {/* Thumbnail */}
      <div className="w-full h-32 rounded-xl bg-gradient-to-br from-violet-900/40 to-slate-800 flex items-center justify-center overflow-hidden">
        {e.courseThumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={e.courseThumbnail} alt={e.courseTitle} className="w-full h-full object-cover" />
        ) : (
          <BookOpen size={28} className="text-violet-500/50" />
        )}
      </div>

      {/* Info */}
      <div className="space-y-1 flex-1">
        <span className="inline-block px-2 py-0.5 text-[10px] font-medium rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20">
          {e.career}
        </span>
        <h3 className="text-white font-semibold text-sm leading-snug">{e.courseTitle}</h3>
        <p className="text-slate-500 text-xs">{e.completedCount} / {e.lessonCount} lessons completed</p>
      </div>

      {/* Progress bar */}
      {e.lessonCount > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className={isComplete ? 'text-emerald-400 font-medium' : 'text-slate-500'}>
              {isComplete ? '✓ Complete' : `${pct}% done`}
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isComplete ? 'bg-emerald-500' : 'bg-violet-500'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      <Link
        href={`/learn/${e.courseId}`}
        className="inline-flex items-center gap-1.5 text-violet-400 hover:text-violet-300 text-sm font-medium group-hover:gap-2.5 transition-all"
      >
        {isComplete ? 'Review course' : 'Continue learning'}
        <ArrowRight size={13} />
      </Link>
    </motion.div>
  )
}

// ── Certificate card ──────────────────────────────────────────────────────────

function CertCard({ c, index }: { c: Certificate; index: number }) {
  const issued = new Date(c.issuedAt).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      className="flex items-center gap-4 p-4 rounded-xl border border-amber-500/15 bg-amber-500/5 hover:border-amber-500/30 transition-colors"
    >
      <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
        <Award size={18} className="text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{c.courseTitle}</p>
        <p className="text-slate-500 text-xs">Issued {issued}</p>
      </div>
      {c.url && (
        <a
          href={c.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-500 hover:text-amber-400 transition-colors"
        >
          <ExternalLink size={14} />
        </a>
      )}
    </motion.div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function DashboardClient({ firstName, role, enrollments, certificates }: Props) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Background orb */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-violet-600/6 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Qasberry" width={30} height={30} className="rounded-xl" />
            <span className="text-white font-bold text-base">Qasberry</span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-violet-500/15 border border-violet-500/25 text-violet-300 text-xs font-medium tracking-wide">
              {ROLE_LABELS[role] ?? role}
            </span>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12 space-y-12">

        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Welcome back, {firstName} 👋
            </h1>
            <p className="text-slate-400 mt-1">Your Qasberry learning dashboard</p>
          </div>
          <Link
            id="dashboard-roadmap-btn"
            href="/onboarding"
            className="inline-flex items-center gap-2 px-5 py-3 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-violet-500/20"
          >
            <Zap size={14} />
            Build my roadmap
          </Link>
        </motion.div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Courses enrolled"
            value={enrollments.length}
            icon={<LayoutDashboard size={20} className="text-violet-400" />}
            color="border-violet-500/15 bg-violet-500/5"
          />
          <StatCard
            label="Certificates earned"
            value={certificates.length}
            icon={<Award size={20} className="text-amber-400" />}
            color="border-amber-500/15 bg-amber-500/5"
          />
          <StatCard
            label="Lessons completed"
            value={`${enrollments.reduce((s, e) => s + e.completedCount, 0)} / ${enrollments.reduce((s, e) => s + e.lessonCount, 0)}`}
            icon={<GraduationCap size={20} className="text-cyan-400" />}
            color="border-cyan-500/15 bg-cyan-500/5"
          />
        </div>

        {/* My Courses */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-white">My Courses</h2>
            <Link href="/#careers" className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
              Explore more →
            </Link>
          </div>

          {enrollments.length === 0 ? (
            <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/30 text-center space-y-3">
              <BookOpen size={32} className="mx-auto text-slate-600" />
              <p className="text-slate-400">You haven&apos;t enrolled in any courses yet.</p>
              <Link
                href="/#careers"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Browse career tracks <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {enrollments.map((e, i) => (
                <EnrollmentCard key={e.id} e={e} index={i} />
              ))}
            </div>
          )}
        </section>

        {/* Certificates */}
        <section>
          <h2 className="text-xl font-bold text-white mb-5">My Certificates</h2>
          {certificates.length === 0 ? (
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/30 text-center">
              <p className="text-slate-500 text-sm">Complete a course to earn your first certificate.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {certificates.map((c, i) => (
                <CertCard key={c.id} c={c} index={i} />
              ))}
            </div>
          )}
        </section>

        {/* Roadmap CTA card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-7 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-600/10 to-cyan-900/5 flex flex-col sm:flex-row items-center justify-between gap-5"
        >
          <div>
            <p className="text-white font-semibold text-lg">Not sure where to start?</p>
            <p className="text-slate-400 text-sm mt-1">
              Let our AI build you a personalised learning roadmap based on your career.
            </p>
          </div>
          <Link
            href="/onboarding"
            id="dashboard-bottom-roadmap-btn"
            className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-violet-500/20"
          >
            Get my roadmap <ArrowRight size={15} />
          </Link>
        </motion.div>
      </main>
    </div>
  )
}
