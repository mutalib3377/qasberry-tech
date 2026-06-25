// app/api/payments/initiate/route.ts
// Initiate a Paystack payment for a paid course.
// POST body: { courseId: string }
// Returns: { success: true, url: string } — Paystack checkout URL
// Env: PAYSTACK_SECRET_KEY, NEXT_PUBLIC_APP_URL

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db }   from '@/lib/db'
import { z }    from 'zod'
import type { ApiResponse } from '@/types'

const BodySchema = z.object({ courseId: z.string().min(1) })

interface PaystackInitResponse {
  status:  boolean
  message: string
  data:    { authorization_url: string; access_code: string; reference: string }
}

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
  const secretKey    = process.env.PAYSTACK_SECRET_KEY

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

  // Already enrolled — redirect straight to learn
  const existing = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
  })
  if (existing) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001'
    return NextResponse.json({ success: true, url: `${appUrl}/learn/${courseId}` })
  }

  // No Paystack key — create enrollment immediately for dev/demo
  if (!secretKey || secretKey.includes('REPLACE_ME')) {
    await db.enrollment.create({ data: { userId: user.id, courseId, paymentRef: 'DEMO' } })
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001'
    return NextResponse.json({ success: true, url: `${appUrl}/learn/${courseId}` })
  }

  const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001'
  const amountCents = Math.round(Number(course.price) * 100) // Paystack uses cents for USD

  const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email:        user.email,
      amount:       amountCents,
      currency:     'USD',
      reference:    `qas_${user.id}_${courseId}_${Date.now()}`,
      callback_url: `${appUrl}/api/payments/verify`,
      metadata:     { courseId, userId: user.id },
    }),
  })

  if (!paystackRes.ok) {
    console.error('Paystack init error', await paystackRes.text())
    return NextResponse.json<ApiResponse>({ success: false, error: 'Payment gateway error' }, { status: 502 })
  }

  const body = await paystackRes.json() as PaystackInitResponse
  return NextResponse.json({ success: true, url: body.data.authorization_url })
}
