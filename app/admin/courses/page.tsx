// app/admin/courses/page.tsx
// Admin: paginated course list with status badges, enrollment count, and actions.
// Server component — data fetched directly from DB server-side.

import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { isAdminRole, canManageCourses } from '@/lib/auth'
import type { UserRole } from '@/types'
import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Plus,
  Search,
  BookOpen,
  Eye,
  Edit2,
  Users,
  CheckCircle,
  Clock,
  Archive,
} from 'lucide-react'
import { CourseActions } from '@/components/admin/course-actions'

export const metadata: Metadata = { title: 'Courses' }

interface PageProps {
  searchParams: { page?: string; search?: string }
}

const STATUS_CONFIG = {
  PUBLISHED: { label: 'Published', icon: <CheckCircle size={12} />, cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  DRAFT:     { label: 'Draft',     icon: <Clock size={12} />,        cls: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  ARCHIVED:  { label: 'Archived',  icon: <Archive size={12} />,      cls: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
}

const DIFFICULTY_LABELS = {
  BEGINNER:     'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED:     'Advanced',
}

export default async function AdminCoursesPage({ searchParams }: PageProps) {
  const user = await currentUser()
  if (!user) redirect('/')
  const role = ((user.publicMetadata as { role?: UserRole })?.role) ?? 'STUDENT'
  if (!isAdminRole(role)) redirect('/')

  const page   = Math.max(1, parseInt(searchParams.page  ?? '1'))
  const limit  = 15
  const skip   = (page - 1) * limit
  const search = searchParams.search?.trim() ?? ''

  const where = {
    status: { not: 'ARCHIVED' as const },
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { career: { name: { contains: search, mode: 'insensitive' as const } } },
          ],
        }
      : {}),
  }

  const [courses, total] = await Promise.all([
    db.course.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        career: { select: { name: true, slug: true } },
        _count: { select: { enrollments: true, modules: true } },
      },
    }),
    db.course.count({ where }),
  ])

  const totalPages = Math.ceil(total / limit)
  const canCreate  = canManageCourses(role)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Courses</h1>
          <p className="text-slate-400 text-sm mt-1">
            {total} {total === 1 ? 'course' : 'courses'} total
          </p>
        </div>
        {canCreate && (
          <Link
            href="/admin/courses/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors duration-150"
          >
            <Plus size={16} />
            New Course
          </Link>
        )}
      </div>

      {/* Search bar */}
      <form method="GET" className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          name="search"
          defaultValue={search}
          placeholder="Search by title or career…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
        />
      </form>

      {/* Table */}
      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center">
            <BookOpen size={24} className="text-slate-500" />
          </div>
          <div>
            <p className="text-white font-semibold">No courses yet</p>
            <p className="text-slate-500 text-sm mt-1">
              {search ? 'No courses match your search.' : 'Create your first course to get started.'}
            </p>
          </div>
          {canCreate && !search && (
            <Link
              href="/admin/courses/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <Plus size={14} />
              Create Course
            </Link>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50">
                <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Course</th>
                <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Career</th>
                <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Status</th>
                <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Price</th>
                <th className="text-left px-5 py-3.5 text-slate-400 font-medium">
                  <div className="flex items-center gap-1"><Users size={13} /> Students</div>
                </th>
                <th className="text-right px-5 py-3.5 text-slate-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {courses.map((course) => {
                const status = STATUS_CONFIG[course.status]
                return (
                  <tr key={course.id} className="hover:bg-slate-900/30 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {course.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                            <BookOpen size={14} className="text-slate-500" />
                          </div>
                        )}
                        <div>
                          <p className="text-white font-medium line-clamp-1">{course.title}</p>
                          <p className="text-slate-500 text-xs mt-0.5">
                            {DIFFICULTY_LABELS[course.difficulty]} · {course._count.modules} modules
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium capitalize">
                        {course.career.name}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${status.cls}`}
                      >
                        {status.icon}
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-300">
                      {course.isFree ? (
                        <span className="text-emerald-400 font-medium">Free</span>
                      ) : (
                        `₦${Number(course.price).toLocaleString()}`
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-300">
                      {course._count.enrollments.toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/courses/${course.id}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="View"
                        >
                          <Eye size={15} />
                        </Link>
                        {canCreate && (
                          <Link
                            href={`/admin/courses/${course.id}/edit`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={15} />
                          </Link>
                        )}
                        {role === 'SUPER_ADMIN' && (
                          <CourseActions courseId={course.id} courseTitle={course.title} />
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-slate-500">
            Page {page} of {totalPages} · {total} courses
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`?page=${page - 1}${search ? `&search=${search}` : ''}`}
                className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-colors"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`?page=${page + 1}${search ? `&search=${search}` : ''}`}
                className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
