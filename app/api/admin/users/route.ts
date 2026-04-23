// app/api/admin/users/route.ts
// Admin API: paginated user list + role/suspension management.
// SUPER_ADMIN only for PATCH; all admins can GET.

import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import type { UserRole, ApiResponse } from '@/types'
import { z } from 'zod'

const ADMIN_ROLES: UserRole[] = ['SUPER_ADMIN', 'CONTENT_MANAGER', 'MODERATOR']

async function getRole(): Promise<UserRole | null> {
  const { userId, sessionClaims } = await auth()
  if (!userId) return null
  return (sessionClaims?.metadata as { role?: UserRole } | undefined)?.role ?? null
}

// ── GET /api/admin/users ──────────────────────────────────────────────────────
export async function GET(req: NextRequest): Promise<NextResponse> {
  const role = await getRole()
  if (!role || !ADMIN_ROLES.includes(role)) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const page   = Math.max(1, parseInt(searchParams.get('page')   ?? '1'))
  const limit  = 20
  const skip   = (page - 1) * limit
  const search = searchParams.get('search')?.trim() ?? ''
  const roleFilter = searchParams.get('role') as UserRole | null

  const where = {
    ...(search
      ? {
          OR: [
            { name:  { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(roleFilter ? { role: roleFilter } : {}),
  }

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        clerkId: true,
        email: true,
        name: true,
        role: true,
        career: true,
        isSuspended: true,
        createdAt: true,
        _count: { select: { enrollments: true } },
      },
    }),
    db.user.count({ where }),
  ])

  return NextResponse.json({ success: true, data: { users, total, page, limit } })
}

// ── PATCH /api/admin/users ────────────────────────────────────────────────────
const PatchSchema = z.object({
  userId:      z.string().min(1),
  action:      z.enum(['setRole', 'suspend', 'reactivate']),
  role:        z.enum(['SUPER_ADMIN', 'CONTENT_MANAGER', 'MODERATOR', 'STUDENT']).optional(),
})

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const role = await getRole()
  if (role !== 'SUPER_ADMIN') {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  const bodyRaw = await req.json()
  const parsed  = PatchSchema.safeParse(bodyRaw)
  if (!parsed.success) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' },
      { status: 400 }
    )
  }

  const { userId, action, role: newRole } = parsed.data

  try {
    const client = await clerkClient()

    if (action === 'setRole') {
      if (!newRole) {
        return NextResponse.json<ApiResponse>({ success: false, error: 'role is required' }, { status: 400 })
      }
      // Update Clerk metadata + DB in parallel
      await Promise.all([
        client.users.updateUserMetadata(
          (await db.user.findUnique({ where: { id: userId }, select: { clerkId: true } }))!.clerkId,
          { publicMetadata: { role: newRole } }
        ),
        db.user.update({ where: { id: userId }, data: { role: newRole } }),
      ])
    } else {
      const isSuspended = action === 'suspend'
      const dbUser = await db.user.findUnique({ where: { id: userId }, select: { clerkId: true } })
      if (!dbUser) return NextResponse.json<ApiResponse>({ success: false, error: 'User not found' }, { status: 404 })
      await Promise.all([
        isSuspended
          ? client.users.banUser(dbUser.clerkId)
          : client.users.unbanUser(dbUser.clerkId),
        db.user.update({ where: { id: userId }, data: { isSuspended } }),
      ])
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PATCH /api/admin/users error:', err)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Update failed' }, { status: 500 })
  }
}
