'use client'
// components/admin/user-role-select.tsx
// Dropdown to change a user's role. Calls PATCH /api/admin/users.
// SUPER_ADMIN only.

import { useState } from 'react'
import type { UserRole } from '@/types'

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'SUPER_ADMIN',     label: 'Super Admin' },
  { value: 'CONTENT_MANAGER', label: 'Content Manager' },
  { value: 'MODERATOR',       label: 'Moderator' },
  { value: 'STUDENT',         label: 'Student' },
]

const ROLE_COLORS: Record<UserRole, string> = {
  SUPER_ADMIN:     'text-violet-400 bg-violet-500/10 border-violet-500/20',
  CONTENT_MANAGER: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  MODERATOR:       'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  STUDENT:         'text-slate-400 bg-slate-500/10 border-slate-500/20',
}

interface Props {
  userId:      string
  currentRole: UserRole
}

export function UserRoleSelect({ userId, currentRole }: Props) {
  const [role, setRole]      = useState<UserRole>(currentRole)
  const [loading, setLoading] = useState(false)

  async function handleChange(newRole: UserRole) {
    if (newRole === role) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'setRole', role: newRole }),
      })
      if (res.ok) {
        setRole(newRole)
      } else {
        const data = await res.json() as { error?: string }
        alert(data.error ?? 'Failed to update role')
      }
    } catch {
      alert('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <select
      value={role}
      onChange={(e) => handleChange(e.target.value as UserRole)}
      disabled={loading}
      className={`px-2.5 py-1 rounded-full border text-xs font-medium focus:outline-none transition-all cursor-pointer disabled:opacity-50 ${ROLE_COLORS[role]}`}
    >
      {ROLES.map((r) => (
        <option key={r.value} value={r.value} className="bg-slate-900 text-white">
          {r.label}
        </option>
      ))}
    </select>
  )
}
