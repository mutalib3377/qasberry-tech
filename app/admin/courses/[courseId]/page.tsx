// app/admin/courses/[courseId]/page.tsx
// Admin: View a single course with its modules and lessons.
// Read-only detail view — links to edit page for changes.

import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { isAdminRole, canManageCourses } from '@/lib/auth'
import type { UserRole } from '@/types'
import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ChevronLeft,
  Edit2,
  BookOpen,
  Users,
  Video,
  Lock,
  Unlock,
  CheckCircle,
  Clock,
  Archive,
  Globe,
} from 'lucide-react'

interface PageProps {
  params: { courseId: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const course = await db.course.findUnique({ where: { id: params.courseId }, select: { title: true } })
  return { title: course?.title ?? 'Course' }
}

const STATUS_CONFIG = {
  PUBLISHED: { label: 'Published', icon: <Globe size={12} />,   cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  DRAFT:     { label: 'Draft',     icon: <Clock size={12} />,    cls: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  ARCHIVED:  { label: 'Archived',  icon: <Archive size={12} />,  cls: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
}

const DIFFICULTY_LABELS: Record<string, string> = {
  BEGINNER:     'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED:     'Advanced',
}

export default async function AdminCourseDetailPage({ params }: PageProps) {
  const user = await currentUser()
  if (!user) redirect('/')

  const role = ((user.publicMetadata as { role?: UserRole })?.role) ?? 'STUDENT'
  if (!isAdminRole(role)) redirect('/')

  const course = await db.course.findUnique({
    where: { id: params.courseId },
    include: {
      career: { select: { name: true, slug: true } },
      modules: {
        orderBy: { order: 'asc' },
        include: {
          lessons: { orderBy: { order: 'asc' } },
        },
      },
      _count: { select: { enrollments: true, modules: true } },
    },
  })

  if (!course) notFound()

  const status      = STATUS_CONFIG[course.status]
  const canEdit     = canManageCourses(role)
  const totalLessons = course.modules.reduce((a, m) => a + m.lessons.length, 0)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <Link
        href="/admin/courses"
        className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors"
      >
        <ChevronLeft size={15} />
        Back to Courses
      </Link>

      {/* Header card */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/30">
        <div className="flex gap-5">
          {course.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-36 h-24 rounded-xl object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-36 h-24 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0">
              <BookOpen size={24} className="text-slate-600" />
            </div>
          )}

          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-xl font-bold text-white leading-snug">{course.title}</h1>
              {canEdit && (
                <Link
                  href={`/admin/courses/${course.id}/edit`}
                  className="inline-flex items-center gap-1.5 flex-shrink-0 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  <Edit2 size={12} />
                  Edit
                </Link>
              )}
            </div>

            {/* Badges row */}
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-medium ${status.cls}`}>
                {status.icon}
                {status.label}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs">{course.career.name}</span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs">{DIFFICULTY_LABELS[course.difficulty]}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${course.isFree ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                {course.isFree ? 'Free' : `$${Number(course.price).toLocaleString()}`}
              </span>
            </div>

            {/* Stats row */}
            <div className="flex gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-1.5">
                <Users size={13} />
                {course._count.enrollments.toLocaleString()} enrolled
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen size={13} />
                {course.modules.length} modules
              </span>
              <span className="flex items-center gap-1.5">
                <Video size={13} />
                {totalLessons} lessons
              </span>
            </div>
          </div>
        </div>

        {course.description && (
          <p className="mt-4 pt-4 border-t border-slate-800 text-slate-400 text-sm leading-relaxed">
            {course.description}
          </p>
        )}
      </div>

      {/* Curriculum */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Curriculum</h2>
        {course.modules.length === 0 ? (
          <div className="py-10 text-center text-slate-500 rounded-xl border-2 border-dashed border-slate-800">
            No modules yet.{' '}
            {canEdit && (
              <Link href={`/admin/courses/${course.id}/edit`} className="text-violet-400 hover:underline">
                Add curriculum →
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {course.modules.map((mod, idx) => (
              <div key={mod.id} className="rounded-xl border border-slate-800 bg-slate-900/30 overflow-hidden">
                {/* Module header */}
                <div className="flex items-center gap-3 px-5 py-3 bg-slate-900/50">
                  <span className="text-slate-600 text-xs font-mono w-5">{idx + 1}</span>
                  <BookOpen size={13} className="text-violet-400" />
                  <span className="flex-1 text-white text-sm font-medium">{mod.title}</span>
                  <span className="text-slate-600 text-xs">{mod.lessons.length} lessons</span>
                </div>

                {/* Lessons */}
                {mod.lessons.length > 0 && (
                  <div className="divide-y divide-slate-800/50">
                    {mod.lessons.map((lesson, li) => (
                      <div key={lesson.id} className="flex items-center gap-3 px-5 py-2.5">
                        <span className="text-slate-700 text-xs font-mono w-5">{li + 1}</span>
                        <Video size={12} className="text-slate-600 flex-shrink-0" />
                        <span className="flex-1 text-slate-300 text-sm">{lesson.title}</span>
                        {lesson.isFree ? (
                          <Unlock size={11} className="text-emerald-500" aria-label="Free preview" />
                        ) : (
                          <Lock size={11} className="text-slate-700" />
                        )}
                        {lesson.muxPlaybackId ? (
                          <CheckCircle size={11} className="text-emerald-400" aria-label="Video ready" />
                        ) : (
                          <Clock size={11} className="text-amber-600" aria-label="No video yet" />
                        )}
                        {lesson.duration && (
                          <span className="text-xs text-slate-600">
                            {Math.floor(lesson.duration / 60)}:{String(lesson.duration % 60).padStart(2, '0')}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
