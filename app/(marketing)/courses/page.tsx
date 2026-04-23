// app/(marketing)/courses/page.tsx
// Public course catalog — filterable grid of published courses.
// Server component: reads from DB, no auth required.

import { db }          from '@/lib/db'
import Link            from 'next/link'
import type { Metadata } from 'next'
import { BookOpen, Users, Star, Zap } from 'lucide-react'
import { MarketingNav } from '@/components/marketing/marketing-nav'
import { Footer }       from '@/components/marketing/footer'

export const metadata: Metadata = {
  title: 'Courses | Qasberry',
  description: 'Browse Qasberry\'s AI courses tailored for your career. Filter by career track, difficulty, or price.',
}

interface PageProps {
  searchParams: { career?: string; difficulty?: string; q?: string }
}

const DIFFICULTY_COLORS: Record<string, string> = {
  BEGINNER:     'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  INTERMEDIATE: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  ADVANCED:     'bg-rose-500/15 text-rose-400 border-rose-500/20',
}

export default async function CourseCatalogPage({ searchParams }: PageProps) {
  const { career: careerSlug, difficulty, q } = searchParams

  const careers = await db.career.findMany({ orderBy: { name: 'asc' } })

  const selectedCareer = careerSlug
    ? careers.find((c) => c.slug === careerSlug)
    : null

  const courses = await db.course.findMany({
    where: {
      status: 'PUBLISHED',
      ...(selectedCareer ? { careerId: selectedCareer.id } : {}),
      ...(difficulty ? { difficulty: difficulty as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' } : {}),
      ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}),
    },
    include: {
      career:      true,
      _count:      { select: { enrollments: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-violet-600/6 blur-[120px]" />
      </div>

      <MarketingNav />

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-16 space-y-10">
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium">
            <BookOpen size={12} />
            Course Catalog
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">Browse Courses</h1>
          <p className="text-slate-400">AI courses tailored to your profession.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <form method="GET" className="flex-1 min-w-[200px] max-w-sm">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search courses…"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </form>

          {/* Career filter */}
          <div className="flex flex-wrap gap-2">
            <Link
              href="/courses"
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                !careerSlug ? 'border-violet-500/50 bg-violet-500/15 text-violet-300' : 'border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
              }`}
            >
              All Careers
            </Link>
            {careers.map((c) => (
              <Link
                key={c.id}
                href={`/courses?career=${c.slug}${difficulty ? `&difficulty=${difficulty}` : ''}`}
                className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                  careerSlug === c.slug ? 'border-violet-500/50 bg-violet-500/15 text-violet-300' : 'border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>

          {/* Difficulty filter */}
          <div className="flex gap-2">
            {(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const).map((d) => (
              <Link
                key={d}
                href={`/courses?${careerSlug ? `career=${careerSlug}&` : ''}difficulty=${d}`}
                className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                  difficulty === d ? 'border-violet-500/50 bg-violet-500/15 text-violet-300' : 'border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                }`}
              >
                {d[0] + d.slice(1).toLowerCase()}
              </Link>
            ))}
          </div>
        </div>

        {/* Results count */}
        <p className="text-slate-500 text-sm">{courses.length} course{courses.length !== 1 ? 's' : ''} found</p>

        {/* Grid */}
        {courses.length === 0 ? (
          <div className="py-24 text-center space-y-3">
            <BookOpen size={40} className="mx-auto text-slate-700" />
            <p className="text-slate-400">No courses match your filters.</p>
            <Link href="/courses" className="text-violet-400 hover:text-violet-300 text-sm transition-colors">
              Clear filters
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.slug}`}
                className="group flex flex-col rounded-2xl border border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70 overflow-hidden transition-all"
              >
                {/* Thumbnail */}
                <div className="relative h-40 bg-gradient-to-br from-violet-900/30 to-slate-800 overflow-hidden">
                  {course.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Zap size={32} className="text-violet-500/30" />
                    </div>
                  )}
                  {/* Price badge */}
                  <div className="absolute top-3 right-3">
                    {course.isFree ? (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-600/90 text-white text-xs font-bold backdrop-blur-sm">
                        FREE
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-700 text-white text-xs font-bold backdrop-blur-sm">
                        ₦{Number(course.price).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 p-5 gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20 text-[10px] font-medium">
                      {course.career.name}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-medium ${DIFFICULTY_COLORS[course.difficulty] ?? ''}`}>
                      {course.difficulty[0] + course.difficulty.slice(1).toLowerCase()}
                    </span>
                  </div>

                  <h2 className="text-white font-semibold text-base leading-snug group-hover:text-violet-300 transition-colors line-clamp-2">
                    {course.title}
                  </h2>

                  {course.description && (
                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-2">{course.description}</p>
                  )}

                  <div className="mt-auto flex items-center gap-3 pt-3 border-t border-slate-800 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Users size={11} />
                      {course._count.enrollments} enrolled
                    </span>
                    <span className="flex items-center gap-1">
                      <Star size={11} />
                      {course.difficulty[0] + course.difficulty.slice(1).toLowerCase()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
