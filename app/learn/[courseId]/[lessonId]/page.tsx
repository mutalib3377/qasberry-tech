'use client'
// app/learn/[courseId]/[lessonId]/page.tsx
// Course learning experience: Mux video player, curriculum sidebar, progress tracking.

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle2, Circle, Lock, ChevronRight,
  ChevronLeft, Award, Zap, Menu, X,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Lesson {
  id:            string
  title:         string
  order:         number
  isFree:        boolean
  duration:      number | null
  muxPlaybackId: string | null // only returned for enrolled lessons
  videoUrl:      string | null // external link: YouTube, Drive, Vimeo, Loom
  pdfUrl:        string | null // external PDF link
}

interface Module {
  id:      string
  title:   string
  order:   number
  lessons: Lesson[]
}

interface CourseData {
  id:      string
  title:   string
  modules: Module[]
}

// ── Mux Video Player ─────────────────────────────────────────────────────────

function MuxPlayer({ playbackId, onEnded }: { playbackId: string; onEnded: () => void }) {
  return (
    <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden">
      <iframe
        src={`https://stream.mux.com/${playbackId}.m3u8`}
        className="w-full h-full"
        allow="autoplay; fullscreen"
        allowFullScreen
        onEnded={onEnded}
      />
    </div>
  )
}

// ── External Video Player ─────────────────────────────────────────────────────
// Converts raw share URLs from YouTube, Google Drive, Vimeo, and Loom
// into embeddable iframe src URLs.

function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)

    // YouTube: https://www.youtube.com/watch?v=ID or https://youtu.be/ID
    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
      const id = u.hostname.includes('youtu.be')
        ? u.pathname.slice(1)
        : u.searchParams.get('v')
      if (!id) return null
      return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`
    }

    // Google Drive: https://drive.google.com/file/d/FILE_ID/view
    if (u.hostname.includes('drive.google.com')) {
      const match = u.pathname.match(/\/file\/d\/([^/]+)/)
      if (!match) return null
      return `https://drive.google.com/file/d/${match[1]}/preview`
    }

    // Vimeo: https://vimeo.com/ID
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean).pop()
      if (!id) return null
      return `https://player.vimeo.com/video/${id}?title=0&byline=0`
    }

    // Loom: https://www.loom.com/share/ID
    if (u.hostname.includes('loom.com')) {
      const id = u.pathname.split('/').filter(Boolean).pop()
      if (!id) return null
      return `https://www.loom.com/embed/${id}`
    }

    // Fallback: try embedding as-is
    return url
  } catch {
    return null
  }
}

function ExternalVideoPlayer({ videoUrl }: { videoUrl: string }) {
  const embedUrl = getEmbedUrl(videoUrl)

  if (!embedUrl) {
    return (
      <div className="w-full aspect-video bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-center">
        <p className="text-slate-500 text-sm">Unable to embed this video link.</p>
      </div>
    )
  }

  return (
    <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
      <iframe
        src={embedUrl}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        title="Lesson video"
      />
    </div>
  )
}

// ── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  return (
    <div className="flex items-center gap-3 text-xs text-slate-500">
      <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-violet-600 to-cyan-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span>{pct}%</span>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

interface PageProps {
  params: { courseId: string; lessonId: string }
}

