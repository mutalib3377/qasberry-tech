// app/api/webhooks/clerk/route.ts
// Clerk webhook endpoint — syncs new users to the Postgres User table.
//
// Security: validates the svix signature on EVERY request.
// Any request without a valid signature is rejected with 400.
// This prevents attackers from spoofing Clerk events.
//
// Env vars required:
//   CLERK_WEBHOOK_SECRET — from Clerk dashboard > Webhooks
//   DATABASE_URL — for Prisma

import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { db } from '@/lib/db'
import { sendWelcomeEmail } from '@/lib/email'
import type { ClerkWebhookEvent, UserRole } from '@/types'

// Disable body parsing — we need the raw body for svix signature verification
export const runtime = 'nodejs'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('❌ CLERK_WEBHOOK_SECRET is not set')
    return NextResponse.json(
      { success: false, error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  // ── Step 1: Extract svix headers for signature verification ──
  // Security: svix-signature is an HMAC-SHA256 signature over the raw body.
  // Without this check, anyone could POST fake events and create arbitrary users.
  const svixId = req.headers.get('svix-id')
  const svixTimestamp = req.headers.get('svix-timestamp')
  const svixSignature = req.headers.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { success: false, error: 'Missing svix headers — request rejected' },
      { status: 400 }
    )
  }

  // ── Step 2: Read raw body as text for signature verification ──
  let body: string
  try {
    body = await req.text()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to read request body' },
      { status: 400 }
    )
  }

  // ── Step 3: Verify signature using svix ──
  // Security: this step cryptographically confirms the request came from Clerk.
  const wh = new Webhook(webhookSecret)
  let event: ClerkWebhookEvent

  try {
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkWebhookEvent
  } catch (err) {
    console.error('❌ Clerk webhook signature verification failed:', err)
    return NextResponse.json(
      { success: false, error: 'Invalid webhook signature' },
      { status: 400 }
    )
  }

  // ── Step 4: Handle the event ──
  if (event.type === 'user.created') {
    const clerkUser = event.data

    try {
      const primaryEmail = clerkUser.email_addresses?.[0]?.email_address

      if (!primaryEmail) {
        // Clerk's test tool sends example payloads with no email. Skip gracefully.
        console.warn('⚠️ No email on user — skipping (likely a Clerk test event):', clerkUser.id)
        return NextResponse.json({ success: true, data: { skipped: true } })
      }

      // Get role from publicMetadata — default to STUDENT for all new sign-ups.
      // Security: role is set server-side only (via Clerk dashboard or admin API),
      // never from user-provided data.
      const role: UserRole =
        (clerkUser.public_metadata?.role as UserRole | undefined) ?? 'STUDENT'

      const name = [clerkUser.first_name, clerkUser.last_name]
        .filter(Boolean)
        .join(' ')
        .trim() || null

      // Create the User record in Postgres
      await db.user.create({
        data: {
          clerkId: clerkUser.id,
          email: primaryEmail,
          name,
          role,
        },
      })

      console.log(`✅ Created User in Postgres for Clerk ID: ${clerkUser.id}`)

      // Send welcome email — best-effort (email failure must never block the webhook)
      await sendWelcomeEmail({
        to:        primaryEmail,
        firstName: clerkUser.first_name ?? 'there',
      }).catch((err) => {
        console.error('⚠️ Welcome email failed (non-fatal):', err)
      })
    } catch (err) {
      console.error('❌ Failed to create User in Postgres:', err)
      // Security: never leak raw Prisma error messages — return generic 500
      return NextResponse.json(
        { success: false, error: 'Failed to create user record' },
        { status: 500 }
      )
    }
  }

  // Acknowledge all other event types with 200 (Clerk will retry on non-2xx)
  return NextResponse.json({ success: true })
}
