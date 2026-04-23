'use client'
// components/admin/post-actions.tsx
// Pin/unpin and delete buttons for community posts.
// Used in admin community moderation page.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pin, PinOff, Trash2, Loader2 } from 'lucide-react'

interface Props {
  postId:   string
  isPinned: boolean
}

export function PostActions({ postId, isPinned }: Props) {
  const [pinned,  setPinned]  = useState(isPinned)
  const [loading, setLoading] = useState<'pin' | 'delete' | null>(null)
  const router = useRouter()

  async function handlePin() {
    setLoading('pin')
    try {
      const res = await fetch('/api/admin/community', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, isPinned: !pinned }),
      })
      if (res.ok) {
        setPinned(!pinned)
        router.refresh()
      } else {
        const data = await res.json() as { error?: string }
        alert(data.error ?? 'Failed to update post')
      }
    } catch {
      alert('Network error — please try again')
    } finally {
      setLoading(null)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this post? This cannot be undone.')) return
    setLoading('delete')
    try {
      const res = await fetch(`/api/admin/community?postId=${postId}`, { method: 'DELETE' })
      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json() as { error?: string }
        alert(data.error ?? 'Failed to delete post')
      }
    } catch {
      alert('Network error — please try again')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      <button
        onClick={handlePin}
        disabled={loading !== null}
        className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
          pinned
            ? 'text-violet-400 hover:bg-violet-500/10'
            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
        }`}
        title={pinned ? 'Unpin post' : 'Pin post'}
      >
        {loading === 'pin' ? (
          <Loader2 size={14} className="animate-spin" />
        ) : pinned ? (
          <PinOff size={14} />
        ) : (
          <Pin size={14} />
        )}
      </button>
      <button
        onClick={handleDelete}
        disabled={loading !== null}
        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
        title="Delete post"
      >
        {loading === 'delete' ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Trash2 size={14} />
        )}
      </button>
    </div>
  )
}
