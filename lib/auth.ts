// lib/auth.ts
// Clerk authentication helpers for Qasberry.
// Provides clean role extraction from Clerk session claims.
// Role is stored in Clerk publicMetadata — only editable server-side/via Clerk dashboard.

import { auth, currentUser } from '@clerk/nextjs/server'

export type UserRole = 'SUPER_ADMIN' | 'CONTENT_MANAGER' | 'MODERATOR' | 'STUDENT'

/**
 * Returns the role from the current Clerk session claims.
 * Safe to call from Server Components and API routes.
 * Falls back to 'STUDENT' if no role is set (new users before webhook fires).
 */
export async function getCurrentUserRole(): Promise<UserRole> {
  const { sessionClaims } = await auth()
  const role = (sessionClaims?.metadata as { role?: UserRole } | undefined)?.role
  return role ?? 'STUDENT'
}

/**
 * Returns the current Clerk user object, or null if not signed in.
 * Includes the role from publicMetadata.
 */
export async function getCurrentUser() {
  const user = await currentUser()
  if (!user) return null

  const role = (user.publicMetadata as { role?: UserRole })?.role ?? 'STUDENT'

  return {
    id: user.id,
    email: user.emailAddresses[0]?.emailAddress ?? '',
    name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
    role,
    imageUrl: user.imageUrl,
  }
}

/**
 * Returns true if the role has any admin panel access.
 * Used in middleware and UI guards.
 */
export function isAdminRole(role: UserRole): boolean {
  return ['SUPER_ADMIN', 'CONTENT_MANAGER', 'MODERATOR'].includes(role)
}

/**
 * Returns true if the role can manage courses (create, edit, publish).
 */
export function canManageCourses(role: UserRole): boolean {
  return ['SUPER_ADMIN', 'CONTENT_MANAGER'].includes(role)
}

/**
 * Returns true if the role can manage the community.
 */
export function canManageCommunity(role: UserRole): boolean {
  return ['SUPER_ADMIN', 'MODERATOR'].includes(role)
}

/**
 * Returns true if the role has full system access.
 */
export function isSuperAdmin(role: UserRole): boolean {
  return role === 'SUPER_ADMIN'
}
