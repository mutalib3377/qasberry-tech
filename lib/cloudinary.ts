// lib/cloudinary.ts
// Cloudinary server-side helpers for Qasberry.
// Used for: course thumbnail upload validation and signed URL generation.
//
// The actual file upload is done client-side using next-cloudinary's CldUploadWidget
// with an unsigned upload preset — no credentials needed on the client.
//
// Env vars:
//   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME — cloud name (safe to expose)
//   CLOUDINARY_API_KEY                — server-side only
//   CLOUDINARY_API_SECRET             — server-side only, NEVER expose to client

import { v2 as cloudinary } from 'cloudinary'

// Security: cloudinary.config() is called server-side only.
// API_KEY and API_SECRET must NEVER appear in client bundles.
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export { cloudinary }

/**
 * Deletes a Cloudinary asset by public_id.
 * Called when a course thumbnail is replaced or a course is deleted.
 */
export async function deleteCloudinaryAsset(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId)
}

/**
 * The upload preset name for course thumbnails.
 * This preset must be created in the Cloudinary dashboard:
 *   - Mode: Unsigned
 *   - Allowed formats: jpg, jpeg, png, webp
 *   - Max file size: 5MB
 *   - Folder: qasberry/thumbnails
 */
export const CLOUDINARY_THUMBNAIL_PRESET = 'qasberry_thumbnails'
