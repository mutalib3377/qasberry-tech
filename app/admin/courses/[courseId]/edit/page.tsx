// app/admin/courses/[courseId]/edit/page.tsx
// Admin: Edit an existing course — same 4-step form, pre-populated with existing data.

import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { canManageCourses } from '@/lib/auth'
import type { UserRole } from '@/types'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { CourseEditForm } from '@/components/admin/course-edit-form'

interface PageProps {
  params: { courseId: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const course = await db.course.findUnique({ where: { id: params.courseId }, select: { title: true } })
  return { title: `Edit: ${course?.title ?? 'Course'}` }
}

export default async function EditCoursePage({ params }: PageProps) {
  const user = await currentUser()
  if (!user) redirect('/')

  const role = ((user.publicMetadata as { role?: UserRole })?.role) ?? 'STUDENT'
  if (!canManageCourses(role)) redirect('/admin')

  const [course, careers] = await Promise.all([
    db.course.findUnique({
      where: { id: params.courseId },
      include: {
        career: { select: { id: true, name: true, slug: true } },
        modules: {
          orderBy: { order: 'asc' },
          include: { lessons: { orderBy: { order: 'asc' } } },
        },
      },
    }),
    db.career.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true },
    }),
  ])

  if (!course) notFound()

  // Prisma returns Decimal for price — serialize everything to plain JSON
  // before passing to a Client Component (Decimal is not serialisable).
  const serialisedCourse = {
    id:          course.id,
    title:       course.title,
    description: course.description,
    careerId:    course.careerId,
    difficulty:  course.difficulty,
    price:       Number(course.price),
    isFree:      course.isFree,
    thumbnail:   course.thumbnail,
    status:      course.status,
    modules:     course.modules.map((m) => ({
      id:      m.id,
      title:   m.title,
      order:   m.order,
      lessons: m.lessons.map((l) => ({
        id:            l.id,
        title:         l.title,
        isFree:        l.isFree,
        order:         l.order,
        muxAssetId:    l.muxAssetId,
        muxPlaybackId: l.muxPlaybackId,
        duration:      l.duration,
      })),
    })),
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <Link
        href={`/admin/courses/${params.courseId}`}
        className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors"
      >
        <ChevronLeft size={15} />
        Back to Course
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-white">Edit Course</h1>
        <p className="text-slate-400 text-sm mt-1 line-clamp-1">{course.title}</p>
      </div>

      <CourseEditForm course={serialisedCourse} careers={careers} />
    </div>
  )
}
