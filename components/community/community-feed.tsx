'use client'
// components/community/community-feed.tsx
// Client: post feed with join/leave, new post form, pagination.

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Pin, Send, Loader2, Users, MessageSquare, LogIn,
} from 'lucide-react'

interface Post {
  id:         string
  content:    string
  isPinned:   boolean
  createdAt:  string
  authorName: string
}

interface Props {
  communityId:   string
  communitySlug: string
  posts:         Post[]
  isSignedIn:    boolean
  isMember:      boolean
  currentUserId: string | undefined
  page:          number
  totalPages:    number
}

export function CommunityFeed({
  communityId, communitySlug, posts, isSignedIn, isMember: initialMember,
  page, totalPages,
}: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [isMember, setIsMember] = useState(initialMember)
  const [content,  setContent]  = useState('')
  const [posting,  setPosting]  = useState(false)
  const [joining,  setJoining]  = useState(false)
  const [postError, setPostError] = useState<string | null>(null)

  async function handleJoin() {
    setJoining(true)
    try {
      const res  = await fetch('/api/community/membership', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ communityId, action: isMember ? 'leave' : 'join' }),
      })
      const data = await res.json()
      if (data.success) setIsMember(!isMember)
    } finally {
      setJoining(false)
    }
  }

  async function handlePost() {
    if (!content.trim()) return
    setPosting(true)
    setPostError(null)
    try {
      const res  = await fetch('/api/community/posts', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ communityId, content: content.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        setContent('')
        startTransition(() => router.refresh())
      } else {
        setPostError(data.error ?? 'Failed to post.')
      }
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="space-y-6">

      {/* Join / Leave button */}
      {isSignedIn && (
        <div className="flex justify-end">
          <button
            id="join-community-btn"
            onClick={handleJoin}
            disabled={joining}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              isMember
                ? 'border border-slate-700 text-slate-400 hover:border-rose-500/50 hover:text-rose-400'
                : 'bg-violet-600 hover:bg-violet-500 text-white'
            }`}
          >
            {joining ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />}
            {isMember ? 'Leave community' : 'Join community'}
          </button>
        </div>
      )}

      {/* New post form */}
      {isSignedIn && isMember ? (
        <div className="space-y-2">
          <textarea
            id="new-post-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share something with this community…"
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 resize-none transition-colors"
          />
          {postError && <p className="text-rose-400 text-xs">{postError}</p>}
          <div className="flex justify-end">
            <button
              id="submit-post-btn"
              onClick={handlePost}
              disabled={posting || !content.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {posting
                ? <Loader2 size={13} className="animate-spin" />
                : <Send size={13} />
              }
              Post
            </button>
          </div>
        </div>
      ) : isSignedIn && !isMember ? (
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/30 text-center text-slate-500 text-sm">
          Join this community to post.
        </div>
      ) : (
        <Link
          href="/sign-in"
          className="flex items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-slate-700 text-slate-500 hover:text-white hover:border-violet-500/50 text-sm transition-colors"
        >
          <LogIn size={14} />
          Sign in to join and post
        </Link>
      )}

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="py-20 text-center space-y-3">
          <MessageSquare size={36} className="mx-auto text-slate-700" />
          <p className="text-slate-500">No posts yet. Be the first to share!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className={`p-5 rounded-2xl border transition-colors ${
                post.isPinned
                  ? 'border-violet-500/25 bg-violet-500/5'
                  : 'border-slate-800 bg-slate-900/30'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-slate-400">
                  {post.authorName[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{post.authorName}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-slate-500 text-xs">
                      {new Date(post.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </p>
                    {post.isPinned && (
                      <span className="flex items-center gap-1 text-violet-400 text-xs">
                        <Pin size={9} />
                        Pinned
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/community/${communitySlug}?page=${page - 1}`}
                className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-colors"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/community/${communitySlug}?page=${page + 1}`}
                className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
