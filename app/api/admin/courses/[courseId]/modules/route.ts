// app/api/admin/courses/[courseId]/modules/route.ts
// Admin API: List and create modules for a course.
// A module groups lessons — it has a title and an order position.

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import type { UserRole, ApiResponse } from '@/types'

const COURSE_MANAGER_ROLES: UserRole[] = ['SUPER_ADMIN', 'CONTENT_MANAGER']

const createModuleSchema = z.object({
  title: z.string().min(1, 'Module title is required').max(120),
  order: z.number().int().min(0).default(0),
})

type RouteContext = { params: { courseId: string } }

export async function GET(_req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { userId, sessionClaims } = await auth()
  if (!userId) return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })

  const role = (sessionClaims?.metadata as { role?: UserRole } | undefined)?.role
  if (!role || !(['SUPER_ADMIN', 'CONTENT_MANAGER', 'MODERATOR'] as UserRole[]).includes(role)) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  try {
    const modules = await db.module.findMany({
      where: { courseId: params.courseId },
      orderBy: { order: 'asc' },
      include: { lessons: { orderBy: { order: 'asc' } } },
    })
    return NextResponse.json({ success: true, data: modules })
  } catch (err) {
    console.error('GET modules error:', err)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to fetch modules' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { userId, sessionClaims } = await auth()
  if (!userId) return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })

  const role = (sessionClaims?.metadata as { role?: UserRole } | undefined)?.role
  if (!role || !COURSE_MANAGER_ROLES.includes(role)) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = createModuleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' },
      { status: 400 }
    )
  }

  // Verify the course exists
  const course = await db.course.findUnique({ where: { id: params.courseId } })
  if (!course) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Course not found' }, { status: 404 })
  }

  try {
    const module = await db.module.create({
      data: { courseId: params.courseId, title: parsed.data.title, order: parsed.data.order },
      include: { lessons: true },
    })
    return NextResponse.json({ success: true, data: module }, { status: 201 })
  } catch (err) {
    console.error('POST modules error:', err)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to create module' }, { status: 500 })
  }
}
