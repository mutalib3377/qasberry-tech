// app/api/payments/enroll-free/route.ts
// Enroll a signed-in user into a FREE course directly (no payment needed).
// POST body: { courseId: string }

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db }   from '@/lib/db'
import { z }    from 'zod'
import { sendEnrollmentEmail } from '@/lib/email'
import type { ApiResponse } from '@/types'

const BodySchema = z.object({ courseId: z.string().min(1) })

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = BodySchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Invalid request' }, { status: 400 })
  }

  const { courseId } = parsed.data

  const [user, course] = await Promise.all([
    db.user.findUnique({ where: { clerkId } }),
    db.course.findUnique({ where: { id: courseId } }),
  ])

  if (!user) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'User not found' }, { status: 404 })
  }
  if (!course) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Course not found' }, { status: 404 })
  }
  if (!course.isFree) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'This course is not free' }, { status: 400 })
  }

  // Upsert — idempotent so double-clicks are safe
  const enrollment = await db.enrollment.upsert({
    where:  { userId_courseId: { userId: user.id, courseId } },
    update: {},
    create: { userId: user.id, courseId },
  })

  // Send enrollment confirmation email (best-effort)
  if (enrollment) {
    await sendEnrollmentEmail({
      to:          user.email,
      studentName: user.name ?? 'Student',
      courseTitle: course.title,
      courseId,
    }).catch((err) => {
      console.error('⚠️ Enrollment email failed (non-fatal):', err)
    })
  }

  return NextResponse.json({ success: true })
}
