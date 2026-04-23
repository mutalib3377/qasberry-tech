// prisma/seed.ts
// Seeds the Career table with 8 career slugs
// Run: npx prisma db seed
// This file is referenced in package.json under "prisma.seed"

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const careers = [
  { name: 'Nurse', slug: 'nurse' },
  { name: 'Teacher', slug: 'teacher' },
  { name: 'Developer', slug: 'developer' },
  { name: 'Lawyer', slug: 'lawyer' },
  { name: 'Marketer', slug: 'marketer' },
  { name: 'Student', slug: 'student' },
  { name: 'Entrepreneur', slug: 'entrepreneur' },
  { name: 'Kid', slug: 'kid' },
]

async function main() {
  console.log('🌱 Seeding careers...')

  for (const career of careers) {
    await prisma.career.upsert({
      where: { slug: career.slug },
      update: { name: career.name },
      create: { name: career.name, slug: career.slug },
    })
    console.log(`  ✓ ${career.name} (${career.slug})`)
  }

  console.log('✅ Seed complete.')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
