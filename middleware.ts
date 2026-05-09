// middleware.ts
// Next.js middleware for Qasberry — runs on every request matching the config.
// Enforces:
//   - /admin/* routes: must be signed in AND have an admin role
//   - /dashboard/* routes: must be signed in
//   - All other routes: public, pass through freely
//
// Security note: Role is read from Clerk sessionClaims.
// In Clerk v5, publicMetadata is exposed directly on sessionClaims.publicMetadata.
// A fallback also checks sessionClaims.metadata for JWT-template-based setups.
// Both paths are cryptographically signed by Clerk — safe to trust in middleware.

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

    // Read role from Clerk session claims.
    // Clerk v5: publicMetadata is available directly on sessionClaims.publicMetadata
    // Fallback: also check sessionClaims.metadata (used when a custom JWT template is configured)
    const claimsPublic = sessionClaims?.publicMetadata as { role?: UserRole } | undefined
    const claimsMeta   = sessionClaims?.metadata   as { role?: UserRole } | undefined
    const role = claimsPublic?.role ?? claimsMeta?.role

    if (!role || !ADMIN_ROLES.includes(role)) {
      // Signed in but not an admin — redirect to dashboard (student area)
      return NextResponse.redirect(new URL('/dashboard', req.url))
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
