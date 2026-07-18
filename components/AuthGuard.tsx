'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [loading, user, router])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2.5 text-mutedDark text-sm">
          <span className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-accent animate-spin" />
          Loading…
        </div>
      </div>
    )
  }

  return <>{children}</>
}