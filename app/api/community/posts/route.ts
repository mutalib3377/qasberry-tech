// app/api/community/posts/route.ts
// POST — create a new post in a community (members only).

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db }   from '@/lib/db'
import { z }    from 'zod'
import type { ApiResponse } from '@/types'

const BodySchema = z.object({
  communityId: z.string().min(1),
  content:     z.string().min(1).max(2000),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = BodySchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' },
      { status: 400 }
    )
  }

  const { communityId, content } = parsed.data

  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'User not found' }, { status: 404 })
  }

  // Check membership
  const member = await db.communityMember.findUnique({
    where: { userId_communityId: { userId: user.id, communityId } },
  })
  if (!member) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'You must join this community first.' }, { status: 403 })
  }

  const post = await db.post.create({
    data: { communityId, userId: user.id, content },
  })

  return NextResponse.json({ success: true, data: { id: post.id } })
}
