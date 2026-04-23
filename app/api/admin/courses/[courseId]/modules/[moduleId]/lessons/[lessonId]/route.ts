// app/api/admin/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]/route.ts
// Admin API: Update and delete a single lesson.

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import type { UserRole, ApiResponse } from '@/types'

const COURSE_MANAGER_ROLES: UserRole[] = ['SUPER_ADMIN', 'CONTENT_MANAGER']

const updateLessonSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  order: z.number().int().min(0).optional(),
  isFree: z.boolean().optional(),
  videoUrl: z.string().url().nullable().optional(),
  muxAssetId: z.string().nullable().optional(),
  muxPlaybackId: z.string().nullable().optional(),
  duration: z.number().int().nullable().optional(),
})

type RouteContext = { params: { courseId: string; moduleId: string; lessonId: string } }

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

  const parsed = updateLessonSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' },
      { status: 400 }
    )
  }

  try {
    const lesson = await db.lesson.update({
      where: { id: params.lessonId },
      data: parsed.data,
    })
    return NextResponse.json({ success: true, data: lesson })
  } catch (err) {
    console.error('PATCH lesson error:', err)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to update lesson' }, { status: 500 })
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
    await db.lesson.delete({ where: { id: params.lessonId } })
    return NextResponse.json({ success: true, data: { message: 'Lesson deleted' } })
  } catch (err) {
    console.error('DELETE lesson error:', err)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to delete lesson' }, { status: 500 })
  }
}
