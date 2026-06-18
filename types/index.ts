// types/index.ts
// Shared TypeScript interfaces for Qasberry.
// All API request/response bodies use these types — no inline types in route files.

// ─── Role & Auth ─────────────────────────────────────────────────────────────

export type UserRole = 'SUPER_ADMIN' | 'CONTENT_MANAGER' | 'MODERATOR' | 'STUDENT'

export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export type CourseDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'

// ─── API Response Shape ────────────────────────────────────────────────────────
// Every API route returns this consistent shape.

export interface ApiResponse<T = undefined> {
  success: boolean
  data?: T
  error?: string
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface UserPublic {
  id: string
  clerkId: string
  email: string
  name: string | null
  role: UserRole
  career: string | null
  isSuspended: boolean
  createdAt: Date
}

// ─── Career ───────────────────────────────────────────────────────────────────

export interface CareerPublic {
  id: string
  name: string
  slug: string
}

// ─── Course ───────────────────────────────────────────────────────────────────

export interface CoursePublic {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnail: string | null
  price: string // Decimal serialised as string from Prisma
  isFree: boolean
  status: CourseStatus
  difficulty: CourseDifficulty
  career: CareerPublic
  createdAt: Date
}

// ─── Module & Lesson ──────────────────────────────────────────────────────────

export interface LessonPublic {
  id: string
  moduleId: string
  title: string
  duration: number | null
  order: number
  isFree: boolean
  // muxPlaybackId intentionally omitted — only returned via signed token
}

export interface ModulePublic {
  id: string
  courseId: string
  title: string
  order: number
  lessons: LessonPublic[]
}

// ─── Enrollment ───────────────────────────────────────────────────────────────

export interface EnrollmentPublic {
  id: string
  userId: string
  courseId: string
  paymentRef: string | null
  createdAt: Date
}

// ─── Certificate ──────────────────────────────────────────────────────────────

export interface CertificatePublic {
  id: string
  userId: string
  courseId: string
  issuedAt: Date
  certificateUrl: string | null
}

// ─── Clerk Webhook ────────────────────────────────────────────────────────────

export interface ClerkWebhookUserCreated {
  id: string
  email_addresses: Array<{
    email_address: string
    id: string
  }>
  first_name: string | null
  last_name: string | null
  public_metadata: {
    role?: UserRole
  }
}

export interface ClerkWebhookEvent {
  type: string
  data: ClerkWebhookUserCreated
}

// ─── Bot / Roadmap ────────────────────────────────────────────────────────────

export type RoadmapSkillTag =
  | 'fundamentals'
  | 'tools'
  | 'automation'
  | 'data'
  | 'communication'
  | 'strategy'
  | 'safety'
  | 'creativity'

export interface RoadmapStep {
  order: number
  courseId?: string       // ID of the matching Qasberry course
  courseSlug?: string     // slug for linking: /courses/[slug]
  isFree?: boolean        // whether the course is free
  price?: unknown         // course price (Decimal from Prisma)
  title: string
  description: string
  skillTag: RoadmapSkillTag
}

export interface Roadmap {
  career: string
  summary: string
  steps: RoadmapStep[]
}

// ─── Bot API ──────────────────────────────────────────────────────────────────

export interface BotRoadmapRequest {
  careerInput: string
}

export interface BotRoadmapResponse extends ApiResponse<Roadmap> {}
