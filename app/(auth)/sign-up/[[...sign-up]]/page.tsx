// app/(auth)/sign-up/[[...sign-up]]/page.tsx
// Clerk sign-up page using the catch-all route pattern required by Clerk.
// New users who sign up will have their Postgres User record created
// automatically via the Clerk webhook at /api/webhooks/clerk.
// Env vars: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

import { SignUp } from '@clerk/nextjs'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create your Qasberry account and start learning AI today.',
}

export default function SignUpPage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <SignUp
        appearance={{
          variables: {
            colorPrimary: '#7c3aed',
            colorBackground: '#13131a',
            colorText: '#f0f0f5',
            colorInputBackground: '#1e1e2e',
            colorInputText: '#f0f0f5',
            borderRadius: '0.75rem',
            fontFamily: 'var(--font-inter)',
          },
        }}
      />
    </main>
  )
}
