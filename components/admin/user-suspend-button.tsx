'use client'
// components/admin/user-suspend-button.tsx
// Toggle to suspend/reactivate a user. Calls PATCH /api/admin/users.
// SUPER_ADMIN only.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Ban, CheckCircle, Loader2 } from 'lucide-react'

interface Props {
  userId:      string
  isSuspended: boolean
}

export function UserSuspendButton({ userId, isSuspended }: Props) {
  const [loading, setLoading]     = useState(false)
  const [suspended, setSuspended] = useState(isSuspended)
  const router = useRouter()

  async function handleToggle() {
    const action = suspended ? 'reactivate' : 'suspend'
    const label  = suspended ? 'reactivate' : 'suspend'
    if (!confirm(`Are you sure you want to ${label} this user?`)) return

    setLoading(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      })
      if (res.ok) {
        setSuspended(!suspended)
        router.refresh()
      } else {
        const data = await res.json() as { error?: string }
        alert(data.error ?? 'Failed to update user')
      }
    } catch {
      alert('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
        suspended
          ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
          : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
      }`}
    >
      {loading ? (
        <Loader2 size={12} className="animate-spin" />
      ) : suspended ? (
        <CheckCircle size={12} />
      ) : (
        <Ban size={12} />
      )}
      {suspended ? 'Reactivate' : 'Suspend'}
    </button>
  )
}
