// app/community/[slug]/page.tsx
// Public community forum — posts feed, new post form for signed-in members.
// Server component for posts list; client actions for posting.

import { db }          from '@/lib/db'
import { currentUser } from '@clerk/nextjs/server'
import { notFound }    from 'next/navigation'
import Link            from 'next/link'
import type { Metadata } from 'next'
import { MarketingNav }  from '@/components/marketing/marketing-nav'
import { Footer }        from '@/components/marketing/footer'
import { CommunityFeed } from '@/components/community/community-feed'
import { Pin, Users } from 'lucide-react'

interface Props {
  params:       { slug: string }
  searchParams: { page?: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const community = await db.community.findUnique({
    where: { slug: params.slug },
  })
  return {
    title: community ? `${community.name} Community | Qasberry` : 'Community | Qasberry',
    description: community?.description ?? undefined,
  }
}

export default async function CommunityPage({ params, searchParams }: Props) {
  const PAGE  = Math.max(1, parseInt(searchParams.page ?? '1'))
  const LIMIT = 15

  const [community, user] = await Promise.all([
    db.community.findUnique({
      where:   { slug: params.slug },
      include: { career: true, _count: { select: { members: true, posts: true } } },
    }),
    currentUser(),
  ])

  if (!community) notFound()

  // Check membership
  let isMember = false
  let dbUserId: string | undefined
  if (user) {
    const dbUser = await db.user.findUnique({ where: { clerkId: user.id } })
    dbUserId     = dbUser?.id
    if (dbUser) {
      const mem = await db.communityMember.findUnique({
        where: { userId_communityId: { userId: dbUser.id, communityId: community.id } },
      })
      isMember = !!mem
    }
  }

  const [posts, total] = await Promise.all([
    db.post.findMany({
      where:   { communityId: community.id },
      skip:    (PAGE - 1) * LIMIT,
      take:    LIMIT,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      include: { user: { select: { name: true, email: true } } },
    }),
    db.post.count({ where: { communityId: community.id } }),
  ])

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-violet-600/5 blur-[120px]" />
      </div>

      <MarketingNav />

      <main className="relative z-10 max-w-3xl mx-auto px-6 py-12 space-y-8">

        {/* Community header */}
        <div className="space-y-3">
          <Link href="/#careers" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
            ← All Careers
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold tracking-tight">{community.name}</h1>
              {community.description && (
                <p className="text-slate-400 text-base">{community.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-slate-500 pt-1">
                <span className="flex items-center gap-1.5">
                  <Users size={13} />
                  {community._count.members} members
                </span>
                <span>{community._count.posts} posts</span>
                <span className="px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 text-xs border border-violet-500/20">
                  {community.career.name}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Feed + Post form */}
        <CommunityFeed
          communityId={community.id}
          communitySlug={community.slug}
          posts={posts.map((p) => ({
            id:             p.id,
            content:        p.content,
            isPinned:       p.isPinned,
            createdAt:      p.createdAt.toISOString(),
            authorName:     p.user.name ?? p.user.email,
          }))}
          isSignedIn={!!user}
          isMember={isMember}
          currentUserId={dbUserId}
          page={PAGE}
          totalPages={totalPages}
        />
      </main>

      <Footer />
    </div>
  )
}
