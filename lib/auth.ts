// lib/auth.ts
// Clerk authentication helpers for Qasberry.
// Role is stored in Clerk publicMetadata — only editable server-side/via Clerk dashboard.
//
// IMPORTANT: Clerk does NOT include publicMetadata in session JWTs by default.
// Always use getAuthenticatedUserRole() in API routes — it reads from the Clerk
// user record directly via clerkClient, guaranteeing the latest role value.

import { auth, currentUser, clerkClient } from '@clerk/nextjs/server'

export type UserRole = 'SUPER_ADMIN' | 'CONTENT_MANAGER' | 'MODERATOR' | 'STUDENT'

/**
 * Reads the role directly from the Clerk user's publicMetadata.
 * Use this in all API routes — it is always up-to-date.
 * Returns null if the user is not authenticated.
 */
export async function getAuthenticatedUserRole(): Promise<{ userId: string; role: UserRole } | null> {
  const { userId } = await auth()
  if (!userId) return null
  const clerk = await clerkClient()
  const clerkUser = await clerk.users.getUser(userId)
  const role = (clerkUser.publicMetadata as { role?: UserRole })?.role ?? 'STUDENT'
  return { userId, role }
}

/**
 * Returns the role from the current Clerk session claims.
 * NOTE: Falls back to 'STUDENT' — use getAuthenticatedUserRole() in API routes.
 * @deprecated Use getAuthenticatedUserRole() instead for reliable role reads.
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
