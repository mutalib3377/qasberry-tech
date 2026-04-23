// app/api/bot/roadmap/route.ts
// AI Roadmap generator — calls OpenAI to produce a personalised learning roadmap.
// POST body: { careerInput: string }
// Returns: { success: true, data: Roadmap }
// Env: OPENAI_API_KEY

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
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
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey || apiKey === 'sk-REPLACE_ME') {
    // Return a demo roadmap if OpenAI is not configured
    const demoRoadmap: Roadmap = buildDemoRoadmap(careerInput)
    return NextResponse.json({ success: true, data: demoRoadmap })
  }

  try {
    const prompt = `
You are an expert AI curriculum designer for Qasberry, an AI learning academy.

A user has told you they work in: "${careerInput}"

Generate a concise, practical 8-step AI learning roadmap tailored specifically for someone in that field.
Focus on how AI tools and concepts apply to their specific profession.

Respond ONLY with a valid JSON object in exactly this format — no markdown, no explanation:
{
  "career": "short label for the career (max 30 chars)",
  "summary": "2 sentence summary of this roadmap (max 150 chars)",
  "steps": [
    {
      "order": 1,
      "title": "Step title (max 50 chars)",
      "description": "1–2 sentence practical description specific to this career (max 120 chars)",
      "skillTag": one of: "fundamentals" | "tools" | "automation" | "data" | "communication" | "strategy" | "safety" | "creativity"
    }
  ]
}

The steps must be in logical learning order from beginner to advanced.
`.trim()

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:       'gpt-4o-mini',
        temperature: 0.7,
        max_tokens:  1000,
        messages:    [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      console.error('OpenAI error:', response.status, await response.text())
      const demoRoadmap = buildDemoRoadmap(careerInput)
      return NextResponse.json({ success: true, data: demoRoadmap })
    }

    const completion = await response.json() as {
      choices: Array<{ message: { content: string } }>
    }
    const raw = completion.choices[0]?.message?.content?.trim() ?? ''

    const roadmap = JSON.parse(raw) as Roadmap

    // Validate and sanitise
    if (!roadmap.steps || !Array.isArray(roadmap.steps)) throw new Error('Invalid roadmap shape')

    roadmap.steps = roadmap.steps.slice(0, 8).map((step: RoadmapStep, i) => ({
      order:       i + 1,
      title:       String(step.title ?? '').slice(0, 60),
      description: String(step.description ?? '').slice(0, 150),
      skillTag:    SKILL_TAGS.includes(step.skillTag as RoadmapSkillTag)
        ? step.skillTag
        : 'fundamentals',
    }))

    return NextResponse.json({ success: true, data: roadmap })
  } catch (err) {
    console.error('/api/bot/roadmap error:', err)
    // Graceful fallback
    return NextResponse.json({ success: true, data: buildDemoRoadmap(careerInput) })
  }
}

function buildDemoRoadmap(career: string): Roadmap {
  return {
    career: career.slice(0, 30),
    summary: `A personalised 8-step pathway to integrate AI into your ${career} practice. Start with the basics and build toward full AI fluency.`,
    steps: [
      { order: 1, title: 'AI Foundations',            description: 'Understand what AI is, how it works, and why it matters in your field.',                        skillTag: 'fundamentals' },
      { order: 2, title: 'Prompt Engineering Basics', description: 'Learn to communicate effectively with AI tools using clear, structured prompts.',                skillTag: 'communication' },
      { order: 3, title: 'AI Tools for Your Role',    description: `Explore the top AI tools used by professionals in ${career} today.`,                            skillTag: 'tools' },
      { order: 4, title: 'Automating Repetitive Work',description: 'Identify tasks in your workflow that AI can automate, saving hours each week.',                  skillTag: 'automation' },
      { order: 5, title: 'Data Literacy',              description: 'Understand how to read, interpret, and apply data insights from AI outputs.',                   skillTag: 'data' },
      { order: 6, title: 'AI Ethics & Safety',         description: 'Learn the principles of responsible AI use, bias, privacy, and professional accountability.',   skillTag: 'safety' },
      { order: 7, title: 'Strategic AI Adoption',      description: 'Build a strategy to champion AI transformation within your team or organisation.',               skillTag: 'strategy' },
      { order: 8, title: 'Creative AI Applications',   description: 'Push beyond the basics — use generative AI for ideation, content, and innovation.',              skillTag: 'creativity' },
    ],
  }
}
