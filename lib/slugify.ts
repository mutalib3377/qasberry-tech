// lib/slugify.ts
// Slug generation utility for Qasberry.
// Creates URL-safe, lowercase, hyphenated slugs from course titles.
// Strips special characters and ensures uniqueness is handled at the DB level (unique constraint).

import slugifyLib from 'slugify'

/**
 * Generates a clean URL slug from a course title.
 * Example: "AI for Nurses & Healthcare" → "ai-for-nurses-and-healthcare"
 */
export function generateSlug(title: string): string {
  return slugifyLib(title, {
    lower: true,
    strict: true,     // strips all special chars except hyphens
    replacement: '-',
    trim: true,
  })
}

/**
 * Appends a short random suffix to make a slug unique.
 * Used when a base slug already exists in the database.
 * Example: "ai-for-nurses" → "ai-for-nurses-k3f9"
 */
export function generateUniqueSlug(title: string): string {
  const base = generateSlug(title)
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${base}-${suffix}`
}
