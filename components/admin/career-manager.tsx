'use client'
// components/admin/career-manager.tsx
// Interactive career track manager: add, rename, delete.
// Used in /admin/settings page.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Check, X, Loader2, BookOpen, Users } from 'lucide-react'

interface Career {
  id:            string
  name:          string
  slug:          string
  courseCount:   number
  communityCount: number
}

interface Props {
  careers: Career[]
}

export function CareerManager({ careers: initialCareers }: Props) {
  const [careers, setCareers]       = useState<Career[]>(initialCareers)
  const [newName, setNewName]       = useState('')
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [editName, setEditName]     = useState('')
  const [loading, setLoading]       = useState<string | null>(null) // 'create' | careerId
  const router = useRouter()

  async function handleCreate() {
    if (!newName.trim()) return
    setLoading('create')
    try {
      const res = await fetch('/api/admin/settings/careers', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: newName.trim() }),
      })
      const data = await res.json() as { success: boolean; data?: Career; error?: string }
      if (data.success && data.data) {
        setCareers([...careers, { ...data.data, courseCount: 0, communityCount: 0 }])
        setNewName('')
        router.refresh()
      } else {
        alert(data.error ?? 'Failed to create career')
      }
    } catch {
      alert('Network error')
    } finally {
      setLoading(null)
    }
  }

  function startEdit(career: Career) {
    setEditingId(career.id)
    setEditName(career.name)
  }
  function cancelEdit()  { setEditingId(null); setEditName('') }

  async function handleRename(id: string) {
    if (!editName.trim()) return
    setLoading(id)
    try {
      const res = await fetch('/api/admin/settings/careers', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id, name: editName.trim() }),
      })
      const data = await res.json() as { success: boolean; data?: Career; error?: string }
      if (data.success && data.data) {
        setCareers(careers.map((c) => c.id === id ? { ...c, name: data.data!.name, slug: data.data!.slug } : c))
        cancelEdit()
        router.refresh()
      } else {
        alert(data.error ?? 'Failed to update career')
      }
    } catch {
      alert('Network error')
    } finally {
      setLoading(null)
    }
  }

  async function handleDelete(career: Career) {
    if (career.courseCount > 0) {
      alert(`Cannot delete "${career.name}" — it has ${career.courseCount} course(s). Move or archive the courses first.`)
      return
    }
    if (!confirm(`Delete career "${career.name}"? This will also delete any linked communities.`)) return
    setLoading(career.id)
    try {
      const res = await fetch(`/api/admin/settings/careers?id=${career.id}`, { method: 'DELETE' })
      const data = await res.json() as { success: boolean; error?: string }
      if (data.success) {
        setCareers(careers.filter((c) => c.id !== career.id))
        router.refresh()
      } else {
        alert(data.error ?? 'Failed to delete career')
      }
    } catch {
      alert('Network error')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-3">
      {/* Career list */}
      {careers.length === 0 && (
        <p className="text-slate-600 text-sm py-4 text-center rounded-xl border-2 border-dashed border-slate-800">
          No career tracks yet. Create the first one below.
        </p>
      )}

      {careers.map((career) => (
        <div
          key={career.id}
          className="flex items-center gap-3 p-4 rounded-xl border border-slate-800 bg-slate-900/30"
        >
          {editingId === career.id ? (
            <>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleRename(career.id); if (e.key === 'Escape') cancelEdit() }}
                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm focus:outline-none focus:border-violet-500"
                autoFocus
              />
              <button
                onClick={() => handleRename(career.id)}
                disabled={loading === career.id}
                className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
              >
                {loading === career.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              </button>
              <button onClick={cancelEdit} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 transition-colors">
                <X size={14} />
              </button>
            </>
          ) : (
            <>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">{career.name}</p>
                <p className="text-slate-600 text-xs mt-0.5">/{career.slug}</p>
              </div>
              <div className="flex items-center gap-3 text-slate-500 text-xs">
                <span className="flex items-center gap-1">
                  <BookOpen size={11} />{career.courseCount}
                </span>
                <span className="flex items-center gap-1">
                  <Users size={11} />{career.communityCount}
                </span>
              </div>
              <button
                onClick={() => startEdit(career)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={() => handleDelete(career)}
                disabled={loading === career.id}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                {loading === career.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              </button>
            </>
          )}
        </div>
      ))}

      {/* Add new career */}
      <div className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
          placeholder="New career name (e.g. Healthcare AI)"
          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
        />
        <button
          onClick={handleCreate}
          disabled={loading === 'create' || !newName.trim()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {loading === 'create' ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Add
        </button>
      </div>
    </div>
  )
}
