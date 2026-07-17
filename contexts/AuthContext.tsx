'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
  // Tries to log in with this email/password. If no account exists yet,
  // it creates one automatically (no confirmation email) and logs in.
  // `company` is only used the first time (account creation) - it decides
  // which set of boards this person will see/share.
  signInOrSignUp: (
    email: string,
    password: string,
    company: string
  ) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signInOrSignUp(email: string, password: string, company: string) {
    const trimmedEmail = email.trim().toLowerCase()
    const trimmedCompany = company.trim()

    // 1. Try to log in first (covers the common case: returning user).
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    })

    if (!signInError) {
      return { error: null }
    }

    // If the password was wrong for an existing account, don't silently
    // create a new one - surface the real error.
    if (!signInError.message.toLowerCase().includes('invalid login credentials')) {
      return { error: signInError.message }
    }

    // 2. No matching account (or first time this email is used) -> sign up.
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: {
          full_name: trimmedEmail.split('@')[0],
          company: trimmedCompany,
        },
      },
    })

    if (signUpError) {
      // If it turns out the account DID exist (bad password), say so clearly.
      if (signUpError.message.toLowerCase().includes('already registered')) {
        return { error: 'Incorrect password.' }
      }
      return { error: signUpError.message }
    }

    // If email confirmations are disabled in Supabase, signUp already
    // returns an active session and we're done.
    if (signUpData.session) {
      return { error: null }
    }

    // Otherwise, try logging in right away (works once "Confirm email" is
    // turned off in Supabase Auth settings).
    const { error: secondSignInError } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    })

    if (secondSignInError) {
      return {
        error:
          'Account created, but email confirmation is still required. Turn off "Confirm email" in Supabase (Authentication > Sign In / Providers > Email) to allow instant login.',
      }
    }

    return { error: null }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signInOrSignUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}