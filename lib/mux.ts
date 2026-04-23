// lib/mux.ts
// Mux API helpers for Qasberry.
// Handles direct upload URL creation and signed playback token generation.
//
// Env vars required:
//   MUX_TOKEN_ID        — Mux API token ID (from Mux dashboard > Settings > API Tokens)
//   MUX_TOKEN_SECRET    — Mux API token secret
//   MUX_SIGNING_KEY_ID  — Mux signing key ID (for signed playback tokens)
//   MUX_SIGNING_PRIVATE_KEY — Mux signing key (base64-encoded private key)

import Mux from '@mux/mux-node'

// Security: Mux client is only ever instantiated server-side — never exposed to the client.
const muxClient = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
})

export const { video } = muxClient

/**
 * Creates a Mux direct upload URL.
 * The admin uploads the video file directly from the browser to Mux —
 * the video bytes never pass through our server, keeping bandwidth costs zero.
 *
 * Returns: { uploadId, uploadUrl }
 */
export async function createMuxUpload(): Promise<{
  uploadId: string
  uploadUrl: string
}> {
  const upload = await video.uploads.create({
    cors_origin: process.env.NEXT_PUBLIC_APP_URL ?? '*',
    new_asset_settings: {
      playback_policy: ['signed'], // Security: signed-only — no public playback URLs
      encoding_tier: 'smart',
    },
  })

  return {
    uploadId: upload.id,
    uploadUrl: upload.url,
  }
}

/**
 * Retrieves a Mux upload by ID (used to find the asset ID after upload completes).
 */
export async function getMuxUpload(uploadId: string) {
  return video.uploads.retrieve(uploadId)
}

/**
 * Retrieves a Mux asset by ID.
 */
export async function getMuxAsset(assetId: string) {
  return video.assets.retrieve(assetId)
}

/**
 * Deletes a Mux asset by ID.
 * Called when a lesson is deleted from an admin's course.
 */
export async function deleteMuxAsset(assetId: string): Promise<void> {
  await video.assets.delete(assetId)
}
