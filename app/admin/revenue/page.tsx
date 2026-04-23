// app/admin/revenue/page.tsx
// Admin: Revenue dashboard — total earnings, top courses, recent enrollments.
// SUPER_ADMIN only.

import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { isSuperAdmin, isAdminRole } from '@/lib/auth'
import type { UserRole } from '@/types'
import type { Metadata } from 'next'
import { DollarSign, TrendingUp, Users, BookOpen } from 'lucide-react'

export const metadata: Metadata = { title: 'Revenue' }

export default async function AdminRevenuePage() {
  const user = await currentUser()
  if (!user) redirect('/')
  const role = ((user.publicMetadata as { role?: UserRole })?.role) ?? 'STUDENT'
  if (!isAdminRole(role)) redirect('/')
  if (!isSuperAdmin(role)) redirect('/admin')

  // ── Aggregate stats ──────────────────────────────────────────────────────────
  const paidEnrollments = await db.enrollment.findMany({
    include: {
      course: { select: { title: true, price: true, isFree: true, career: { select: { name: true } } } },
      user:   { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const revenueEnrollments = paidEnrollments.filter((e) => !e.course.isFree)
  const totalRevenue = revenueEnrollments.reduce((sum, e) => sum + Number(e.course.price), 0)
  const totalEnrollments = paidEnrollments.length
  const avgRevPerEnrollment = revenueEnrollments.length > 0
    ? totalRevenue / revenueEnrollments.length
    : 0

  // ── Top 5 courses by revenue ─────────────────────────────────────────────────
  const courseTotals: Record<string, { title: string; career: string; revenue: number; count: number }> = {}
  for (const e of revenueEnrollments) {
    if (!courseTotals[e.courseId]) {
      courseTotals[e.courseId] = {
        title:   e.course.title,
        career:  e.course.career.name,
        revenue: 0,
        count:   0,
      }
    }
    courseTotals[e.courseId].revenue += Number(e.course.price)
    courseTotals[e.courseId].count   += 1
  }
  const topCourses = Object.values(courseTotals)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // ── Monthly enrollment counts (last 6 months) ────────────────────────────────
  const now   = new Date()
  const months: { label: string; count: number; revenue: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d    = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const end  = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    const label = d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
    const inMonth = paidEnrollments.filter(
      (e) => new Date(e.createdAt) >= d && new Date(e.createdAt) < end
    )
    const rev = inMonth
      .filter((e) => !e.course.isFree)
      .reduce((s, e) => s + Number(e.course.price), 0)
    months.push({ label, count: inMonth.length, revenue: rev })
  }

  const maxMonthRevenue = Math.max(...months.map((m) => m.revenue), 1)

  const recentEnrollments = paidEnrollments.slice(0, 10)

  const statCards = [
    {
      label:     'Total Revenue',
      value:     `₦${totalRevenue.toLocaleString()}`,
      icon:      <DollarSign size={20} />,
      color:     'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20',
      iconColor: 'text-emerald-400',
    },
    {
      label:     'Total Enrollments',
      value:     totalEnrollments.toLocaleString(),
      icon:      <Users size={20} />,
      color:     'from-violet-500/20 to-violet-600/10 border-violet-500/20',
      iconColor: 'text-violet-400',
    },
    {
      label:     'Paid Enrollments',
      value:     revenueEnrollments.length.toLocaleString(),
      icon:      <TrendingUp size={20} />,
      color:     'from-blue-500/20 to-blue-600/10 border-blue-500/20',
      iconColor: 'text-blue-400',
    },
    {
      label:     'Avg. Revenue / Enroll',
      value:     `₦${Math.round(avgRevPerEnrollment).toLocaleString()}`,
      icon:      <BookOpen size={20} />,
      color:     'from-amber-500/20 to-amber-600/10 border-amber-500/20',
      iconColor: 'text-amber-400',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Revenue</h1>
        <p className="text-slate-400 text-sm mt-1">Platform earnings overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((s) => (
          <div
            key={s.label}
            className={`p-6 rounded-2xl bg-gradient-to-br border ${s.color}`}
          >
            <div className={`${s.iconColor} mb-3`}>{s.icon}</div>
            <p className="text-3xl font-bold text-white">{s.value}</p>
            <p className="text-slate-400 text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly revenue chart */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/30">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">
            Monthly Revenue (last 6 months)
          </h2>
          <div className="flex items-end gap-3 h-40">
            {months.map((m) => {
              const height = maxMonthRevenue > 0
                ? Math.max(4, (m.revenue / maxMonthRevenue) * 100)
                : 4
              return (
                <div key={m.label} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs text-slate-500">
                    {m.revenue > 0 ? `₦${(m.revenue / 1000).toFixed(0)}k` : ''}
                  </span>
                  <div className="w-full flex items-end">
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-violet-600 to-violet-400 transition-all"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500">{m.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top courses by revenue */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/30">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Top Courses by Revenue
          </h2>
          {topCourses.length === 0 ? (
            <p className="text-slate-600 text-sm py-8 text-center">No paid enrollments yet.</p>
          ) : (
            <div className="space-y-3">
              {topCourses.map((c, i) => (
                <div key={c.title} className="flex items-center gap-3">
                  <span className="text-slate-600 text-sm font-mono w-4 text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{c.title}</p>
                    <p className="text-slate-500 text-xs">{c.career} · {c.count} enrolled</p>
                  </div>
                  <span className="text-emerald-400 text-sm font-semibold flex-shrink-0">
                    ₦{c.revenue.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent enrollments */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Recent Enrollments
        </h2>
        {recentEnrollments.length === 0 ? (
          <div className="py-12 text-center text-slate-600 rounded-xl border-2 border-dashed border-slate-800">
            No enrollments yet.
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50">
                  <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Student</th>
                  <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Course</th>
                  <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Date</th>
                  <th className="text-right px-5 py-3.5 text-slate-400 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {recentEnrollments.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-white font-medium">{e.user.name ?? '—'}</p>
                      <p className="text-slate-500 text-xs">{e.user.email}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-300 max-w-[200px] truncate">
                      {e.course.title}
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs">
                      {new Date(e.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {e.course.isFree ? (
                        <span className="text-slate-500 text-xs">Free</span>
                      ) : (
                        <span className="text-emerald-400 font-semibold">
                          ₦{Number(e.course.price).toLocaleString()}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
