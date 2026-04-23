'use client'
// components/admin/course-actions.tsx
// Archive button for a course row — soft-delete only.
// Client component because it needs browser confirm + fetch.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Archive, Loader2 } from 'lucide-react'

interface CourseActionsProps {
  courseId: string
  courseTitle: string
}

export function CourseActions({ courseId, courseTitle }: CourseActionsProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleArchive() {
    if (
      !confirm(
        `Archive "${courseTitle}"?\n\nEnrolled students will keep access. This cannot be undone through the UI.`
      )
    )
      return

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, { method: 'DELETE' })
      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json() as { error?: string }
        alert(data.error ?? 'Failed to archive course')
      }
    } catch {
      alert('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleArchive}
      disabled={loading}
      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
      title="Archive course"
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : <Archive size={15} />}
    </button>
  )
}
