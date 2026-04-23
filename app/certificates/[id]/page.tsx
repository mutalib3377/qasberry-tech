// app/certificates/[id]/page.tsx
// Publicly shareable certificate page — viewable by anyone with the link.
// Server component. Shows course name, student name, issue date.

import { db }       from '@/lib/db'
import { notFound } from 'next/navigation'
import Link         from 'next/link'
import type { Metadata } from 'next'
import { Award, Zap, CheckCircle2 } from 'lucide-react'

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cert = await db.certificate.findUnique({
    where:   { id: params.id },
    include: { course: { select: { title: true } }, user: { select: { name: true } } },
  })
  return {
    title: cert
      ? `Certificate — ${cert.course.title} | Qasberry`
      : 'Certificate | Qasberry',
  }
}

export default async function CertificatePage({ params }: Props) {
  const cert = await db.certificate.findUnique({
    where:   { id: params.id },
    include: {
      course: { include: { career: true } },
      user:   { select: { name: true, email: true } },
    },
  })

  if (!cert) notFound()

  const issued = new Date(cert.issuedAt).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center p-6">
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-600/6 blur-[120px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-violet-600/6 blur-[100px]" />
      </div>

      {/* Certificate card */}
      <div className="relative z-10 w-full max-w-2xl">
        {/* Back link */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="text-white font-bold">Qasberry</span>
          </Link>
          <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
            Dashboard →
          </Link>
        </div>

        {/* Certificate */}
        <div className="p-1 rounded-3xl bg-gradient-to-br from-amber-500/30 via-violet-500/20 to-cyan-500/20">
          <div className="bg-[#0d0d14] rounded-[22px] p-10 text-center space-y-7">

            {/* Icon */}
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center">
                  <Award size={36} className="text-amber-400" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#0d0d14] flex items-center justify-center">
                  <CheckCircle2 size={13} className="text-white" />
                </div>
              </div>
            </div>

            {/* Certificate title */}
            <div className="space-y-2">
              <p className="text-slate-500 text-sm uppercase tracking-widest font-medium">
                Certificate of Completion
              </p>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {cert.course.title}
              </h1>
              <span className="inline-block px-3 py-1 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20 text-xs font-medium">
                {cert.course.career.name}
              </span>
            </div>

            {/* Divider */}
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent mx-auto" />

            {/* Student & date */}
            <div className="space-y-1">
              <p className="text-slate-500 text-xs">This certifies that</p>
              <p className="text-2xl font-bold text-white">
                {cert.user.name ?? cert.user.email}
              </p>
              <p className="text-slate-500 text-sm">
                successfully completed this course on {issued}
              </p>
            </div>

            {/* Qasberry stamp */}
            <div className="flex items-center justify-center gap-2 pt-2">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center">
                <Zap size={10} className="text-white" />
              </div>
              <span className="text-slate-500 text-xs">Issued by Qasberry AI Academy</span>
            </div>
          </div>
        </div>

        {/* Share bar */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            id="copy-cert-link-btn"
            onClick={() => {
              if (typeof window !== 'undefined') {
                navigator.clipboard.writeText(window.location.href)
              }
            }}
            className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 text-sm transition-colors"
          >
            Copy link
          </button>
          <Link
            href={`/dashboard`}
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
