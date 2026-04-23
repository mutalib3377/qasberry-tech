// app/(auth)/sign-in/[[...sign-in]]/page.tsx
// Clerk sign-in page using the catch-all route pattern required by Clerk.
// Env vars: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

import { SignIn } from '@clerk/nextjs'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your Qasberry account.',
}

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <SignIn
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
