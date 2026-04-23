// app/community/page.tsx
// Community Gallery page — lists all available career communities.

import { db } from '@/lib/db'
import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/marketing-nav'
import { Footer } from '@/components/marketing/footer'
import { Users, MessageSquare, ArrowRight, Zap } from 'lucide-react'

export const metadata = {
  title: 'Community Hubs | Qasberry',
  description: 'Connect with peers, share knowledge, and grow together in our career-specific AI communities.',
}

export default async function CommunityGalleryPage() {
  const communities = await db.community.findMany({
    include: {
      career: true,
      _count: {
        select: { members: true, posts: true }
      }
    },
    orderBy: { career: { name: 'asc' } }
  })

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-600/5 blur-[120px] rounded-full" />
      </div>

      <MarketingNav />

      <main className="relative z-10 pt-32 pb-20 px-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-4 mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium uppercase tracking-wider">
            <Zap size={12} />
            Network & Grow
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
            Qasberry Community Hubs
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
            Join a specialized community built for your specific career path. 
            Directly connect with peers leveraging AI in your industry.
          </p>
        </div>

        {/* Community Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.map((community) => (
            <Link 
              key={community.id}
              href={`/community/${community.slug}`}
              className="group relative flex flex-col p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-violet-500/50 hover:bg-white/[0.05] transition-all duration-300"
            >
              {/* Subtle hover background highlight */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600/0 via-transparent to-cyan-500/0 group-hover:from-violet-600/10 group-hover:to-cyan-500/5 rounded-2xl transition-all duration-500" />
              
              <div className="relative z-10 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400 opacity-80">
                      {community.career.name}
                    </span>
                    <h3 className="text-xl font-bold group-hover:text-white transition-colors">
                      {community.name}
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-violet-600/20 group-hover:text-violet-400 transition-colors">
                    <ArrowRight size={18} className="rotate-[-45deg] group-hover:rotate-0 transition-transform" />
                  </div>
                </div>

                <p className="text-sm text-slate-400 line-clamp-2 min-h-[40px]">
                  {community.description || `Connect with ${community.career.name.toLowerCase()} experts and enthusiasts in this dedicated hub.`}
                </p>

                <div className="pt-4 flex items-center gap-4 text-xs font-medium text-slate-500">
                  <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5">
                    <Users size={12} className="text-slate-400" />
                    {community._count.members} Members
                  </span>
                  <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5">
                    <MessageSquare size={12} className="text-slate-400" />
                    {community._count.posts} Posts
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  )
}