// This is a client component that fetches its own data from the API
export default function LearnPage({ params }: PageProps) {
  const { courseId, lessonId } = params
  const router = useRouter()

  const [course,     setCourse]     = useState<CourseData | null>(null)
  const [lesson,     setLesson]     = useState<Lesson | null>(null)
  const [completed,  setCompleted]  = useState<Set<string>>(new Set())
  const [total,      setTotal]      = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading,    setLoading]    = useState(true)
  const [marking,    setMarking]    = useState(false)
  const [certIssued, setCertIssued] = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  // Fetch course + progress
  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [courseRes, progressRes] = await Promise.all([
          fetch(`/api/learn/${courseId}`),
          fetch(`/api/progress?courseId=${courseId}`),
        ])
        const courseData    = await courseRes.json()
        const progressData  = await progressRes.json()

        if (!courseData.success)   { setError('Course not found.'); return }
        if (!progressData.success) { setError('Could not load progress.'); return }

        setCourse(courseData.data)
        setCompleted(new Set(progressData.data.completedLessonIds as string[]))
        setTotal(progressData.data.total as number)

        // Find the current lesson
        const allLessons = (courseData.data as CourseData).modules.flatMap((m) => m.lessons)
        const cur = allLessons.find((l) => l.id === lessonId)
        setLesson(cur ?? allLessons[0] ?? null)
      } catch {
        setError('Failed to load. Please refresh.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [courseId, lessonId])

  const markComplete = useCallback(async () => {
    if (!lesson || completed.has(lesson.id) || marking) return
    setMarking(true)
    try {
      const res  = await fetch('/api/progress', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ lessonId: lesson.id, courseId }),
      })
      const data = await res.json()
      if (data.success) {
        setCompleted((prev) => new Set(Array.from(prev).concat(lesson.id)))
        setTotal(data.data.total)
        if (data.data.certificateIssued) setCertIssued(true)
      }
    } finally {
      setMarking(false)
    }
  }, [lesson, completed, marking, courseId])

  // Navigate to adjacent lesson
  function goToLesson(id: string) {
    router.push(`/learn/${courseId}/${id}`)
  }

  const allLessons = course?.modules.flatMap((m) => m.lessons) ?? []
  const currentIdx = allLessons.findIndex((l) => l.id === lessonId)
  const prevLesson = allLessons[currentIdx - 1] ?? null
  const nextLesson = allLessons[currentIdx + 1] ?? null

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-violet-500/20" />
          <div className="absolute inset-0 rounded-full border-2 border-t-violet-500 animate-spin" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-rose-400">{error}</p>
          <Link href="/dashboard" className="text-violet-400 hover:text-violet-300 text-sm">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#0a0a0f] text-white flex flex-col overflow-hidden">

      {/* ── Topbar ─────────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center">
              <Zap size={11} className="text-white" />
            </div>
            <span className="text-sm font-bold text-white hidden sm:block">Qasberry</span>
          </Link>
          {course && (
            <>
              <span className="text-slate-700">/</span>
              <span className="text-slate-400 text-sm truncate max-w-[200px]">{course.title}</span>
            </>
          )}
        </div>
        <ProgressBar completed={completed.size} total={total} />
      </header>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar curriculum */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.aside
              key="sidebar"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0 border-r border-white/5 overflow-y-auto bg-[#0d0d14]"
            >
              <div className="p-4 space-y-4 min-w-[300px]">
                {course?.modules.map((mod) => (
                  <div key={mod.id} className="space-y-1">
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-2 pb-1">
                      {mod.title}
                    </p>
                    {mod.lessons.map((l) => {
                      const isDone    = completed.has(l.id)
                      const isCurrent = l.id === lessonId
                      return (
                        <button
                          key={l.id}
                          onClick={() => goToLesson(l.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors text-sm ${
                            isCurrent
                              ? 'bg-violet-600/20 text-white border border-violet-600/25'
                              : 'text-slate-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {isDone
                            ? <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
                            : isCurrent
                              ? <Circle size={14} className="text-violet-400 flex-shrink-0" />
                              : <Lock size={14} className="text-slate-600 flex-shrink-0" />
                          }
                          <span className="truncate flex-1">{l.title}</span>
                          {l.duration && (
                            <span className="text-slate-600 text-xs flex-shrink-0">
                              {Math.floor(l.duration / 60)}m
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

            {/* Certificate issued toast */}
            <AnimatePresence>
              {certIssued && (
                <motion.div
                  initial={{ opacity: 0, y: -16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3 p-4 rounded-xl border border-amber-500/25 bg-amber-500/10"
                >
                  <Award size={18} className="text-amber-400 flex-shrink-0" />
                  <div>
                    <p className="text-amber-300 font-semibold text-sm">Certificate earned! 🎉</p>
                    <p className="text-amber-400/70 text-xs">Find it in your dashboard.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Video player — external link takes priority, then Mux */}
            {lesson?.videoUrl ? (
              <ExternalVideoPlayer videoUrl={lesson.videoUrl} />
            ) : lesson?.muxPlaybackId ? (
              <MuxPlayer
                playbackId={lesson.muxPlaybackId}
                onEnded={markComplete}
              />
            ) : (
              <div className="w-full aspect-video bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <Zap size={32} className="mx-auto text-violet-500/30" />
                  <p className="text-slate-600 text-sm">Video not yet available</p>
                </div>
              </div>
            )}

            {/* PDF / Reading material link */}
            {lesson?.pdfUrl && (
              <a
                href={lesson.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-blue-500/25 bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
              >
                <span className="text-blue-400 text-sm font-medium">📄 Open reading material</span>
                <span className="text-blue-400/60 text-xs ml-auto">Opens in new tab →</span>
              </a>
            )}

            {/* Lesson title + mark complete */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-white">{lesson?.title}</h1>
                {lesson?.duration && (
                  <p className="text-slate-500 text-sm mt-1">
                    {Math.floor(lesson.duration / 60)}m {lesson.duration % 60}s
                  </p>
                )}
              </div>
              <button
                id="mark-complete-btn"
                onClick={markComplete}
                disabled={!lesson || completed.has(lesson.id) || marking}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  lesson && completed.has(lesson.id)
                    ? 'bg-emerald-600/20 border border-emerald-600/25 text-emerald-400 cursor-default'
                    : 'bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50'
                }`}
              >
                {lesson && completed.has(lesson.id)
                  ? <><CheckCircle2 size={14} /> Completed</>
                  : <>{marking ? 'Saving…' : 'Mark Complete'}</>
                }
              </button>
            </div>

            {/* Prev / Next navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              {prevLesson ? (
                <button
                  onClick={() => goToLesson(prevLesson.id)}
                  className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
              ) : <div />}

              {nextLesson ? (
                <button
                  onClick={() => { markComplete(); goToLesson(nextLesson.id) }}
                  className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  Next lesson
                  <ChevronRight size={16} />
                </button>
              ) : (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  <Award size={14} />
                  Finish course
                </Link>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
