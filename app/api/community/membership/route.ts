// app/api/community/membership/route.ts
// POST — join or leave a community.
// Body: { communityId: string; action: 'join' | 'leave' }

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db }   from '@/lib/db'
import { z }    from 'zod'
import type { ApiResponse } from '@/types'

const BodySchema = z.object({
  communityId: z.string().min(1),
  action:      z.enum(['join', 'leave']),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = BodySchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Invalid request' }, { status: 400 })
  }

  const { communityId, action } = parsed.data

  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'User not found' }, { status: 404 })
  }

  if (action === 'join') {
    await db.communityMember.upsert({
      where:  { userId_communityId: { userId: user.id, communityId } },
      update: {},
      create: { userId: user.id, communityId },
    })
  } else {
    await db.communityMember.deleteMany({
      where: { userId: user.id, communityId },
    })
  }

  return NextResponse.json({ success: true, data: { action } })
}
