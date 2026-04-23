// app/api/admin/courses/[courseId]/modules/[moduleId]/lessons/route.ts
// Admin API: List and create lessons within a module.

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import type { UserRole, ApiResponse } from '@/types'

const COURSE_MANAGER_ROLES: UserRole[] = ['SUPER_ADMIN', 'CONTENT_MANAGER']

const createLessonSchema = z.object({
  title: z.string().min(1, 'Lesson title is required').max(120),
  order: z.number().int().min(0).default(0),
  isFree: z.boolean().default(false),
  videoUrl: z.string().url().nullable().optional(),
  muxAssetId: z.string().nullable().optional(),
  muxPlaybackId: z.string().nullable().optional(),
  duration: z.number().int().nullable().optional(),
})

type RouteContext = { params: { courseId: string; moduleId: string } }

export async function GET(_req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { userId, sessionClaims } = await auth()
  if (!userId) return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })

  const role = (sessionClaims?.metadata as { role?: UserRole } | undefined)?.role
  if (!role || !(['SUPER_ADMIN', 'CONTENT_MANAGER', 'MODERATOR'] as UserRole[]).includes(role)) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  try {
    const lessons = await db.lesson.findMany({
      where: { moduleId: params.moduleId },
      orderBy: { order: 'asc' },
    })
    return NextResponse.json({ success: true, data: lessons })
  } catch (err) {
    console.error('GET lessons error:', err)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to fetch lessons' }, { status: 500 })
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

  const parsed = createLessonSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' },
      { status: 400 }
    )
  }

  // Verify the module belongs to the course
  const module = await db.module.findFirst({
    where: { id: params.moduleId, courseId: params.courseId },
  })
  if (!module) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Module not found' }, { status: 404 })
  }

  try {
    const lesson = await db.lesson.create({
      data: {
        moduleId: params.moduleId,
        title: parsed.data.title,
        order: parsed.data.order,
        isFree: parsed.data.isFree,
        videoUrl: parsed.data.videoUrl ?? null,
        muxAssetId: parsed.data.muxAssetId ?? null,
        muxPlaybackId: parsed.data.muxPlaybackId ?? null,
        duration: parsed.data.duration ?? null,
      },
    })
    return NextResponse.json({ success: true, data: lesson }, { status: 201 })
  } catch (err) {
    console.error('POST lesson error:', err)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to create lesson' }, { status: 500 })
  }
}
