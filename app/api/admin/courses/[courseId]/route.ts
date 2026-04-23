// app/api/admin/courses/[courseId]/route.ts
// Admin API: Get, update, and soft-delete a single course.
//
// DELETE is a soft-delete: sets status to ARCHIVED, never hard-deletes.
// This preserves enrollment history and certificates for existing students.
//
// Security: auth + role checked on every request.

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { generateSlug } from '@/lib/slugify'
import type { UserRole, ApiResponse } from '@/types'

const COURSE_MANAGER_ROLES: UserRole[] = ['SUPER_ADMIN', 'CONTENT_MANAGER']

const updateCourseSchema = z.object({
  title: z.string().min(3).max(120).optional(),
  description: z.string().max(2000).nullable().optional(),
  careerId: z.string().min(1).optional(),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  price: z.coerce.number().min(0).optional(),
  isFree: z.boolean().optional(),
  thumbnail: z.string().url().nullable().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
})

type RouteContext = { params: { courseId: string } }

// ─── GET /api/admin/courses/[courseId] ────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { userId, sessionClaims } = await auth()
  if (!userId) return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })

  const role = (sessionClaims?.metadata as { role?: UserRole } | undefined)?.role
  if (!role || !(['SUPER_ADMIN', 'CONTENT_MANAGER', 'MODERATOR'] as UserRole[]).includes(role)) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  try {
    const course = await db.course.findUnique({
      where: { id: params.courseId },
      include: {
        career: { select: { id: true, name: true, slug: true } },
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: { orderBy: { order: 'asc' } },
          },
        },
        _count: { select: { enrollments: true } },
      },
    })

    if (!course) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Course not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: course })
  } catch (err) {
    console.error('GET /api/admin/courses/[courseId] error:', err)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to fetch course' }, { status: 500 })
  }
}

// ─── PATCH /api/admin/courses/[courseId] ──────────────────────────────────────

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

  const parsed = updateCourseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' },
      { status: 400 }
    )
  }

  const { title, ...rest } = parsed.data

  try {
    const course = await db.course.update({
      where: { id: params.courseId },
      data: {
        ...(title ? { title, slug: generateSlug(title) } : {}),
        ...rest,
      },
      include: {
        career: { select: { id: true, name: true, slug: true } },
      },
    })

    return NextResponse.json({ success: true, data: course })
  } catch (err) {
    console.error('PATCH /api/admin/courses/[courseId] error:', err)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to update course' }, { status: 500 })
  }
}

// ─── DELETE /api/admin/courses/[courseId] ─────────────────────────────────────
// Soft delete only — sets status to ARCHIVED. Never hard-deletes.

export async function DELETE(_req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const { userId, sessionClaims } = await auth()
  if (!userId) return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })

  // Only SUPER_ADMIN can archive courses
  const role = (sessionClaims?.metadata as { role?: UserRole } | undefined)?.role
  if (role !== 'SUPER_ADMIN') {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Only Super Admins can archive courses' }, { status: 403 })
  }

  try {
    // Security: soft delete — preserves enrollment history and certificates
    await db.course.update({
      where: { id: params.courseId },
      data: { status: 'ARCHIVED' },
    })

    return NextResponse.json({ success: true, data: { message: 'Course archived' } })
  } catch (err) {
    console.error('DELETE /api/admin/courses/[courseId] error:', err)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to archive course' }, { status: 500 })
  }
}
