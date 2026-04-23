// app/admin/settings/page.tsx
// Admin: Platform settings — manage career tracks and communities.
// SUPER_ADMIN only.

import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { isSuperAdmin, isAdminRole } from '@/lib/auth'
import type { UserRole } from '@/types'
import type { Metadata } from 'next'
import { CareerManager } from '@/components/admin/career-manager'
import { CommunityManager } from '@/components/admin/community-manager'

export const metadata: Metadata = { title: 'Settings' }

export default async function AdminSettingsPage() {
  const user = await currentUser()
  if (!user) redirect('/')
  const role = ((user.publicMetadata as { role?: UserRole })?.role) ?? 'STUDENT'
  if (!isAdminRole(role)) redirect('/')
  if (!isSuperAdmin(role)) redirect('/admin')

  const [careers, communities] = await Promise.all([
    db.career.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { courses: true, communities: true } } },
    }),
    db.community.findMany({
      orderBy: { name: 'asc' },
      include: {
        career: { select: { name: true } },
        _count:  { select: { posts: true, members: true } },
      },
    }),
  ])

  return (
    <div className="space-y-10 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage platform configuration and structure.
        </p>
      </div>

      {/* Career Tracks */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-white">Career Tracks</h2>
          <p className="text-slate-500 text-sm mt-1">
            Careers group courses and communities. You cannot delete a career that has active courses.
          </p>
        </div>
        <CareerManager careers={careers.map((c) => ({
          id:           c.id,
          name:         c.name,
          slug:         c.slug,
          courseCount:  c._count.courses,
          communityCount: c._count.communities,
        }))} />
      </section>

      <hr className="border-slate-800" />

      {/* Communities */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-white">Communities</h2>
          <p className="text-slate-500 text-sm mt-1">
            Each community belongs to a career track and hosts discussions for enrolled students.
          </p>
        </div>
        <CommunityManager
          communities={communities.map((c) => ({
            id:          c.id,
            name:        c.name,
            slug:        c.slug,
            careerName:  c.career.name,
            postCount:   c._count.posts,
            memberCount: c._count.members,
          }))}
          careers={careers.map((c) => ({ id: c.id, name: c.name }))}
        />
      </section>
    </div>
  )
}
