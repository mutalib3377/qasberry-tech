'use client'
// components/course/enroll-button.tsx
// Client component: handles free enrollment (direct) or paid (Paystack).

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowRight } from 'lucide-react'

interface Props {
  courseId: string
  price:    number
  isFree:   boolean
}

export function EnrollButton({ courseId, price, isFree }: Props) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const router = useRouter()

  async function handleEnroll() {
    setLoading(true)
    setError(null)

    try {
      if (isFree) {
        // Free — enroll directly via API
        const res  = await fetch('/api/payments/enroll-free', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ courseId }),
        })
        const data = await res.json() as { success: boolean; error?: string }
        if (data.success) {
          router.push(`/learn/${courseId}`)
        } else {
          setError(data.error ?? 'Enrollment failed. Please try again.')
        }
      } else {
        // Paid — redirect to Paystack
        const res  = await fetch('/api/payments/initiate', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ courseId }),
        })
        const data = await res.json() as { success: boolean; url?: string; error?: string }
        if (data.success && data.url) {
          window.location.href = data.url
        } else {
          setError(data.error ?? 'Payment initiation failed. Please try again.')
        }
      }
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        id="enroll-btn"
        onClick={handleEnroll}
        disabled={loading}
        className="flex items-center justify-center gap-2 w-full py-3.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors"
      >
        {loading
          ? <><Loader2 size={16} className="animate-spin" /> Processing…</>
          : <>{isFree ? 'Enroll for Free' : `Enrol — ₦${price.toLocaleString()}`} <ArrowRight size={15} /></>
        }
      </button>
      {error && (
        <p className="text-rose-400 text-xs text-center">{error}</p>
      )}
    </div>
  )
}
