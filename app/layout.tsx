// app/layout.tsx — root layout, Inter only (restored)
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Qasberry — AI Learning Academy',
    template: '%s | Qasberry',
  },
  description:
    'Discover your personalised AI learning roadmap. Qasberry helps nurses, teachers, lawyers, developers and every professional master AI in their field.',
  keywords: ['AI learning', 'AI courses', 'AI education', 'career AI', 'Qasberry'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'Qasberry',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} font-sans antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
