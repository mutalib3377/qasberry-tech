'use client'
// components/admin/sidebar.tsx
// Admin panel sidebar — navigation, logo, and role badge.
// Used by app/admin/layout.tsx.

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  BookOpen,
  Users,
  MessageSquare,
  DollarSign,
  Settings,
  Zap,
} from 'lucide-react'
import type { UserRole } from '@/types'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  roles?: UserRole[]   // if set, only show to these roles
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: <LayoutDashboard size={16} />,
  },
  {
    label: 'Courses',
    href: '/admin/courses',
    icon: <BookOpen size={16} />,
    roles: ['SUPER_ADMIN', 'CONTENT_MANAGER'],
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: <Users size={16} />,
    roles: ['SUPER_ADMIN'],
  },
  {
    label: 'Community',
    href: '/admin/community',
    icon: <MessageSquare size={16} />,
    roles: ['SUPER_ADMIN', 'MODERATOR'],
  },
  {
    label: 'Revenue',
    href: '/admin/revenue',
    icon: <DollarSign size={16} />,
    roles: ['SUPER_ADMIN'],
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: <Settings size={16} />,
    roles: ['SUPER_ADMIN'],
  },
]

const ROLE_COLORS: Record<UserRole, string> = {
  SUPER_ADMIN: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  CONTENT_MANAGER: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  MODERATOR: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  STUDENT: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
}

const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  CONTENT_MANAGER: 'Content Manager',
  MODERATOR: 'Moderator',
  STUDENT: 'Student',
}

interface SidebarProps {
  role: UserRole
}

export function AdminSidebar({ role }: SidebarProps) {
  const pathname = usePathname()

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(role)
  )

  return (
    <aside className="fixed left-0 top-0 h-full w-64 flex flex-col border-r border-slate-800 bg-slate-950/80 backdrop-blur-xl z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center">
          <Zap size={16} className="text-white" />
        </div>
        <div>
          <span className="text-white font-bold text-sm tracking-wide">Qasberry</span>
          <p className="text-slate-500 text-xs">Admin Panel</p>
        </div>
      </div>

      {/* Role badge */}
      <div className="px-4 py-3 border-b border-slate-800">
        <span
          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${ROLE_COLORS[role]}`}
        >
          {ROLE_LABELS[role]}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <span className={isActive ? 'text-violet-400' : 'text-slate-500'}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-800">
        <p className="text-xs text-slate-600">Qasberry v0.2.0</p>
      </div>
    </aside>
  )
}
