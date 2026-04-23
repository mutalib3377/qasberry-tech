// app/learn/[courseId]/page.tsx
// Redirect /learn/[courseId] → first lesson in the course.
// Server component — no UI, just a smart redirect.

import { db }          from '@/lib/db'
import { currentUser } from '@clerk/nextjs/server'
import { redirect }    from 'next/navigation'

interface Props { params: { courseId: string } }

export default async function LearnRedirectPage({ params }: Props) {
  const user = await currentUser()
  if (!user) redirect('/sign-in')

  const course = await db.course.findUnique({
    where:   { id: params.courseId },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: { lessons: { orderBy: { order: 'asc' }, take: 1 } },
        take: 1,
      },
    },
  })

  if (!course) redirect('/dashboard')

  const firstLesson = course.modules[0]?.lessons[0]
  if (!firstLesson) redirect('/dashboard')

  redirect(`/learn/${params.courseId}/${firstLesson.id}`)
}
