// app/api/progress/route.ts
// POST — mark a lesson complete. Creates a Progress record.
// After marking, checks if ALL lessons in the course are complete → issues certificate.
// POST body: { lessonId: string; courseId: string }

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db }   from '@/lib/db'
import { z }    from 'zod'
import { sendCertificateEmail } from '@/lib/email'
import type { ApiResponse } from '@/types'

const BodySchema = z.object({
  lessonId: z.string().min(1),
  courseId: z.string().min(1),
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

  const { lessonId, courseId } = parsed.data

  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'User not found' }, { status: 404 })
  }

  // Verify the user is enrolled in the course
  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
  })
  if (!enrollment) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Not enrolled' }, { status: 403 })
  }

  // Upsert progress (idempotent)
  await db.progress.upsert({
    where:  { userId_lessonId: { userId: user.id, lessonId } },
    update: {},
    create: { userId: user.id, lessonId },
  })

  // ── Check if all lessons in the course are completed ────────────────────────
  const allLessons = await db.lesson.findMany({
    where: { module: { courseId } },
    select: { id: true },
  })

  const completedCount = await db.progress.count({
    where: {
      userId:   user.id,
      lessonId: { in: allLessons.map((l) => l.id) },
    },
  })

  let certificateIssued = false
  if (completedCount >= allLessons.length && allLessons.length > 0) {
    // Issue certificate if not already issued
    const existing = await db.certificate.findFirst({
      where: { userId: user.id, courseId },
    })
    if (!existing) {
      const cert = await db.certificate.create({
        data: { userId: user.id, courseId },
        include: { course: { select: { title: true } } },
      })
      certificateIssued = true

      // Send certificate email (best-effort)
      await sendCertificateEmail({
        to:            user.email,
        studentName:   user.name ?? 'Student',
        courseTitle:   cert.course.title,
        certificateId: cert.id,
      }).catch((err) => {
        console.error('⚠️ Certificate email failed (non-fatal):', err)
      })
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      completed:  completedCount,
      total:      allLessons.length,
      certificateIssued,
    },
  })
}

// GET — fetch progress for a course (array of completed lessonIds)
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const courseId = req.nextUrl.searchParams.get('courseId')
  if (!courseId) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'courseId required' }, { status: 400 })
  }

  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'User not found' }, { status: 404 })
  }

  const allLessons = await db.lesson.findMany({
    where:  { module: { courseId } },
    select: { id: true },
  })

  const progress = await db.progress.findMany({
    where: {
      userId:   user.id,
      lessonId: { in: allLessons.map((l) => l.id) },
    },
    select: { lessonId: true },
  })

  return NextResponse.json({
    success: true,
    data: {
      completedLessonIds: progress.map((p) => p.lessonId),
      total: allLessons.length,
    },
  })
}
