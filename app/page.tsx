'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Board } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import AuthGuard from '@/components/AuthGuard'

const PALETTE = ['#3D7BFF', '#FFB020', '#2BB673', '#E5484D', '#877323', '#0EA5E9', '#F43F9E', '#14B8A6']

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

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">FlowBoard</h1>
          <p className="text-gray-400 mt-1 sm:mt-2 text-sm sm:text-base">
            {boards.length} Boards · {user?.email}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCreating(true)}
            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-5 py-2 rounded-lg text-sm sm:text-base"
          >
            + New Board
          </button>
          <button
            onClick={() => signOut()}
            className="text-gray-400 hover:text-white text-sm px-3 py-2 rounded-lg transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      {creating && (
        <div className="fixed inset-0 z-50 bg-black/60 flex justify-center items-center px-4">
          <form onSubmit={createBoard} className="bg-gray-900 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl text-white mb-4">Create Board</h2>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Board name"
              className="w-full p-3 rounded bg-gray-800 text-white mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="px-4 py-2 rounded bg-gray-700 text-white"
              >
                Cancel
              </button>
              <button
                disabled={submitting}
                type="submit"
                className="px-4 py-2 rounded bg-blue-600 text-white"
              >
                {submitting ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : boards.length === 0 ? (
        <div className="text-center py-20">
          <h2 className="text-white text-xl mb-4">No Boards Found</h2>
          <button
            onClick={() => setCreating(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
          >
            Create First Board
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {boards.map((board) => (
            <div key={board.id} className="relative group">
              {renamingId === board.id ? (
                <div
                  className="rounded-xl p-5 h-36 text-white shadow-lg"
                  style={{ background: board.color }}
                >
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
                      className="text-xl font-bold bg-white/20 rounded px-2 py-1 outline-none ring-1 ring-white/60 w-[85%]"
                    />
                    <span className="text-sm opacity-60">Press Enter to save</span>
                  </div>
                </div>
              ) : confirmingDeleteId === board.id ? (
                <div className="rounded-xl p-5 h-36 bg-gray-900 border-2 border-red-500/50 shadow-lg flex flex-col justify-between">
                  <div>
                    <p className="text-white font-semibold mb-1">Delete "{board.title}"?</p>
                    <p className="text-gray-400 text-xs">
                      This removes all lists and cards on this board. This can't be undone.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => deleteBoard(board.id)}
                      disabled={deletingId === board.id}
                      className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {deletingId === board.id ? 'Deleting…' : 'Delete'}
                    </button>
                    <button
                      onClick={() => setConfirmingDeleteId(null)}
                      className="text-gray-400 hover:text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  href={`/board/${board.id}`}
                  className="block rounded-xl p-5 h-36 text-white shadow-lg hover:scale-105 transition"
                  style={{ background: board.color }}
                >
                  <div className="flex flex-col justify-between h-full">
                    <h2 className="text-xl font-bold pr-20 truncate">{board.title}</h2>
                    <span className="text-sm opacity-80">Open Board →</span>
                  </div>
                </Link>
              )}

              {renamingId !== board.id && confirmingDeleteId !== board.id && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setColorPickerId(colorPickerId === board.id ? null : board.id)
                      }}
                      aria-label={`Change color for ${board.title}`}
                      className="w-7 h-7 rounded-lg bg-black/20 hover:bg-black/35 text-white flex items-center justify-center transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                        className="absolute right-0 top-9 z-20 bg-gray-900 rounded-lg shadow-2xl p-2.5 grid grid-cols-4 gap-1.5 w-[132px]"
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
                    className="w-7 h-7 rounded-lg bg-black/20 hover:bg-black/35 text-white flex items-center justify-center transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                    className="w-7 h-7 rounded-lg bg-black/20 hover:bg-red-600/80 text-white flex items-center justify-center transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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