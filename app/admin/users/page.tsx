// app/admin/users/page.tsx
// Admin: User management — list, search, role change, suspend/reactivate.
// SUPER_ADMIN can change roles and suspend. Other admins can view.

import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { isAdminRole } from '@/lib/auth'
import type { UserRole } from '@/types'
import type { Metadata } from 'next'
import { Users, Search, ShieldCheck } from 'lucide-react'
import { UserRoleSelect } from '@/components/admin/user-role-select'
import { UserSuspendButton } from '@/components/admin/user-suspend-button'

export const metadata: Metadata = { title: 'Users' }

interface PageProps {
  searchParams: { page?: string; search?: string; role?: string }
}

const ROLE_COLORS: Record<UserRole, string> = {
  SUPER_ADMIN:     'text-violet-400 bg-violet-500/10 border-violet-500/20',
  CONTENT_MANAGER: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  MODERATOR:       'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  STUDENT:         'text-slate-400 bg-slate-500/10 border-slate-500/20',
}
const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN:     'Super Admin',
  CONTENT_MANAGER: 'Content Mgr',
  MODERATOR:       'Moderator',
  STUDENT:         'Student',
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const user = await currentUser()
  if (!user) redirect('/')
  const myRole = ((user.publicMetadata as { role?: UserRole })?.role) ?? 'STUDENT'
  if (!isAdminRole(myRole)) redirect('/')

  const isSuperAdmin = myRole === 'SUPER_ADMIN'
  const page    = Math.max(1, parseInt(searchParams.page   ?? '1'))
  const limit   = 20
  const skip    = (page - 1) * limit
  const search  = searchParams.search?.trim() ?? ''
  const roleFilter = searchParams.role as UserRole | undefined

  const where = {
    ...(search
      ? { OR: [
          { name:  { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ]}
      : {}),
    ...(roleFilter && ['SUPER_ADMIN','CONTENT_MANAGER','MODERATOR','STUDENT'].includes(roleFilter)
      ? { role: roleFilter }
      : {}),
  }

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        career: true,
        isSuspended: true,
        createdAt: true,
        _count: { select: { enrollments: true } },
      },
    }),
    db.user.count({ where }),
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-slate-400 text-sm mt-1">{total.toLocaleString()} total users</p>
        </div>
      </div>

      {/* Filters */}
      <form method="GET" className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            name="search"
            defaultValue={search}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>
        <select
          name="role"
          defaultValue={roleFilter ?? ''}
          className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors"
        >
          <option value="">All roles</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="CONTENT_MANAGER">Content Manager</option>
          <option value="MODERATOR">Moderator</option>
          <option value="STUDENT">Student</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Filter
        </button>
      </form>

      {/* Table */}
      {users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center">
            <Users size={24} className="text-slate-500" />
          </div>
          <div>
            <p className="text-white font-semibold">No users found</p>
            <p className="text-slate-500 text-sm mt-1">
              {search ? 'No users match your search.' : 'No users registered yet.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50">
                <th className="text-left px-5 py-3.5 text-slate-400 font-medium">User</th>
                <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Role</th>
                <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Career</th>
                <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Enrollments</th>
                <th className="text-left px-5 py-3.5 text-slate-400 font-medium">Joined</th>
                {isSuperAdmin && (
                  <th className="text-right px-5 py-3.5 text-slate-400 font-medium">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {users.map((u) => (
                <tr key={u.id} className={`hover:bg-slate-900/30 transition-colors ${u.isSuspended ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-4">
                    <div>
                      <p className="text-white font-medium">{u.name ?? '—'}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{u.email}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {isSuperAdmin ? (
                      <UserRoleSelect userId={u.id} currentRole={u.role as UserRole} />
                    ) : (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium ${ROLE_COLORS[u.role as UserRole]}`}>
                        <ShieldCheck size={11} />
                        {ROLE_LABELS[u.role as UserRole]}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-slate-400 text-sm">
                    {u.career ?? <span className="text-slate-600">—</span>}
                  </td>
                  <td className="px-5 py-4 text-slate-300">
                    {u._count.enrollments}
                  </td>
                  <td className="px-5 py-4 text-slate-500 text-xs">
                    {new Date(u.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </td>
                  {isSuperAdmin && (
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end">
                        <UserSuspendButton
                          userId={u.id}
                          isSuspended={u.isSuspended}
                        />
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-slate-500">
            Page {page} of {totalPages} · {total} users
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={`?page=${page - 1}${search ? `&search=${search}` : ''}${roleFilter ? `&role=${roleFilter}` : ''}`}
                className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-colors"
              >
                Previous
              </a>
            )}
            {page < totalPages && (
              <a
                href={`?page=${page + 1}${search ? `&search=${search}` : ''}${roleFilter ? `&role=${roleFilter}` : ''}`}
                className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-colors"
              >
                Next
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
