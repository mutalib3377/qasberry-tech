'use client'
// components/admin/community-manager.tsx
// Interactive community manager: view communities with stats.
// Full create/delete will be added in Phase 4 when the community forum is built.
// Used in /admin/settings page.

import { MessageSquare, Users, FileText } from 'lucide-react'

interface Community {
  id:          string
  name:        string
  slug:        string
  careerName:  string
  postCount:   number
  memberCount: number
}

interface Career {
  id:   string
  name: string
}

interface Props {
  communities: Community[]
  careers:     Career[]
}

export function CommunityManager({ communities }: Props) {
  return (
    <div className="space-y-3">
      {communities.length === 0 ? (
        <p className="text-slate-600 text-sm py-4 text-center rounded-xl border-2 border-dashed border-slate-800">
          No communities yet. Communities will be created automatically in a future update when careers are published.
        </p>
      ) : (
        communities.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/30"
          >
            <div className="w-9 h-9 rounded-lg bg-violet-600/20 flex items-center justify-center flex-shrink-0">
              <MessageSquare size={16} className="text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium">{c.name}</p>
              <p className="text-slate-500 text-xs mt-0.5">
                {c.careerName} · /{c.slug}
              </p>
            </div>
            <div className="flex items-center gap-4 text-slate-400 text-xs">
              <span className="flex items-center gap-1">
                <Users size={12} />
                {c.memberCount} members
              </span>
              <span className="flex items-center gap-1">
                <FileText size={12} />
                {c.postCount} posts
              </span>
            </div>
          </div>
        ))
      )}

      <p className="text-slate-700 text-xs mt-2">
        Full community creation tools coming in Phase 4.
      </p>
    </div>
  )
}
