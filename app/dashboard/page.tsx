// app/dashboard/page.tsx
// Student dashboard — Phase 3 upgrade.
// Shows enrolled courses, certificates, and quick "Build my roadmap" CTA.
// Protected by middleware.
// Admin users are redirected to /admin.

import { currentUser } from '@clerk/nextjs/server'
import { redirect }    from 'next/navigation'
import { isAdminRole } from '@/lib/auth'
import { db }          from '@/lib/db'
import type { Metadata } from 'next'
import { DashboardClient } from '@/components/dashboard/dashboard-client'

export const metadata: Metadata = {
  title: 'Dashboard | Qasberry',
  description: 'Your personalised Qasberry AI learning dashboard.',
}

export default async function DashboardPage() {
  const user = await currentUser()
  if (!user) redirect('/sign-in')

  // Fetch DB user to get enrollments + certificates
  const dbUser = await db.user.findUnique({
    where: { clerkId: user.id },
    include: {
      enrollments: {
        include: {
          course: {
            include: {
              career: true,
              modules: {
                include: { lessons: { select: { id: true } } },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      certificates: {
        include: { course: true },
        orderBy: { issuedAt: 'desc' },
      },
      progress: {
        select: { lessonId: true },
      },
    },
  })

  const role = (user.publicMetadata as { role?: string })?.role ?? 'STUDENT'

  // Redirect admin/staff users away from the student dashboard
  if (isAdminRole(role as Parameters<typeof isAdminRole>[0])) {
    redirect('/admin')
  }

  // Build a Set of completed lesson IDs for O(1) lookup
  const completedLessonIds = new Set((dbUser?.progress ?? []).map((p) => p.lessonId))

  const enrollmentData = (dbUser?.enrollments ?? []).map((e) => {
    const allLessons = e.course.modules.flatMap((m) => m.lessons.map((l) => l.id))
    const completedCount = allLessons.filter((id) => completedLessonIds.has(id)).length
    return {
      id:              e.id,
      courseId:        e.courseId,
      courseTitle:     e.course.title,
      courseThumbnail: e.course.thumbnail,
      career:          e.course.career.name,
      lessonCount:     allLessons.length,
      completedCount,
      enrolledAt:      e.createdAt.toISOString(),
    }
  })

  const certificateData = (dbUser?.certificates ?? []).map((c) => ({
    id:          c.id,
    courseTitle: c.course.title,
    issuedAt:    c.issuedAt.toISOString(),
    url:         c.certificateUrl,
  }))

  return (
    <DashboardClient
      firstName={user.firstName ?? 'there'}
      role={role}
      enrollments={enrollmentData}
      certificates={certificateData}
    />
  )
}
