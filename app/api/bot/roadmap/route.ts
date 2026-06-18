// app/api/bot/roadmap/route.ts
// AI Roadmap generator — builds a personalised roadmap matched to real Qasberry courses.
// POST body: { careerInput: string }
// Returns: { success: true, data: Roadmap }
//
// Strategy:
//   1. Fetch all published courses from DB (with career + skillTag metadata)
//   2. Send the course list + career input to OpenAI so the AI maps real courses
//      to a logical learning order.
//   3. Each step includes a courseId + courseSlug so the UI can link directly.
//   4. Falls back to a demo roadmap (with real courses) if OpenAI is not set up.

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import type { ApiResponse, Roadmap, RoadmapStep, RoadmapSkillTag } from '@/types'
import { z } from 'zod'

const BodySchema = z.object({
  careerInput: z.string().min(2).max(200),
})

const SKILL_TAGS: RoadmapSkillTag[] = [
  'fundamentals', 'tools', 'automation', 'data',
  'communication', 'strategy', 'safety', 'creativity',
]

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = BodySchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' },
      { status: 400 }
    )
  }

  const { careerInput } = parsed.data

  // ── Step 1: Fetch all published courses from DB ──────────────────────────────
  const courses = await db.course.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      difficulty: true,
      isFree: true,
      price: true,
      career: { select: { name: true } },
    },
  })

  // If no courses exist, return a helpful message
  if (courses.length === 0) {
    return NextResponse.json({
      success: true,
      data: {
        career: careerInput.slice(0, 30),
        summary: 'No courses are available yet. Check back soon as we add new content!',
        steps: [],
      } as Roadmap,
    })
  }

  // ── Step 2: Build a readable course catalogue for the AI prompt ──────────────
  const courseCatalogue = courses.map((c, i) =>
    `[${i + 1}] ID: ${c.id} | Title: "${c.title}" | Career: ${c.career.name} | Level: ${c.difficulty}${c.description ? ` | About: ${c.description.slice(0, 80)}` : ''}`
  ).join('\n')

  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey || apiKey === 'sk-REPLACE_ME') {
    // Fallback: build a simple roadmap from available courses without AI
    return NextResponse.json({ success: true, data: buildFallbackRoadmap(careerInput, courses) })
  }

  // ── Step 3: Call OpenAI with the real course catalogue ───────────────────────
  try {
    const prompt = `
You are an expert AI curriculum designer for Qasberry, an AI learning platform for working professionals.

A user works in: "${careerInput}"

Below is the COMPLETE list of available Qasberry courses. You MUST only use courses from this list.
Do NOT invent, hallucinate, or reference any course not in this list.

AVAILABLE COURSES:
${courseCatalogue}

Task: Select the most relevant courses from the list above and arrange them into a logical learning roadmap for someone in "${careerInput}". 
- Choose between 4 and ${Math.min(8, courses.length)} courses.
- Order them from beginner to advanced.
- Each step must reference a real course from the list using its exact ID.
- If fewer than 4 courses are relevant, include all of them.

Respond ONLY with a valid JSON object in exactly this format — no markdown, no explanation:
{
  "career": "short label for the career (max 30 chars)",
  "summary": "2 sentence summary of this roadmap (max 180 chars)",
  "steps": [
    {
      "order": 1,
      "courseId": "exact course ID from the list above",
      "title": "use the exact course title",
      "description": "1–2 sentence explanation of why this course is relevant to ${careerInput} (max 130 chars)",
      "skillTag": one of: "fundamentals" | "tools" | "automation" | "data" | "communication" | "strategy" | "safety" | "creativity"
    }
  ]
}
`.trim()

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:       'gpt-4o-mini',
        temperature: 0.4,
        max_tokens:  1200,
        messages:    [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      console.error('OpenAI error:', response.status, await response.text())
      return NextResponse.json({ success: true, data: buildFallbackRoadmap(careerInput, courses) })
    }

    const completion = await response.json() as {
      choices: Array<{ message: { content: string } }>
    }
    const raw = completion.choices[0]?.message?.content?.trim() ?? ''

    const roadmap = JSON.parse(raw) as Roadmap

    // Validate shape
    if (!roadmap.steps || !Array.isArray(roadmap.steps)) throw new Error('Invalid roadmap shape')

    // Sanitise + enrich each step with the course slug for linking
    const courseMap = new Map(courses.map((c) => [c.id, c]))

    roadmap.steps = roadmap.steps
      .filter((step: RoadmapStep) => courseMap.has(step.courseId ?? ''))
      .slice(0, 8)
      .map((step: RoadmapStep, i) => {
        const course = courseMap.get(step.courseId ?? '')!
        return {
          order:       i + 1,
          courseId:    course.id,
          courseSlug:  course.slug,
          title:       String(step.title ?? course.title).slice(0, 80),
          description: String(step.description ?? '').slice(0, 150),
          skillTag:    SKILL_TAGS.includes(step.skillTag as RoadmapSkillTag)
            ? step.skillTag
            : 'fundamentals',
          isFree:  course.isFree,
          price:   course.price,
        }
      })

    return NextResponse.json({ success: true, data: roadmap })
  } catch (err) {
    console.error('/api/bot/roadmap error:', err)
    return NextResponse.json({ success: true, data: buildFallbackRoadmap(careerInput, courses) })
  }
}

