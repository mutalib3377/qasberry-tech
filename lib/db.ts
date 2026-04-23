// lib/db.ts
// Prisma Client singleton — safe for Next.js hot reload in development.
//
// Without this globalThis singleton pattern, every hot reload creates a new
// PrismaClient instance, exhausting the database connection pool.
//
// Prisma v5 reads DATABASE_URL automatically from the environment via
// the env() call in schema.prisma datasource block.
//
// Env var: DATABASE_URL (PostgreSQL connection string)

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })

// In development, store on globalThis so hot reloads reuse the same client
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
