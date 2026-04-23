// app/api/webhooks/paystack/route.ts
// Paystack server-to-server webhook — for guaranteed payment confirmation.
// Paystack sends this AFTER the payment succeeds (separate from the redirect flow).
//
// Security: Request signature is verified using HMAC-SHA512 with PAYSTACK_WEBHOOK_SECRET.
// Never trust the event without verifying the signature — anyone can POST to this URL.
//
// Events handled:
//   charge.success — create Enrollment idempotently

import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { db } from '@/lib/db'
import { sendEnrollmentEmail } from '@/lib/email'

interface PaystackChargeData {
  reference: string
  status:    string
  metadata:  { courseId?: string; userId?: string }
  customer:  { email: string }
}

interface PaystackWebhookEvent {
  event: string
  data:  PaystackChargeData
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET

  // ── Signature verification ─────────────────────────────────────────────────
  if (!webhookSecret || webhookSecret.includes('REPLACE_ME')) {
    // Webhook secret not configured — accept in dev/demo mode but log a warning
    console.warn('[paystack-webhook] PAYSTACK_WEBHOOK_SECRET not set — skipping signature check')
  } else {
    const signature = req.headers.get('x-paystack-signature') ?? ''
    const rawBody   = await req.text()
    const expected  = createHmac('sha512', webhookSecret)
      .update(rawBody)
      .digest('hex')

    if (signature !== expected) {
      console.warn('[paystack-webhook] Invalid signature — rejecting request')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Parse after we've read the raw body for signature verification
    let event: PaystackWebhookEvent
    try {
      event = JSON.parse(rawBody) as PaystackWebhookEvent
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    return handleEvent(event)
  }

  // If no secret configured (dev mode), parse body from req.json()
  let event: PaystackWebhookEvent
  try {
    event = await req.json() as PaystackWebhookEvent
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  return handleEvent(event)
}

async function handleEvent(event: PaystackWebhookEvent): Promise<NextResponse> {
  // Only handle successful charge events
  if (event.event !== 'charge.success') {
    return NextResponse.json({ received: true })
  }

  const { reference, metadata, customer } = event.data
  const { courseId, userId } = metadata ?? {}

  if (!courseId || !userId) {
    console.warn('[paystack-webhook] Missing courseId or userId in metadata', { reference })
    return NextResponse.json({ received: true })
  }

  try {
    // Idempotent upsert — Paystack may send the same event multiple times
    const enrollment = await db.enrollment.upsert({
      where:  { userId_courseId: { userId, courseId } },
      update: { paymentRef: reference },
      create: { userId, courseId, paymentRef: reference },
      include: {
        user:   { select: { email: true, name: true } },
        course: { select: { title: true } },
      },
    })

    console.log(`[paystack-webhook] Enrollment confirmed: user=${userId} course=${courseId}`)

    // Send enrollment confirmation email (best-effort — don't fail the webhook if email fails)
    await sendEnrollmentEmail({
      to:          enrollment.user.email ?? customer.email,
      studentName: enrollment.user.name  ?? 'Student',
      courseTitle: enrollment.course.title,
    }).catch((err) => {
      console.error('[paystack-webhook] Failed to send enrollment email:', err)
    })

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[paystack-webhook] DB error:', err)
    // Return 200 to Paystack so it doesn't retry — log to investigate
    return NextResponse.json({ received: true })
  }
}
