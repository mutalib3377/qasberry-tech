// app/(marketing)/courses/[slug]/page.tsx
// Public course detail page — description, curriculum preview, enroll CTA.
// Free lessons show a Mux preview. Paid → Paystack. Server component.

import { db }           from '@/lib/db'
import { notFound }     from 'next/navigation'
import { currentUser }  from '@clerk/nextjs/server'
import Link             from 'next/link'
import type { Metadata } from 'next'
import {
  BookOpen, Clock, Users, Zap, ChevronDown,
  CheckCircle2, Lock, Play, ArrowRight,
} from 'lucide-react'
import { MarketingNav } from '@/components/marketing/marketing-nav'
import { Footer }       from '@/components/marketing/footer'
import { EnrollButton } from '@/components/course/enroll-button'

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const course = await db.course.findUnique({
    where:   { slug: params.slug },
    select:  { title: true, description: true },
  })
  return {
    title:       course ? `${course.title} | Qasberry` : 'Course | Qasberry',
    description: course?.description ?? undefined,
  }
}

const DIFFICULTY_COLORS: Record<string, string> = {
  BEGINNER:     'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  INTERMEDIATE: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  ADVANCED:     'bg-rose-500/15 text-rose-400 border-rose-500/20',
}

export default async function CourseDetailPage({ params }: PageProps) {
  const [course, user] = await Promise.all([
    db.course.findUnique({
      where:   { slug: params.slug, status: 'PUBLISHED' },
      include: {
        career:  true,
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: { orderBy: { order: 'asc' } },
          },
        },
        _count: { select: { enrollments: true } },
      },
    }),
    currentUser(),
  ])

  if (!course) notFound()

  // Check if signed-in user is already enrolled
  let isEnrolled = false
  if (user) {
    const dbUser = await db.user.findUnique({ where: { clerkId: user.id } })
    if (dbUser) {
      const enrollment = await db.enrollment.findUnique({
        where: { userId_courseId: { userId: dbUser.id, courseId: course.id } },
      })
      isEnrolled = !!enrollment
    }
  }

  const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0)
  const freeLessons  = course.modules.flatMap((m) => m.lessons).filter((l) => l.isFree)

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-violet-600/6 blur-[120px]" />
      </div>

      <MarketingNav />

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* ── Left: course info ──────────────────────────────── */}
          <div className="lg:col-span-2 space-y-8">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-slate-500">
              <Link href="/courses" className="hover:text-white transition-colors">Courses</Link>
              <span>/</span>
              <span className="text-slate-400">{course.career.name}</span>
            </nav>

            {/* Header */}
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="px-2.5 py-1 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20 text-xs font-medium">
                  {course.career.name}
                </span>
                <span className={`px-2.5 py-1 rounded-full border text-xs font-medium ${DIFFICULTY_COLORS[course.difficulty] ?? ''}`}>
                  {course.difficulty[0] + course.difficulty.slice(1).toLowerCase()}
                </span>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight leading-tight">{course.title}</h1>
              {course.description && (
                <p className="text-slate-400 text-lg leading-relaxed">{course.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-5 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Users size={14} />
                  {course._count.enrollments} enrolled
                </span>
                <span className="flex items-center gap-1.5">
                  <BookOpen size={14} />
                  {totalLessons} lessons
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={14} />
                  {course.modules.length} modules
                </span>
              </div>
            </div>

            {/* Thumbnail */}
            {course.thumbnail && (
              <div className="w-full h-64 rounded-2xl overflow-hidden border border-slate-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
              </div>
            )}

            {/* Free lesson previews */}
            {freeLessons.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-base font-semibold text-white">Free Previews</h2>
                <div className="space-y-2">
                  {freeLessons.slice(0, 3).map((lesson) => (
                    <div
                      key={lesson.id}
                      className="flex items-center gap-3 p-3.5 rounded-xl border border-emerald-500/15 bg-emerald-500/5"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                        <Play size={13} className="text-emerald-400" />
                      </div>
                      <span className="text-slate-300 text-sm">{lesson.title}</span>
                      <span className="ml-auto text-emerald-400 text-xs font-medium">Free</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Curriculum */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">Curriculum</h2>
              <div className="space-y-3">
                {course.modules.map((mod) => (
                  <details key={mod.id} className="group rounded-xl border border-slate-800 bg-slate-900/30 overflow-hidden">
                    <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-900/60 transition-colors list-none">
                      <div className="flex items-center gap-3">
                        <BookOpen size={15} className="text-violet-400 flex-shrink-0" />
                        <span className="text-white font-medium text-sm">{mod.title}</span>
                        <span className="text-slate-500 text-xs">({mod.lessons.length} lessons)</span>
                      </div>
                      <ChevronDown size={15} className="text-slate-500 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="border-t border-slate-800 divide-y divide-slate-800">
                      {mod.lessons.map((lesson) => (
                        <div key={lesson.id} className="flex items-center gap-3 px-5 py-3">
                          {lesson.isFree
                            ? <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
                            : <Lock size={13} className="text-slate-600 flex-shrink-0" />
                          }
                          <span className="text-slate-400 text-sm flex-1">{lesson.title}</span>
                          {lesson.isFree && (
                            <span className="text-emerald-400 text-xs">Free</span>
                          )}
                          {lesson.duration && (
                            <span className="text-slate-600 text-xs">
                              {Math.floor(lesson.duration / 60)}m
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: enroll card (sticky) ────────────────────── */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm space-y-5">
              {/* Price */}
              <div>
                {course.isFree ? (
                  <p className="text-3xl font-extrabold text-emerald-400">FREE</p>
                ) : (
                  <p className="text-3xl font-extrabold text-white">
                    ${Number(course.price).toLocaleString()}
                  </p>
                )}
              </div>

              {/* Enroll button */}
              {isEnrolled ? (
                <Link
                  href={`/learn/${course.id}`}
                  id="continue-learning-btn"
                  className="flex items-center justify-center gap-2 w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-colors"
                >
                  Continue learning <ArrowRight size={15} />
                </Link>
              ) : user ? (
                <EnrollButton
                  courseId={course.id}
                  price={Number(course.price)}
                  isFree={course.isFree}
                />
              ) : (
                <Link
                  href="/sign-in"
                  id="signin-to-enroll-btn"
                  className="flex items-center justify-center gap-2 w-full py-3.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-colors"
                >
                  Sign in to enroll <ArrowRight size={15} />
                </Link>
              )}

              {/* What you get */}
              <ul className="space-y-2.5 pt-2 border-t border-slate-800">
                {[
                  `${totalLessons} lessons across ${course.modules.length} modules`,
                  'Lifetime access',
                  'Certificate on completion',
                  course.isFree ? 'Completely free' : 'One-time payment',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-slate-400 text-sm">
                    <Zap size={12} className="text-violet-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  )
}
