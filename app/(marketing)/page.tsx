// app/(marketing)/page.tsx
// Qasberry public homepage — full Phase 3 design.
// Server component: fetches careers from DB for the careers grid.

import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { HeroSection } from '@/components/marketing/hero-section'
import { FeaturesSection } from '@/components/marketing/features-section'
import { CareersSection } from '@/components/marketing/careers-section'
import { HowItWorks } from '@/components/marketing/how-it-works'
import { CtaBanner } from '@/components/marketing/cta-banner'
import { MarketingNav } from '@/components/marketing/marketing-nav'
import { Footer } from '@/components/marketing/footer'

export const metadata: Metadata = {
  title: 'Qasberry — AI Learning Academy',
  description:
    'Tell Qasberry who you are. Get your personalised AI learning roadmap and master AI in your field — whether you\'re a nurse, lawyer, teacher, or engineer.',
}

export default async function HomePage() {
  const careers = await db.career.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { courses: true } },
    },
  })

  const publishedCourseCount = await db.course.count({ where: { status: 'PUBLISHED' } })

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      <MarketingNav />
      <HeroSection />
      <FeaturesSection />
      <CareersSection careers={careers.map((c) => ({
        id:          c.id,
        name:        c.name,
        slug:        c.slug,
        courseCount: c._count.courses,
      }))} />
      <HowItWorks />
      <CtaBanner courseCount={publishedCourseCount} />
      <Footer />
    </div>
  )
}
