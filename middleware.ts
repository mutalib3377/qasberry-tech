// middleware.ts
// Next.js middleware for Qasberry — runs on every request matching the config.
// Enforces:
//   - /admin/* routes: must be signed in AND have an admin role
//   - /dashboard/* routes: must be signed in
//   - All other routes: public, pass through freely
//
// Security note: Role is read from Clerk sessionClaims.metadata (set via
// Clerk publicMetadata). This is cryptographically signed by Clerk and cannot
// be tampered with by the client — safe to trust in middleware.

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { UserRole } from '@/types'

const isAdminRoute = createRouteMatcher(['/admin(.*)'])
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/learn(.*)', '/onboarding(.*)'])
const isAuthRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])

// Roles that are permitted to access /admin routes
const ADMIN_ROLES: UserRole[] = ['SUPER_ADMIN', 'CONTENT_MANAGER', 'MODERATOR']

export default clerkMiddleware(async (auth, req) => {
  // Extract userId and sessionClaims from Clerk
  const { userId, sessionClaims } = await auth()

  // ── Auth routes: redirect signed-in users away from sign-in/sign-up ──
  if (isAuthRoute(req) && userId) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // ── Protected student routes: require authentication ──
  if (isProtectedRoute(req)) {
    if (!userId) {
      // Not signed in — redirect to sign-in
      return NextResponse.redirect(new URL('/sign-in', req.url))
    }
    // Authenticated — allow through
    return NextResponse.next()
  }

  // ── Admin routes: require authentication + admin role ──
  if (isAdminRoute(req)) {
    if (!userId) {
      // Not signed in — redirect to homepage
      return NextResponse.redirect(new URL('/', req.url))
    }

    // Read role from Clerk session claims (publicMetadata is included in JWT)
    // Security: never trust client-provided role — always read from signed session claims
    const role = (sessionClaims?.metadata as { role?: UserRole } | undefined)?.role

    if (!role || !ADMIN_ROLES.includes(role)) {
      // Signed in but not an admin — redirect to homepage
      return NextResponse.redirect(new URL('/', req.url))
    }

    // Valid admin role — allow through
    return NextResponse.next()
  }

  // ── All other routes: public, pass through ──
  return NextResponse.next()
})

export const config = {
  // Run middleware on all routes except:
  // - Next.js internals (_next/static, _next/image)
  // - Clerk's own routes
  // - favicon and static files
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
