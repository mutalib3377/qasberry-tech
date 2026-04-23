// app/api/admin/careers/route.ts
// Admin API: List all careers (for course creation dropdown).
// Public-ish — any signed-in admin can fetch this.

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import type { UserRole, ApiResponse } from '@/types'

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const { userId, sessionClaims } = await auth()
  if (!userId) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const role = (sessionClaims?.metadata as { role?: UserRole } | undefined)?.role
  if (!role || !(['SUPER_ADMIN', 'CONTENT_MANAGER', 'MODERATOR'] as UserRole[]).includes(role)) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  try {
    const careers = await db.career.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true },
    })
    return NextResponse.json({ success: true, data: careers })
  } catch (err) {
    console.error('GET /api/admin/careers error:', err)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to fetch careers' }, { status: 500 })
  }
}
