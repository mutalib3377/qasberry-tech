// app/api/learn/[courseId]/route.ts
// Returns full course structure for an enrolled user (includes muxPlaybackId for lessons).
// GET /api/learn/[courseId]

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db }   from '@/lib/db'
import type { ApiResponse } from '@/types'

export async function GET(
  _req: NextRequest,
  { params }: { params: { courseId: string } }
): Promise<NextResponse> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'User not found' }, { status: 404 })
  }

  // Check enrollment
  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId: params.courseId } },
  })
  if (!enrollment) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Not enrolled' }, { status: 403 })
  }

  const course = await db.course.findUnique({
    where:   { id: params.courseId },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: {
          lessons: {
            orderBy: { order: 'asc' },
            // Return muxPlaybackId since user is enrolled
            select: {
              id: true, title: true, order: true,
              isFree: true, duration: true, muxPlaybackId: true,
            },
          },
        },
      },
    },
  })

  if (!course) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Course not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: course })
}
