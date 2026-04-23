/**
 * scripts/sync-admin-user.ts
 * One-shot script: fetches your Clerk user and creates/updates
 * the matching DB User record with role SUPER_ADMIN.
 *
 * Run with:
 *   npx ts-node -e "$(cat scripts/sync-admin-user.ts)"   — OR —
 *   npx tsx scripts/sync-admin-user.ts
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  const clerkSecretKey = process.env.CLERK_SECRET_KEY
  if (!clerkSecretKey) {
    throw new Error('CLERK_SECRET_KEY is not set in .env.local')
  }

  // ── 1. Fetch users from Clerk Management API ──────────────────────────────
  console.log('📡 Fetching users from Clerk...')
  const res = await fetch('https://api.clerk.com/v1/users?limit=10', {
    headers: {
      Authorization: `Bearer ${clerkSecretKey}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    throw new Error(`Clerk API error: ${res.status} ${await res.text()}`)
  }

  const users = (await res.json()) as Array<{
    id: string
    first_name: string | null
    last_name: string | null
    email_addresses: Array<{ email_address: string; id: string }>
    primary_email_address_id: string | null
    public_metadata: Record<string, unknown>
  }>

  if (users.length === 0) {
    console.log('⚠️  No users found in Clerk.')
    return
  }

  console.log(`Found ${users.length} Clerk user(s):\n`)

  for (const clerkUser of users) {
    const primaryEmail =
      clerkUser.email_addresses.find(
        (e) => e.id === clerkUser.primary_email_address_id
      )?.email_address ?? clerkUser.email_addresses[0]?.email_address

    if (!primaryEmail) {
      console.warn(`  ⚠️  Skipping ${clerkUser.id} — no email address`)
      continue
    }

    const name = [clerkUser.first_name, clerkUser.last_name]
      .filter(Boolean)
      .join(' ')
      .trim() || null

    console.log(`  👤 ${clerkUser.id} | ${primaryEmail} | ${name ?? 'No name'}`)

    // ── 2. Upsert into Postgres ───────────────────────────────────────────────
    const dbUser = await db.user.upsert({
      where:  { clerkId: clerkUser.id },
      update: { email: primaryEmail, name, role: 'SUPER_ADMIN' },
      create: {
        clerkId: clerkUser.id,
        email:   primaryEmail,
        name,
        role:    'SUPER_ADMIN',
      },
    })

    console.log(`  ✅ DB User upserted: ${dbUser.id} (role: ${dbUser.role})\n`)
  }

  console.log('Done! All users synced to DB as SUPER_ADMIN.')
  console.log('\nNow go to Clerk Dashboard → Users → your user → Public Metadata:')
  console.log('  { "role": "SUPER_ADMIN" }')
  console.log('Then sign out and sign back in at localhost:3008.')
}

main()
  .catch((err) => {
    console.error('❌ Error:', err)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