// ── Fallback: career-aware roadmap without AI ─────────────────────────────────
// Scores each course by how relevant its career name is to the user's input,
// then returns only the relevant ones ordered by difficulty.

type CourseRow = {
  id: string; slug: string; title: string; description: string | null
  difficulty: string; isFree: boolean; price: unknown
  career: { name: string }
}

const DIFFICULTY_ORDER: Record<string, number> = { BEGINNER: 0, INTERMEDIATE: 1, ADVANCED: 2 }
const DIFFICULTY_TAG: Record<string, RoadmapSkillTag> = {
  BEGINNER: 'fundamentals', INTERMEDIATE: 'tools', ADVANCED: 'strategy',
}

/**
 * Simple keyword relevance scorer.
 * Splits both strings into words and counts how many words from `query`
 * appear anywhere in `target` (case-insensitive).
 */
function relevanceScore(query: string, target: string): number {
  const qWords = query.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(Boolean)
  const tLower = target.toLowerCase()
  let score = 0
  for (const word of qWords) {
    if (tLower.includes(word)) score += 1
  }
  // Bonus: exact substring match of the full query
  if (tLower.includes(query.toLowerCase())) score += 3
  return score
}

function buildFallbackRoadmap(careerInput: string, courses: CourseRow[]): Roadmap {
  // Score each course by how well its career name matches the input
  const scored = courses.map((c) => ({
    course: c,
    score: relevanceScore(careerInput, c.career.name),
  }))

  // Filter to only courses with at least some relevance
  const relevant = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => {
      // Primary: relevance score (desc)
      if (b.score !== a.score) return b.score - a.score
      // Secondary: difficulty order (asc — beginner first)
      return (DIFFICULTY_ORDER[a.course.difficulty] ?? 1) - (DIFFICULTY_ORDER[b.course.difficulty] ?? 1)
    })
    .map((s) => s.course)
    .slice(0, 8)

  // No relevant courses found
  if (relevant.length === 0) {
    return {
      career: careerInput.slice(0, 30),
      summary: `We don't have courses specifically for ${careerInput} yet, but new content is added regularly. Check back soon!`,
      steps: [],
    }
  }

  // Sort the relevant courses beginner → advanced for a logical learning order
  const ordered = [...relevant].sort(
    (a, b) => (DIFFICULTY_ORDER[a.difficulty] ?? 1) - (DIFFICULTY_ORDER[b.difficulty] ?? 1)
  )

  return {
    career: careerInput.slice(0, 30),
    summary: `A ${ordered.length}-course pathway tailored for ${careerInput} professionals — from foundational AI skills to advanced practice.`,
    steps: ordered.map((c, i) => ({
      order:       i + 1,
      courseId:    c.id,
      courseSlug:  c.slug,
      title:       c.title,
      description: c.description?.slice(0, 130) ?? `Apply AI skills directly in your ${careerInput} practice.`,
      skillTag:    DIFFICULTY_TAG[c.difficulty] ?? 'fundamentals',
      isFree:      c.isFree,
      price:       c.price,
    })),
  }
}
