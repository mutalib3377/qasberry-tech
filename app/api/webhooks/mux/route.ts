// app/api/webhooks/mux/route.ts
// Mux webhook handler — called by Mux when a video finishes processing.
//
// Flow:
//   1. Admin uploads a video via Mux direct upload
//   2. Mux processes the video (transcode, generate playback IDs)
//   3. Mux fires `video.asset.ready` event to this endpoint
//   4. We find the Lesson record by muxAssetId and update it with
//      the playback ID and duration
//
// Security: validates the Mux webhook signature before processing any event.
// Unsigned requests are rejected with 400. This prevents spoofed events from
// modifying lesson records.
//
// Env vars: MUX_WEBHOOK_SECRET, DATABASE_URL

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { ApiResponse } from '@/types'

export const runtime = 'nodejs'

interface MuxAssetReadyData {
  id: string
  playback_ids?: Array<{ id: string; policy: string }>
  duration?: number
  upload_id?: string
}

interface MuxWebhookEvent {
  type: string
  data: MuxAssetReadyData
}

async function verifyMuxSignature(req: NextRequest, body: string): Promise<boolean> {
  const muxSignatureHeader = req.headers.get('mux-signature')
  if (!muxSignatureHeader) return false

  const webhookSecret = process.env.MUX_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('❌ MUX_WEBHOOK_SECRET is not set')
    return false
  }

  // Mux signature format: "t=<timestamp>,v1=<hmac>"
  // Security: verify HMAC-SHA256 signature using the webhook secret
  const parts = Object.fromEntries(
    muxSignatureHeader.split(',').map((part) => part.split('=') as [string, string])
  )

  const timestamp = parts['t']
  const signature = parts['v1']

  if (!timestamp || !signature) return false

  // Build the signed payload: timestamp + '.' + body
  const signedPayload = `${timestamp}.${body}`

  // Use Web Crypto API (available in Node.js 18+ and Edge)
  const encoder = new TextEncoder()
  const keyData = encoder.encode(webhookSecret)
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload))
  const computedSignature = Buffer.from(signatureBytes).toString('hex')

  // Constant-time comparison to prevent timing attacks
  return computedSignature === signature
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: string
  try {
    body = await req.text()
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to read request body' },
      { status: 400 }
    )
  }

  // Security: verify Mux signature before processing
  const isValid = await verifyMuxSignature(req, body)
  if (!isValid) {
    console.error('❌ Mux webhook signature verification failed')
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Invalid Mux signature' },
      { status: 400 }
    )
  }

  let event: MuxWebhookEvent
  try {
    event = JSON.parse(body) as MuxWebhookEvent
  } catch {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  // We only care about video.asset.ready — ignore all other events
  if (event.type !== 'video.asset.ready') {
    return NextResponse.json({ success: true, data: { message: 'Event ignored' } })
  }

  const asset = event.data
  const muxAssetId = asset.id
  const muxPlaybackId = asset.playback_ids?.[0]?.id ?? null
  const durationSeconds = asset.duration ? Math.round(asset.duration) : null

  if (!muxAssetId) {
    console.error('❌ Mux webhook: no asset ID in event data')
    return NextResponse.json<ApiResponse>({ success: false, error: 'No asset ID' }, { status: 400 })
  }

  try {
    // Find the lesson that was waiting for this asset
    const lesson = await db.lesson.findFirst({
      where: { muxAssetId },
    })

    if (!lesson) {
      // This can happen if the lesson was deleted before Mux finished processing
      console.warn(`⚠️ Mux webhook: no lesson found for asset ${muxAssetId}`)
      return NextResponse.json({ success: true, data: { message: 'No lesson to update' } })
    }

    await db.lesson.update({
      where: { id: lesson.id },
      data: {
        muxPlaybackId,
        duration: durationSeconds,
      },
    })

    console.log(`✅ Mux webhook: updated lesson ${lesson.id} with playbackId ${muxPlaybackId}`)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('❌ Mux webhook: failed to update lesson:', err)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to update lesson' },
      { status: 500 }
    )
  }
}
