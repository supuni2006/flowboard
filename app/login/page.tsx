'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
  const { user, loading, signInOrSignUp } = useAuth()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [company, setCompany] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

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

    if (!company.trim()) {
      setError('Company name is required.')
      return
    }

    setSubmitting(true)
    const { error } = await signInOrSignUp(email, password, company)
    setSubmitting(false)

    if (error) {
      setError(error)
      return
    }
    router.replace('/')
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-canvas px-4 sm:px-6 py-10">
      <div className="w-full max-w-sm sm:max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">FlowBoard</h1>
          <p className="text-gray-400 mt-2 text-sm sm:text-base">Sign in to your workspace</p>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 sm:p-8 shadow-lg space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/40 text-red-300 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Company name</label>
              <input
                type="text"
                required
                autoFocus
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Inc"
                className="w-full p-3 rounded-lg bg-gray-800 text-white text-base outline-none ring-1 ring-transparent focus:ring-blue-500 transition"
              />
              <p className="text-xs text-gray-500 mt-1">
                Everyone who signs in with this exact company name shares the
                same boards. Existing accounts ignore this field.
              </p>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
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
              New here? Just fill in the fields above — your account is
              created automatically.
            </p>
          </form>
        </div>
      </div>
    </main>
  )
}