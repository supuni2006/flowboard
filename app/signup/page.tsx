'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function SignupPage() {
  const { user, loading, signUp } = useAuth()
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

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
    const { error } = await signUp(email, password, name)
    setSubmitting(false)

    if (error) {
      setError(error)
      return
    }
    setSuccess(true)
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-canvas px-4 sm:px-6 py-10">
        <div className="w-full max-w-sm sm:max-w-md bg-gray-900 rounded-xl p-6 sm:p-8 shadow-lg text-center">
          <h1 className="text-2xl font-bold text-white mb-3">Check your email</h1>
          <p className="text-gray-400 text-sm sm:text-base mb-6">
            We sent a confirmation link to <span className="text-white">{email}</span>. Click it to
            activate your account, then log in.
          </p>
          <Link
            href="/login"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-canvas px-4 sm:px-6 py-10">
      <div className="w-full max-w-sm sm:max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">FlowBoard</h1>
          <p className="text-gray-400 mt-2 text-sm sm:text-base">Create your workspace account</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-gray-900 rounded-xl p-6 sm:p-8 shadow-lg space-y-4"
        >
          {error && (
            <div className="bg-red-500/10 border border-red-500/40 text-red-300 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Full name</label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              className="w-full p-3 rounded-lg bg-gray-800 text-white text-base outline-none ring-1 ring-transparent focus:ring-blue-500 transition"
            />
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
            {submitting ? 'Creating account…' : 'Sign Up'}
          </button>

          <p className="text-center text-sm text-gray-400 pt-2">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </main>
  )
}