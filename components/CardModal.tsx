'use client'

import { useState } from 'react'
import type { CardItem } from '@/types'

export default function CardModal({
  card,
  onClose,
  onSave,
  onDelete,
}: {
  card: CardItem
  onClose: () => void
  onSave: (id: string, updates: Partial<CardItem>) => void
  onDelete: (id: string) => void
}) {
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description)
  const [dueDate, setDueDate] = useState(
    card.due_date ? card.due_date.slice(0, 10) : ''
  )

  function save() {
    onSave(card.id, {
      title: title.trim() || card.title,
      description,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface rounded-xl w-full max-w-lg p-6 shadow-2xl"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full font-display font-semibold text-lg outline-none border-b border-transparent focus:border-line pb-1 mb-4"
        />

        <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a more detailed description…"
          rows={4}
          className="w-full bg-board rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent resize-none mb-4"
        />

        <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">
          Due date
        </label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="bg-board rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent mb-6"
        />

        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              onDelete(card.id)
              onClose()
            }}
            className="text-red-600 text-sm font-medium"
          >
            Delete card
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="text-muted text-sm px-3 py-2">
              Cancel
            </button>
            <button
              onClick={save}
              className="bg-accent text-white text-sm font-medium px-4 py-2 rounded-lg"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
