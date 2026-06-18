// middleware.ts
// Next.js middleware for Qasberry — runs on every request matching the config.
// Enforces:
//   - /admin/* routes: must be signed in AND have an admin role
//   - /dashboard/* routes: must be signed in
//   - All other routes: public, pass through freely
//
// IMPORTANT: Clerk does NOT include publicMetadata in session JWT claims by default.
// We use the Clerk backend client to fetch the user's publicMetadata for admin checks.
// This is safe and necessary for server-side role enforcement.

import { clerkMiddleware, createRouteMatcher, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { UserRole } from '@/types'

const isAdminRoute    = createRouteMatcher(['/admin(.*)'])
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/learn(.*)', '/onboarding(.*)'])
const isAuthRoute      = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])

// Roles that are permitted to access /admin routes
const ADMIN_ROLES: UserRole[] = ['SUPER_ADMIN', 'CONTENT_MANAGER', 'MODERATOR']

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()

  // ── Auth routes: redirect signed-in users away from sign-in/sign-up ──
  if (isAuthRoute(req) && userId) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // ── Protected student routes: require authentication ──
  if (isProtectedRoute(req)) {
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', req.url))
    }
    return NextResponse.next()
  }

  // ── Admin routes: require authentication + admin role ──
  if (isAdminRoute(req)) {
    if (!userId) {
      // Not signed in — redirect to homepage
      return NextResponse.redirect(new URL('/', req.url))
    }

    try {
      // Fetch the real user object from Clerk backend to read publicMetadata.
      // Session JWT claims do NOT include publicMetadata by default in Clerk.
      const client = await clerkClient()
      const user   = await client.users.getUser(userId)
      const role   = (user.publicMetadata as { role?: UserRole })?.role

      if (!role || !ADMIN_ROLES.includes(role)) {
        // Signed in but not an admin — redirect to homepage (NOT /dashboard to avoid loop)
        return NextResponse.redirect(new URL('/', req.url))
      }

      // Valid admin role — allow through
      return NextResponse.next()
    } catch {
      // If Clerk API call fails, deny access safely
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  // ── All other routes: public, pass through ──
  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
