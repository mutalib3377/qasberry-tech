// app/api/admin/courses/route.ts
// Admin API: List all courses (GET) and create a new course (POST).
//
// Security:
//   - Every request verifies auth and role server-side
//   - Input validated with zod before touching the database
//   - Raw Prisma errors are never leaked to the client
//
// Env vars: DATABASE_URL, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY

import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { generateSlug, generateUniqueSlug } from '@/lib/slugify'
import type { UserRole, ApiResponse, CoursePublic } from '@/types'

// Roles that can manage courses
const COURSE_MANAGER_ROLES: UserRole[] = ['SUPER_ADMIN', 'CONTENT_MANAGER']

// ─── Input validation schema ───────────────────────────────────────────────────

const createCourseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(120),
  description: z.string().max(2000).optional(),
  careerId: z.string().min(1, 'Please select a career'),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).default('BEGINNER'),
  price: z.coerce.number().min(0).default(0),
  isFree: z.boolean().default(false),
  thumbnail: z.string().url().optional().nullable(),
})

// ─── GET /api/admin/courses ────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  // Step 1: Verify auth
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // Step 2: Verify role — read directly from Clerk publicMetadata
  const clerk = await clerkClient()
  const clerkUser = await clerk.users.getUser(userId)
  const role = (clerkUser.publicMetadata as { role?: UserRole })?.role
  if (!role || !(['SUPER_ADMIN', 'CONTENT_MANAGER', 'MODERATOR'] as UserRole[]).includes(role)) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Forbidden' },
      { status: 403 }
    )
  }

  // Step 3: Parse query params for pagination
  const { searchParams } = req.nextUrl
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '20'))
  const skip = (page - 1) * limit
  const search = searchParams.get('search') ?? ''

  try {
    const where = {
      status: { not: 'ARCHIVED' as const },
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' as const } },
              { career: { name: { contains: search, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
    }

    const [courses, total] = await Promise.all([
      db.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          career: { select: { id: true, name: true, slug: true } },
          _count: { select: { enrollments: true } },
        },
      }),
      db.course.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        courses,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
    })
  } catch (err) {
    console.error('GET /api/admin/courses error:', err)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}

// ─── POST /api/admin/courses ───────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Step 1: Verify auth
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // Step 2: Verify role — read directly from Clerk publicMetadata
  const clerk = await clerkClient()
  const clerkUser = await clerk.users.getUser(userId)
  const role = (clerkUser.publicMetadata as { role?: UserRole })?.role
  if (!role || !COURSE_MANAGER_ROLES.includes(role)) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Forbidden — only Content Managers and Super Admins can create courses' },
      { status: 403 }
    )
  }

  // Step 3: Parse and validate input
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const parsed = createCourseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' },
      { status: 400 }
    )
  }

  const { title, description, careerId, difficulty, price, isFree, thumbnail } = parsed.data

  // Step 4: Generate a unique slug
  let slug = generateSlug(title)
  const existing = await db.course.findUnique({ where: { slug } })
  if (existing) {
    slug = generateUniqueSlug(title)
  }

  try {
    const course = await db.course.create({
      data: {
        title,
        slug,
        description: description ?? null,
        careerId,
        difficulty,
        price,
        isFree,
        thumbnail: thumbnail ?? null,
        status: 'DRAFT',
      },
      include: {
        career: { select: { id: true, name: true, slug: true } },
      },
    })

    return NextResponse.json({ success: true, data: course }, { status: 201 })
  } catch (err) {
    console.error('POST /api/admin/courses error:', err)
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to create course' },
      { status: 500 }
    )
  }
}
