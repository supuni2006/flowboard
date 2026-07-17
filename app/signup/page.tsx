'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Signup is merged into the login page - the same form creates the
// account automatically on first use. Keep this route around so any
// old links to /signup still land somewhere sensible.
export default function SignupPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/login')
  }, [router])

  return null
}