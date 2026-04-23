// app/api/payments/verify/route.ts
// Paystack payment verification — called via redirect after successful payment.
// GET ?reference=xxx  →  verifies with Paystack, creates Enrollment, redirects to learn page.
// Env: PAYSTACK_SECRET_KEY

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface PaystackVerifyResponse {
  status:  boolean
  message: string
  data: {
    status:    string
    reference: string
    metadata: { courseId: string; userId: string }
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const reference = req.nextUrl.searchParams.get('reference')
  const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001'

  if (!reference) {
    return NextResponse.redirect(new URL('/dashboard', appUrl))
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY
  if (!secretKey || secretKey.includes('REPLACE_ME')) {
    return NextResponse.redirect(new URL('/dashboard', appUrl))
  }

  try {
    const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    })
    const body = await res.json() as PaystackVerifyResponse

    if (!body.status || body.data.status !== 'success') {
      return NextResponse.redirect(new URL('/dashboard?payment=failed', appUrl))
    }

    const { courseId, userId } = body.data.metadata

    // Idempotent upsert — Paystack webhooks can fire multiple times
    await db.enrollment.upsert({
      where:  { userId_courseId: { userId, courseId } },
      update: { paymentRef: reference },
      create: { userId, courseId, paymentRef: reference },
    })

    return NextResponse.redirect(new URL(`/learn/${courseId}`, appUrl))
  } catch (err) {
    console.error('Payment verify error:', err)
    return NextResponse.redirect(new URL('/dashboard?payment=error', appUrl))
  }
}
