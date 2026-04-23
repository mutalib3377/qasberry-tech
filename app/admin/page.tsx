// app/admin/page.tsx
// Admin dashboard — stat overview cards.
// Phase 2: replaces Phase 1 placeholder with live DB counts.

import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { isAdminRole } from '@/lib/auth'
import { db } from '@/lib/db'
import type { UserRole } from '@/types'
import type { Metadata } from 'next'
import { BookOpen, Users, Award, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function AdminDashboardPage() {
  const user = await currentUser()
  if (!user) redirect('/')
  const role = ((user.publicMetadata as { role?: UserRole })?.role) ?? 'STUDENT'
  if (!isAdminRole(role)) redirect('/')

  // Fetch live stats
  const [totalCourses, publishedCourses, totalStudents, totalEnrollments, totalCertificates] =
    await Promise.all([
      db.course.count({ where: { status: { not: 'ARCHIVED' } } }),
      db.course.count({ where: { status: 'PUBLISHED' } }),
      db.user.count({ where: { role: 'STUDENT' } }),
      db.enrollment.count(),
      db.certificate.count(),
    ])

  const stats = [
    {
      label: 'Total Students',
      value: totalStudents.toLocaleString(),
      icon: <Users size={20} />,
      color: 'from-violet-500/20 to-violet-600/10 border-violet-500/20',
      iconColor: 'text-violet-400',
    },
    {
      label: 'Active Courses',
      value: `${publishedCourses} / ${totalCourses}`,
      icon: <BookOpen size={20} />,
      color: 'from-blue-500/20 to-blue-600/10 border-blue-500/20',
      iconColor: 'text-blue-400',
    },
    {
      label: 'Enrollments',
      value: totalEnrollments.toLocaleString(),
      icon: <TrendingUp size={20} />,
      color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20',
      iconColor: 'text-emerald-400',
    },
    {
      label: 'Certificates Issued',
      value: totalCertificates.toLocaleString(),
      icon: <Award size={20} />,
      color: 'from-amber-500/20 to-amber-600/10 border-amber-500/20',
      iconColor: 'text-amber-400',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1 text-sm">
          Welcome back, {user.firstName ?? 'Admin'}. Here's what's happening.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`p-6 rounded-2xl bg-gradient-to-br border ${stat.color}`}
          >
            <div className={`${stat.iconColor} mb-3`}>{stat.icon}</div>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
            <p className="text-slate-400 text-sm mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {role !== 'MODERATOR' && (
            <Link
              href="/admin/courses/new"
              className="flex items-center gap-3 p-4 rounded-xl border border-slate-700/50 bg-slate-900/50 hover:bg-slate-800/50 hover:border-violet-500/30 transition-all duration-200 group"
            >
              <div className="w-9 h-9 rounded-lg bg-violet-600/20 flex items-center justify-center group-hover:bg-violet-600/30 transition-colors">
                <BookOpen size={16} className="text-violet-400" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">Create Course</p>
                <p className="text-slate-500 text-xs">New course with modules &amp; lessons</p>
              </div>
            </Link>
          )}
          <Link
            href="/admin/courses"
            className="flex items-center gap-3 p-4 rounded-xl border border-slate-700/50 bg-slate-900/50 hover:bg-slate-800/50 hover:border-blue-500/30 transition-all duration-200 group"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-600/20 flex items-center justify-center group-hover:bg-blue-600/30 transition-colors">
              <BookOpen size={16} className="text-blue-400" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">Browse Courses</p>
              <p className="text-slate-500 text-xs">View and manage all courses</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
