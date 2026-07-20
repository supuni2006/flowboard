'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Board } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import AuthGuard from '@/components/AuthGuard'

// A calmer, tonally-consistent palette (professional SaaS, not primary-color toybox)
const PALETTE = ['#4F6BFF', '#14B8A6', '#F5A524', '#F0554B', '#8B5CF6', '#0EA5E9', '#22C55E', '#EC4899']

export default function DashboardPage() {
  return (
    <AuthGuard>
      <Dashboard />
    </AuthGuard>
  )
}

function Dashboard() {
  const { user, signOut } = useAuth()
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameDraft, setRenameDraft] = useState('')

  const [colorPickerId, setColorPickerId] = useState<string | null>(null)
  const colorPickerRef = useRef<HTMLDivElement>(null)

  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchBoards()
  }, [])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setColorPickerId(null)
      }
    }
    if (colorPickerId) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [colorPickerId])

  async function fetchBoards() {
    setLoading(true)
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      alert(error.message)
    } else {
      setBoards(data ?? [])
    }
    setLoading(false)
  }

  async function createBoard(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    setSubmitting(true)
    const color = PALETTE[Math.floor(Math.random() * PALETTE.length)]

    const { data, error } = await supabase
      .from('boards')
      .insert([{ title: title.trim(), color, created_by: user?.id }])
      .select()
      .single()

    if (error) {
      console.error(error)
      alert(error.message)
      setSubmitting(false)
      return
    }

    setBoards((prev) => [data as Board, ...prev])
    setTitle('')
    setCreating(false)
    setSubmitting(false)
  }

  function startRename(board: Board, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setRenamingId(board.id)
    setRenameDraft(board.title)
  }

  async function submitRename(boardId: string) {
    const trimmed = renameDraft.trim()
    setRenamingId(null)

    const original = boards.find((b) => b.id === boardId)
    if (!trimmed || !original || trimmed === original.title) return

    setBoards((prev) => prev.map((b) => (b.id === boardId ? { ...b, title: trimmed } : b)))

    const { error } = await supabase.from('boards').update({ title: trimmed }).eq('id', boardId)
    if (error) {
      console.error(error)
      setBoards((prev) => prev.map((b) => (b.id === boardId ? original : b)))
      alert('Could not rename board: ' + error.message)
    }
  }

  async function changeColor(boardId: string, color: string) {
    setColorPickerId(null)
    const original = boards.find((b) => b.id === boardId)
    if (!original || original.color === color) return

    setBoards((prev) => prev.map((b) => (b.id === boardId ? { ...b, color } : b)))

    const { error } = await supabase.from('boards').update({ color }).eq('id', boardId)
    if (error) {
      console.error(error)
      setBoards((prev) => prev.map((b) => (b.id === boardId ? original : b)))
      alert('Could not change color: ' + error.message)
    }
  }

  async function deleteBoard(boardId: string) {
    setDeletingId(boardId)
    const previous = boards
    setBoards((prev) => prev.filter((b) => b.id !== boardId))

    const { error } = await supabase.from('boards').delete().eq('id', boardId)

    if (error) {
      console.error(error)
      setBoards(previous)
      alert('Could not delete board: ' + error.message)
    }

    setConfirmingDeleteId(null)
    setDeletingId(null)
  }

  const filteredBoards = boards.filter((b) =>
    b.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
  )

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 sm:mb-10">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent to-[#8B5CF6] flex items-center justify-center shadow-cardDarkHover shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="6" height="16" rx="1.5" fill="white" fillOpacity="0.95" />
              <rect x="11" y="4" width="6" height="10" rx="1.5" fill="white" fillOpacity="0.7" />
              <rect x="19" y="4" width="2" height="7" rx="1" fill="white" fillOpacity="0.45" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.14em] text-accent/80 uppercase mb-0.5">
              Workspace
            </p>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white leading-none">
              FlowBoard
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={() => setCreating(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-gradient-to-b from-accent to-[#3d59e8] hover:brightness-110 active:brightness-95 text-white font-medium px-4 sm:px-5 py-2.5 rounded-xl text-sm shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_8px_20px_-8px_rgba(79,107,255,0.6)] transition-all"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            New Board
          </button>
          <button
            onClick={() => signOut()}
            className="text-mutedDark hover:text-white text-sm px-3.5 py-2.5 rounded-xl border border-lineDark hover:border-white/20 hover:bg-white/[0.04] transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      <p className="text-mutedDark text-sm mb-4 -mt-4 sm:-mt-6">
        <span className="text-white font-medium">{boards.length}</span>{' '}
        {boards.length === 1 ? 'board' : 'boards'}
        <span className="mx-2 text-white/15">·</span>
        {user?.email}
      </p>

      <div className="relative mb-6 sm:mb-8 max-w-sm">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mutedDark pointer-events-none"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.35-4.35" strokeLinecap="round" />
        </svg>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search boards…"
          aria-label="Search boards"
          className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-surfaceDark border border-lineDark text-white text-sm placeholder:text-mutedDark/60 outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/40 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-mutedDark hover:text-white w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/[0.08] transition-colors"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {creating && (
        <div className="fixed inset-0 z-50 bg-[#05070d]/70 backdrop-blur-sm flex justify-center items-center px-4 animate-fade-in">
          <form
            onSubmit={createBoard}
            className="bg-surfaceDark border border-lineDark rounded-2xl p-6 w-full max-w-md shadow-panelDark animate-modal-in"
          >
            <h2 className="text-lg font-display font-semibold text-white mb-1">Create board</h2>
            <p className="text-mutedDark text-sm mb-5">Give your board a name to get started.</p>
            <label className="block text-xs font-medium text-mutedDark uppercase tracking-wide mb-1.5">
              Board name
            </label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Product Launch Q3"
              className="w-full p-3 rounded-xl bg-canvas border border-lineDark text-white placeholder:text-mutedDark/60 mb-5 outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/40 transition-colors"
            />
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="px-4 py-2 rounded-xl text-mutedDark hover:text-white hover:bg-white/[0.06] text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={submitting || !title.trim()}
                type="submit"
                className="px-4 py-2 rounded-xl bg-accent hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100 text-white text-sm font-medium transition-all"
              >
                {submitting ? 'Creating…' : 'Create board'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-2xl h-40 bg-surfaceDark/60 border border-lineDark animate-skeleton"
            />
          ))}
        </div>
      ) : boards.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-lineDark rounded-2xl">
          <div className="w-12 h-12 rounded-xl bg-surfaceDark border border-lineDark flex items-center justify-center mx-auto mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8A93A6" strokeWidth="1.75">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M3 9h18M9 9v11" strokeLinecap="round" />
            </svg>
          </div>
          <h2 className="text-white text-lg font-display font-semibold mb-1.5">No boards yet</h2>
          <p className="text-mutedDark text-sm mb-6">Create your first board to start organizing work.</p>
          <button
            onClick={() => setCreating(true)}
            className="bg-accent hover:brightness-110 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-all"
          >
            Create first board
          </button>
        </div>
      ) : filteredBoards.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-lineDark rounded-2xl">
          <div className="w-12 h-12 rounded-xl bg-surfaceDark border border-lineDark flex items-center justify-center mx-auto mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8A93A6" strokeWidth="1.75">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.35-4.35" strokeLinecap="round" />
            </svg>
          </div>
          <h2 className="text-white text-lg font-display font-semibold mb-1.5">No boards found</h2>
          <p className="text-mutedDark text-sm">No boards match "{searchQuery}".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredBoards.map((board) => (
            <div key={board.id} className="relative group animate-card-in">
              {renamingId === board.id ? (
                <div className="relative rounded-2xl p-5 h-40 bg-surfaceDark border border-lineDark shadow-cardDark overflow-hidden">
                  <div
                    className="absolute inset-x-0 top-0 h-[3px]"
                    style={{ background: `linear-gradient(90deg, ${board.color}, transparent)` }}
                  />
                  <div className="flex flex-col justify-between h-full">
                    <input
                      autoFocus
                      value={renameDraft}
                      onChange={(e) => setRenameDraft(e.target.value)}
                      onFocus={(e) => e.target.select()}
                      onBlur={() => submitRename(board.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          ;(e.target as HTMLInputElement).blur()
                        }
                        if (e.key === 'Escape') setRenamingId(null)
                      }}
                      className="text-lg font-display font-semibold text-white bg-white/[0.06] rounded-lg px-2.5 py-1.5 outline-none ring-1 ring-accent/50 w-[90%]"
                    />
                    <span className="text-xs text-mutedDark">Press Enter to save</span>
                  </div>
                </div>
              ) : confirmingDeleteId === board.id ? (
                <div className="rounded-2xl p-5 h-40 bg-surfaceDark border border-[#F0554B]/40 shadow-cardDark flex flex-col justify-between">
                  <div>
                    <p className="text-white font-medium text-[15px] mb-1">Delete "{board.title}"?</p>
                    <p className="text-mutedDark text-xs leading-relaxed">
                      This removes all lists and cards on this board. This can't be undone.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => deleteBoard(board.id)}
                      disabled={deletingId === board.id}
                      className="bg-[#F0554B] hover:brightness-110 disabled:opacity-50 text-white text-sm font-medium px-3.5 py-1.5 rounded-lg transition-all"
                    >
                      {deletingId === board.id ? 'Deleting…' : 'Delete'}
                    </button>
                    <button
                      onClick={() => setConfirmingDeleteId(null)}
                      className="text-mutedDark hover:text-white text-sm px-3.5 py-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  href={`/board/${board.id}`}
                  className="relative flex flex-col justify-between rounded-2xl p-5 h-40 bg-surfaceDark border border-lineDark shadow-cardDark hover:shadow-cardDarkHover hover:-translate-y-0.5 hover:border-white/[0.14] transition-all duration-200 overflow-hidden"
                >
                  {/* accent line */}
                  <div
                    className="absolute inset-x-0 top-0 h-[3px]"
                    style={{ background: `linear-gradient(90deg, ${board.color}, transparent 85%)` }}
                  />
                  {/* soft color glow, revealed on hover */}
                  <div
                    className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-2xl pointer-events-none"
                    style={{ background: board.color, opacity: 0.14 }}
                  />

                  <div className="relative flex items-start justify-between gap-2">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center font-display font-semibold text-sm shrink-0"
                      style={{
                        background: `${board.color}22`,
                        color: board.color,
                        border: `1px solid ${board.color}55`,
                      }}
                    >
                      {board.title.trim().charAt(0).toUpperCase() || 'B'}
                    </div>
                  </div>

                  <div className="relative">
                    <h2 className="text-[17px] font-display font-semibold text-white pr-16 truncate mb-1.5">
                      {board.title}
                    </h2>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-mutedDark group-hover:text-white transition-colors">
                      Open board
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="translate-y-px group-hover:translate-x-0.5 transition-transform">
                        <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </div>
                </Link>
              )}

              {renamingId !== board.id && confirmingDeleteId !== board.id && (
                <div className="absolute top-3.5 right-3.5 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setColorPickerId(colorPickerId === board.id ? null : board.id)
                      }}
                      aria-label={`Change color for ${board.title}`}
                      className="w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.06] text-mutedDark hover:text-white flex items-center justify-center transition-colors"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="13.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
                        <circle cx="17.5" cy="10.5" r="1.5" fill="currentColor" stroke="none" />
                        <circle cx="8.5" cy="7.5" r="1.5" fill="currentColor" stroke="none" />
                        <circle cx="6.5" cy="12.5" r="1.5" fill="currentColor" stroke="none" />
                        <path
                          d="M12 2a10 10 0 100 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.4-.3-.4-.5-.8-.5-1.4 0-1.1.9-2 2-2h2.3A5.2 5.2 0 0022 10.2C22 5.7 17.5 2 12 2z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>

                    {colorPickerId === board.id && (
                      <div
                        ref={colorPickerRef}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-9 z-20 bg-surfaceDarkRaised border border-lineDark rounded-xl shadow-panelDark p-2.5 grid grid-cols-4 gap-1.5 w-[136px]"
                      >
                        {PALETTE.map((c) => (
                          <button
                            key={c}
                            onClick={() => changeColor(board.id, c)}
                            aria-label={`Set color ${c}`}
                            className={`w-6 h-6 rounded-full border-2 transition-transform ${
                              board.color === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={(e) => startRename(board, e)}
                    aria-label={`Rename ${board.title}`}
                    className="w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.06] text-mutedDark hover:text-white flex items-center justify-center transition-colors"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path
                        d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setConfirmingDeleteId(board.id)
                    }}
                    aria-label={`Delete ${board.title}`}
                    className="w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-[#F0554B]/80 border border-white/[0.06] hover:border-transparent text-mutedDark hover:text-white flex items-center justify-center transition-colors"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path
                        d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0l-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6h16z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}