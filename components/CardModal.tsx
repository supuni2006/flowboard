'use client'

import { useEffect, useState } from 'react'
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
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  function save() {
    onSave(card.id, {
      title: title.trim() || card.title,
      description,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
    })
    onClose()
  }

  const createdLabel = card.created_at
    ? new Date(card.created_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface rounded-xl w-full max-w-lg shadow-2xl animate-modal-in overflow-hidden"
      >
        <div className="flex items-start justify-between px-6 pt-6">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            }}
            className="w-full font-display font-semibold text-lg outline-none border-b border-transparent focus:border-line pb-1 -ml-0.5 pl-0.5 bg-transparent"
          />
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 text-muted hover:text-ink hover:bg-black/5 rounded-lg w-8 h-8 flex items-center justify-center -mt-1 -mr-1.5 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="px-6 pb-6 pt-2">
          <label className="flex items-center gap-1.5 text-xs font-medium text-muted uppercase tracking-wide mb-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
            </svg>
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a more detailed description…"
            rows={4}
            className="w-full bg-board rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent resize-none mb-5 transition-shadow"
          />

          <label className="flex items-center gap-1.5 text-xs font-medium text-muted uppercase tracking-wide mb-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M3 9h18M8 2v4M16 2v4" strokeLinecap="round" />
            </svg>
            Due date
          </label>
          <div className="flex items-center gap-2 mb-1">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="bg-board rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent transition-shadow"
            />
            {dueDate && (
              <button
                onClick={() => setDueDate('')}
                className="text-xs text-muted hover:text-red-600 px-2 py-1 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {createdLabel && (
            <p className="text-[11px] text-muted/70 mt-5">Created {createdLabel}</p>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-line bg-board/50">
          {confirmingDelete ? (
            <div className="flex items-center gap-2 animate-fade-in">
              <span className="text-xs text-muted">Delete this card?</span>
              <button
                onClick={() => {
                  onDelete(card.id)
                  onClose()
                }}
                className="text-white text-xs font-medium bg-red-600 hover:bg-red-700 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                className="text-muted hover:text-ink text-xs px-2"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Delete card
            </button>
          )}
          <div className="flex gap-2">
            <button onClick={onClose} className="text-muted hover:text-ink text-sm px-3 py-2 transition-colors">
              Cancel
            </button>
            <button
              onClick={save}
              className="bg-accent hover:bg-accent/90 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
