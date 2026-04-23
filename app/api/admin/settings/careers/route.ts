// app/api/admin/settings/careers/route.ts
// Admin API: Create, rename, and delete career tracks.
// SUPER_ADMIN only.

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { isSuperAdmin } from '@/lib/auth'
import type { UserRole, ApiResponse } from '@/types'
import { z } from 'zod'
import { generateSlug } from '@/lib/slugify'

async function checkSuperAdmin(): Promise<boolean> {
  const { userId, sessionClaims } = await auth()
  if (!userId) return false
  const role = (sessionClaims?.metadata as { role?: UserRole } | undefined)?.role
  return !!role && isSuperAdmin(role)
}

// ── GET /api/admin/settings/careers ──────────────────────────────────────────
export async function GET(): Promise<NextResponse> {
  if (!(await checkSuperAdmin())) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Forbidden' }, { status: 403 })
  }
  const careers = await db.career.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { courses: true, communities: true } } },
  })
  return NextResponse.json({ success: true, data: careers })
}

// ── POST /api/admin/settings/careers ─────────────────────────────────────────
const CreateSchema = z.object({
  name: z.string().min(2).max(80),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!(await checkSuperAdmin())) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  const parsed = CreateSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' },
      { status: 400 }
    )
  }

  const slug = generateSlug(parsed.data.name)

  try {
    const career = await db.career.create({
      data: { name: parsed.data.name, slug },
    })
    return NextResponse.json({ success: true, data: career }, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('Unique constraint')) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'A career with that name already exists.' },
        { status: 409 }
      )
    }
    console.error('POST /api/admin/settings/careers error:', err)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to create career' }, { status: 500 })
  }
}

// ── PATCH /api/admin/settings/careers ────────────────────────────────────────
const UpdateSchema = z.object({
  id:   z.string().min(1),
  name: z.string().min(2).max(80),
})

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  if (!(await checkSuperAdmin())) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  const parsed = UpdateSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' },
      { status: 400 }
    )
  }

  const slug = generateSlug(parsed.data.name)

  try {
    const career = await db.career.update({
      where: { id: parsed.data.id },
      data:  { name: parsed.data.name, slug },
    })
    return NextResponse.json({ success: true, data: career })
  } catch (err) {
    console.error('PATCH /api/admin/settings/careers error:', err)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to update career' }, { status: 500 })
  }
}

// ── DELETE /api/admin/settings/careers ───────────────────────────────────────
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  if (!(await checkSuperAdmin())) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'id required' }, { status: 400 })
  }

  // Prevent deletion if courses are linked
  const courseCount = await db.course.count({ where: { careerId: id } })
  if (courseCount > 0) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: `Cannot delete — ${courseCount} course(s) use this career.` },
      { status: 409 }
    )
  }

  try {
    await db.career.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/admin/settings/careers error:', err)
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to delete career' }, { status: 500 })
  }
}
