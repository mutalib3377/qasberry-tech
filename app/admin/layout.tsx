// app/admin/layout.tsx
// Admin panel root layout.
// Wraps all /admin/* pages with the sidebar and top bar.
// Server component — reads user role server-side for security.
//
// Security: double-checks role here as defense-in-depth even though
// middleware already blocks non-admin users.

import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { AdminSidebar } from '@/components/admin/sidebar'
import { isAdminRole } from '@/lib/auth'
import type { UserRole } from '@/types'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await currentUser()

  if (!user) redirect('/')

  const role = ((user.publicMetadata as { role?: UserRole })?.role) ?? 'STUDENT'

  // Defense-in-depth role check
  if (!isAdminRole(role)) redirect('/')

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.emailAddresses[0]?.emailAddress

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar — fixed left column */}
      <AdminSidebar role={role} />

      {/* Main content area — offset by sidebar width */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
          <div />
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-white leading-none">{displayName}</p>
              <p className="text-xs text-slate-500 mt-0.5">{role.replace('_', ' ')}</p>
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
