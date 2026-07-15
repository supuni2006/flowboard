'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Board } from '@/types'

const PALETTE = ['#3D7BFF', '#FFB020', '#2BB673', '#E5484D', '#8B5CF6', '#0EA5E9']

export default function DashboardPage() {
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchBoards()
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setCreating(false)
    }
    if (creating) window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [creating])

  async function fetchBoards() {
    setLoading(true)
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setBoards(data as Board[])
    setLoading(false)
  }

  async function createBoard(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || submitting) return
    setSubmitting(true)
    const color = PALETTE[boards.length % PALETTE.length]
    const { data, error } = await supabase
      .from('boards')
      .insert({ title: title.trim(), color })
      .select()
      .single()
    if (!error && data) {
      setBoards([data as Board, ...boards])
      setTitle('')
      setCreating(false)
    }
    setSubmitting(false)
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-14">
      <header className="mb-10 flex items-end justify-between">
        <div>
          <p className="text-accent text-xs font-semibold tracking-[0.2em] uppercase mb-2">
            Workspace
          </p>
          <h1 className="font-display text-3xl font-semibold text-white">
            Your boards
          </h1>
          {!loading && boards.length > 0 && (
            <p className="text-white/40 text-sm mt-1.5">
              {boards.length} board{boards.length === 1 ? '' : 's'}
            </p>
          )}
        </div>
        <button
          onClick={() => setCreating(true)}
          className="bg-accent hover:bg-accent/90 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-[0_0_0_0_rgba(61,123,255,0)] hover:shadow-[0_0_20px_2px_rgba(61,123,255,0.25)]"
        >
          + New board
        </button>
      </header>

      {creating && (
        <div
          className="fixed inset-0 bg-black/50 flex items-start justify-center pt-32 p-4 z-50 animate-fade-in"
          onClick={() => setCreating(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={createBoard}
            className="w-full max-w-md bg-canvas border border-white/10 rounded-xl p-5 shadow-2xl animate-modal-in"
          >
            <p className="text-white text-sm font-medium mb-3">Name your board</p>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Product Launch Q3"
              className="w-full bg-white/10 text-white placeholder-white/40 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent mb-3 transition-shadow"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="text-white/60 hover:text-white text-sm px-3 py-2 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim() || submitting}
                className="bg-accent hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {submitting ? 'Creating…' : 'Create board'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-xl h-28 bg-white/5 animate-skeleton"
              style={{ animationDelay: `${i * 0.12}s` }}
            />
          ))}
        </div>
      ) : boards.length === 0 ? (
        <div className="border border-dashed border-white/15 rounded-xl p-12 text-center animate-fade-in">
          <div className="w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center mx-auto mb-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3D7BFF" strokeWidth="2">
              <rect x="3" y="4" width="7" height="16" rx="1.5" />
              <rect x="14" y="4" width="7" height="9" rx="1.5" />
            </svg>
          </div>
          <p className="text-white/70 text-sm font-medium mb-1">No boards yet</p>
          <p className="text-white/40 text-sm mb-4">
            Create your first one to start organizing work.
          </p>
          <button
            onClick={() => setCreating(true)}
            className="bg-accent hover:bg-accent/90 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + New board
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {boards.map((board, i) => (
            <Link
              key={board.id}
              href={`/board/${board.id}`}
              style={{ backgroundColor: board.color, animationDelay: `${i * 0.04}s` }}
              className="group rounded-xl h-28 p-4 flex flex-col justify-between relative overflow-hidden shadow-card hover:shadow-cardHover transition-all duration-150 hover:-translate-y-0.5 animate-card-in"
            >
              <div
                aria-hidden
                className="absolute -right-4 -bottom-6 w-24 h-24 rounded-full bg-white/10 group-hover:scale-110 transition-transform duration-300"
              />
              <span className="font-display font-semibold text-white drop-shadow-sm relative">
                {board.title}
              </span>
              <span className="text-white/70 text-xs relative flex items-center gap-1 group-hover:gap-1.5 transition-all">
                Open board
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
