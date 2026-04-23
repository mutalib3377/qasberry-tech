// app/(auth)/layout.tsx
// Layout for auth pages (sign-in, sign-up).
// Centered layout with Qasberry branding above the Clerk widget.

import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Top brand bar */}
      <header className="flex items-center justify-between px-8 py-6">
        <Link href="/" className="text-xl font-bold gradient-text">
          Qasberry
        </Link>
      </header>

      {/* Auth widget — centered */}
      <div className="flex-1 flex items-center justify-center pb-12">
        {children}
      </div>
    </div>
  )
}
