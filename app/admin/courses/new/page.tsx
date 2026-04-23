// app/admin/courses/new/page.tsx
// Admin: Create new course page.
// Fetches careers server-side and passes them to the client course form.

import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { canManageCourses } from '@/lib/auth'
import type { UserRole } from '@/types'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { CourseForm } from '@/components/admin/course-form'

export const metadata: Metadata = { title: 'New Course' }

export default async function NewCoursePage() {
  const user = await currentUser()
  if (!user) redirect('/')

  const role = ((user.publicMetadata as { role?: UserRole })?.role) ?? 'STUDENT'
  if (!canManageCourses(role)) redirect('/admin')

  // Fetch careers for the dropdown
  const careers = await db.career.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, slug: true },
  })

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

      <div>
        <h1 className="text-2xl font-bold text-white">Create New Course</h1>
        <p className="text-slate-400 text-sm mt-1">
          Fill in the details, build your curriculum, then publish.
        </p>
      </div>

      <CourseForm careers={careers} />
    </div>
  )
}
