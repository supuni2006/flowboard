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

  useEffect(() => {
    fetchBoards()
  }, [])

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
    if (!title.trim()) return
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
        </div>
        <button
          onClick={() => setCreating(true)}
          className="bg-accent hover:bg-accent/90 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          + New board
        </button>
      </header>

      {creating && (
        <form
          onSubmit={createBoard}
          className="mb-8 bg-white/5 border border-white/10 rounded-xl p-4 flex gap-3"
        >
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Board name, e.g. Product Launch Q3"
            className="flex-1 bg-white/10 text-white placeholder-white/40 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            type="submit"
            className="bg-accent text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => setCreating(false)}
            className="text-white/60 text-sm px-3"
          >
            Cancel
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-white/50 text-sm">Loading boards…</p>
      ) : boards.length === 0 ? (
        <div className="border border-dashed border-white/15 rounded-xl p-12 text-center">
          <p className="text-white/60 text-sm">
            No boards yet. Create your first one to start organizing work.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {boards.map((board) => (
            <Link
              key={board.id}
              href={`/board/${board.id}`}
              className="group rounded-xl h-28 p-4 flex flex-col justify-between relative overflow-hidden shadow-card hover:shadow-cardHover transition-shadow"
              style={{ backgroundColor: board.color }}
            >
              <span className="font-display font-semibold text-white drop-shadow-sm">
                {board.title}
              </span>
              <span className="text-white/70 text-xs">
                Open board →
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
