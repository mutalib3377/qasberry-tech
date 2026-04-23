// app/api/admin/community/route.ts
// Admin API: Get posts for moderation + pin/delete actions.
// SUPER_ADMIN and MODERATOR only.

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { canManageCommunity } from '@/lib/auth'
import type { UserRole, ApiResponse } from '@/types'
import { z } from 'zod'

async function getRole(): Promise<UserRole | null> {
  const { userId, sessionClaims } = await auth()
  if (!userId) return null
  return (sessionClaims?.metadata as { role?: UserRole } | undefined)?.role ?? null
}

// ── GET /api/admin/community ──────────────────────────────────────────────────
// Returns paginated posts across all communities.
export async function GET(req: NextRequest): Promise<NextResponse> {
  const role = await getRole()
  if (!role || !canManageCommunity(role)) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const page        = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit       = 20
  const skip        = (page - 1) * limit
  const communityId = searchParams.get('communityId') ?? undefined

  const where = communityId ? { communityId } : {}

  const [posts, total] = await Promise.all([
    db.post.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user:      { select: { name: true, email: true } },
        community: { select: { name: true, slug: true } },
      },
    }),
    db.post.count({ where }),
  ])

  return NextResponse.json({ success: true, data: { posts, total, page, limit } })
}

// ── PATCH /api/admin/community ────────────────────────────────────────────────
// Pin / unpin a post.
const PatchSchema = z.object({
  postId:   z.string().min(1),
  isPinned: z.boolean(),
})

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const role = await getRole()
  if (!role || !canManageCommunity(role)) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  const parsed = PatchSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' },
      { status: 400 }
    )
  }

  try {
    await db.post.update({
      where: { id: parsed.data.postId },
      data:  { isPinned: parsed.data.isPinned },
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PATCH /api/admin/community error:', err)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Update failed' }, { status: 500 })
  }
}

// ── DELETE /api/admin/community ───────────────────────────────────────────────
// Delete a post.
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const role = await getRole()
  if (!role || !canManageCommunity(role)) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const postId = searchParams.get('postId')
  if (!postId) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'postId required' }, { status: 400 })
  }

  try {
    await db.post.delete({ where: { id: postId } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/admin/community error:', err)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Delete failed' }, { status: 500 })
  }
}
