// app/api/admin/courses/[courseId]/modules/[moduleId]/route.ts
// Admin API: Update and delete a single module.

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import type { UserRole, ApiResponse } from '@/types'

const COURSE_MANAGER_ROLES: UserRole[] = ['SUPER_ADMIN', 'CONTENT_MANAGER']

const updateModuleSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  order: z.number().int().min(0).optional(),
})

type RouteContext = { params: { courseId: string; moduleId: string } }

export async function PATCH(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
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

  const parsed = updateModuleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' },
      { status: 400 }
    )
  }

  try {
    const module = await db.module.update({
      where: { id: params.moduleId },
      data: parsed.data,
    })
    return NextResponse.json({ success: true, data: module })
  } catch (err) {
    console.error('PATCH module error:', err)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to update module' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { userId, sessionClaims } = await auth()
  if (!userId) return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })

  const role = (sessionClaims?.metadata as { role?: UserRole } | undefined)?.role
  if (!role || !COURSE_MANAGER_ROLES.includes(role)) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  try {
    // onDelete: Cascade in schema will remove all lessons inside this module
    await db.module.delete({ where: { id: params.moduleId } })
    return NextResponse.json({ success: true, data: { message: 'Module deleted' } })
  } catch (err) {
    console.error('DELETE module error:', err)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to delete module' }, { status: 500 })
  }
}
