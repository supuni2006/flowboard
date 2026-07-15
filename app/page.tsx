'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Board } from '@/types'

const PALETTE = [
  '#3D7BFF',
  '#FFB020',
  '#2BB673',
  '#E5484D',
  '#8B5CF6',
  '#0EA5E9',
]

export default function DashboardPage() {
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchBoards()
  }, [])

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

    const color =
      PALETTE[Math.floor(Math.random() * PALETTE.length)]

    const { data, error } = await supabase
      .from('boards')
      .insert([
        {
          title: title.trim(),
          color,
        },
      ])
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

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">

      <div className="flex items-center justify-between mb-8">

        <div>
          <h1 className="text-4xl font-bold text-white">
            Your Boards
          </h1>

          <p className="text-gray-400 mt-2">
            {boards.length} Boards
          </p>
        </div>

        <button
          onClick={() => setCreating(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
        >
          + New Board
        </button>

      </div>

      {creating && (

        <div className="fixed inset-0 bg-black/60 flex justify-center items-center">

          <form
            onSubmit={createBoard}
            className="bg-gray-900 rounded-xl p-6 w-full max-w-md"
          >

            <h2 className="text-xl text-white mb-4">
              Create Board
            </h2>

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

        <div className="text-gray-400">
          Loading...
        </div>

      ) : boards.length === 0 ? (

        <div className="text-center py-20">

          <h2 className="text-white text-xl mb-4">
            No Boards Found
          </h2>

          <button
            onClick={() => setCreating(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
          >
            Create First Board
          </button>

        </div>

      ) : (

        <div className="grid md:grid-cols-3 gap-5">

          {boards.map((board) => (

            <Link
              key={board.id}
              href={`/board/${board.id}`}
              className="rounded-xl p-5 h-36 text-white shadow-lg hover:scale-105 transition"
              style={{
                background: board.color,
              }}
            >
              <div className="flex flex-col justify-between h-full">

                <h2 className="text-xl font-bold">
                  {board.title}
                </h2>

                <span className="text-sm opacity-80">
                  Open Board →
                </span>

              </div>

            </Link>

          ))}

        </div>

      )}

    </main>
  )
}