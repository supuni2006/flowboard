'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
  const { user, loading, signInOrSignUp, signInWithGoogle } = useAuth()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [googleSubmitting, setGoogleSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) router.replace('/')
  }, [loading, user, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setSubmitting(true)
    const { error } = await signInOrSignUp(email, password)
    setSubmitting(false)

    if (error) {
      setError(error)
      return
    }
    router.replace('/')
  }

  async function handleGoogle() {
    setError(null)
    setGoogleSubmitting(true)
    const { error } = await signInWithGoogle()
    if (error) {
      setError(error)
      setGoogleSubmitting(false)
    }
    // On success the browser redirects away to Google, so no further
    // state update is needed here.
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-canvas px-4 sm:px-6 py-10">
      <div className="w-full max-w-sm sm:max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">FlowBoard</h1>
          <p className="text-gray-400 mt-2 text-sm sm:text-base">
            Sign in with your company email
          </p>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 sm:p-8 shadow-lg space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/40 text-red-300 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-100 disabled:opacity-50 text-gray-800 font-medium py-3 rounded-lg transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.09-1.8 2.73v2.27h2.92c1.71-1.57 2.68-3.88 2.68-6.64z" />
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.17l-2.92-2.27c-.81.54-1.85.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.34C2.44 15.98 5.48 18 9 18z" />
              <path fill="#FBBC05" d="M3.97 10.71A5.4 5.4 0 0 1 3.68 9c0-.59.1-1.17.29-1.71V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.34z" />
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.95l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58z" />
            </svg>
            {googleSubmitting ? 'Redirecting…' : 'Continue with Google'}
          </button>

          <div className="flex items-center gap-3 text-gray-500 text-xs">
            <div className="h-px flex-1 bg-gray-700" />
            or
            <div className="h-px flex-1 bg-gray-700" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Email</label>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full p-3 rounded-lg bg-gray-800 text-white text-base outline-none ring-1 ring-transparent focus:ring-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full p-3 rounded-lg bg-gray-800 text-white text-base outline-none ring-1 ring-transparent focus:ring-blue-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors"
            >
              {submitting ? 'Continuing…' : 'Continue'}
            </button>

            <p className="text-center text-xs text-gray-500 pt-1">
              New here? Just enter an email and password above — your account
              is created automatically. Coworkers who sign in with the same
              email/password see the same boards; other companies never do.
            </p>
          </form>
        </div>
      </div>
    </main>
  )
}