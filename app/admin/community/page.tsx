// app/admin/community/page.tsx
// Admin: Community moderation — view posts across all communities, pin/delete.
// Accessible to SUPER_ADMIN and MODERATOR.

import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { canManageCommunity, isAdminRole } from '@/lib/auth'
import type { UserRole } from '@/types'
import type { Metadata } from 'next'
import { MessageSquare, Users, Pin } from 'lucide-react'
import { PostActions } from '@/components/admin/post-actions'

export const metadata: Metadata = { title: 'Community' }

interface PageProps {
  searchParams: { page?: string; communityId?: string }
}

export default async function AdminCommunityPage({ searchParams }: PageProps) {
  const user = await currentUser()
  if (!user) redirect('/')
  const role = ((user.publicMetadata as { role?: UserRole })?.role) ?? 'STUDENT'
  if (!isAdminRole(role)) redirect('/')
  if (!canManageCommunity(role)) redirect('/admin')

  const page    = Math.max(1, parseInt(searchParams.page ?? '1'))
  const limit   = 20
  const skip    = (page - 1) * limit
  const selectedCommunityId = searchParams.communityId

  // Fetch all communities for the filter sidebar
  const communities = await db.community.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { posts: true, members: true } } },
  })

  const where = selectedCommunityId ? { communityId: selectedCommunityId } : {}

  const [posts, total] = await Promise.all([
    db.post.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      include: {
        user:      { select: { name: true, email: true } },
        community: { select: { name: true, slug: true } },
      },
    }),
    db.post.count({ where }),
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Community</h1>
        <p className="text-slate-400 text-sm mt-1">
          {communities.length} communities · {total} posts
        </p>
      </div>

      <div className="flex gap-6">
        {/* Community filter sidebar */}
        <aside className="w-56 flex-shrink-0 space-y-1">
          <a
            href="/admin/community"
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors ${
              !selectedCommunityId
                ? 'bg-violet-600/20 text-violet-300 border border-violet-600/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="flex items-center gap-2">
              <MessageSquare size={14} />
              All Communities
            </span>
            <span className="text-xs text-slate-500">{total}</span>
          </a>
          {communities.map((c) => (
            <a
              key={c.id}
              href={`/admin/community?communityId=${c.id}`}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors ${
                selectedCommunityId === c.id
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0" />
                <span className="truncate">{c.name}</span>
              </span>
              <span className="text-xs text-slate-500 flex-shrink-0 ml-1">
                {c._count.posts}
              </span>
            </a>
          ))}

          {communities.length === 0 && (
            <p className="text-slate-600 text-xs px-3 py-2">
              No communities yet. Create them in Settings.
            </p>
          )}
        </aside>

        {/* Posts feed */}
        <div className="flex-1 space-y-3">
          {posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center">
                <MessageSquare size={24} className="text-slate-500" />
              </div>
              <div>
                <p className="text-white font-semibold">No posts yet</p>
                <p className="text-slate-500 text-sm mt-1">
                  Posts will appear here when members start writing.
                </p>
              </div>
            </div>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                className={`p-5 rounded-2xl border transition-colors ${
                  post.isPinned
                    ? 'border-violet-500/30 bg-violet-500/5'
                    : 'border-slate-800 bg-slate-900/30'
                }`}
              >
                {/* Post header */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                      <Users size={14} className="text-slate-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{post.user.name ?? post.user.email}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-slate-500 text-xs">{post.community.name}</span>
                        <span className="text-slate-700 text-xs">·</span>
                        <span className="text-slate-500 text-xs">
                          {new Date(post.createdAt).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </span>
                        {post.isPinned && (
                          <>
                            <span className="text-slate-700 text-xs">·</span>
                            <span className="flex items-center gap-1 text-violet-400 text-xs">
                              <Pin size={10} />
                              Pinned
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <PostActions
                    postId={post.id}
                    isPinned={post.isPinned}
                  />
                </div>

                {/* Post content */}
                <p className="text-slate-300 text-sm leading-relaxed line-clamp-4">
                  {post.content}
                </p>
              </div>
            ))
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-slate-500">
                Page {page} of {totalPages} · {total} posts
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <a
                    href={`?page=${page - 1}${selectedCommunityId ? `&communityId=${selectedCommunityId}` : ''}`}
                    className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-colors"
                  >
                    Previous
                  </a>
                )}
                {page < totalPages && (
                  <a
                    href={`?page=${page + 1}${selectedCommunityId ? `&communityId=${selectedCommunityId}` : ''}`}
                    className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-colors"
                  >
                    Next
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
