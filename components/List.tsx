'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import Card from './Card'
import type { CardItem, List as ListType } from '@/types'

export default function List({
  list,
  cards,
  onAddCard,
  onOpenCard,
  onRenameList,
  onDeleteList,
  onStatusChange,
}: {
  list: ListType
  cards: CardItem[]
  onAddCard: (listId: string, title: string) => void
  onOpenCard: (card: CardItem) => void
  onRenameList: (listId: string, title: string) => void
  onDeleteList: (listId: string) => void
  onStatusChange: (cardId: string, status: CardItem['status']) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: list.id, data: { type: 'list', list } })
  const [addingCard, setAddingCard] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState('')
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(list.title)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  function submitCard(e: React.FormEvent) {
    e.preventDefault()
    if (!newCardTitle.trim()) return
    onAddCard(list.id, newCardTitle.trim())
    setNewCardTitle('')
    // Keep the composer open so adding several cards in a row is fast
  }

  function submitTitle() {
    if (titleDraft.trim() && titleDraft !== list.title) {
      onRenameList(list.id, titleDraft.trim())
    } else {
      setTitleDraft(list.title)
    }
    setEditingTitle(false)
  }

  return (
    <div className="w-[85vw] max-w-[300px] sm:w-72 shrink-0 snap-center bg-board rounded-xl p-2.5 flex flex-col max-h-full animate-list-in">
      <div className="flex items-center justify-between px-1 pb-2 gap-2">
        {editingTitle ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onFocus={(e) => e.target.select()}
            onBlur={submitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitTitle()
              if (e.key === 'Escape') {
                setTitleDraft(list.title)
                setEditingTitle(false)
              }
            }}
            className="font-medium text-sm bg-white rounded px-1.5 py-0.5 outline-none ring-1 ring-accent flex-1"
          />
        ) : (
          <button
            onClick={() => setEditingTitle(true)}
            className="font-medium text-sm text-ink px-1.5 py-0.5 -mx-1.5 cursor-text text-left rounded hover:bg-black/5 flex items-center gap-1.5 min-w-0 transition-colors"
          >
            <span className="truncate">{list.title}</span>
            <span className="shrink-0 text-[11px] font-normal text-muted bg-black/5 rounded-full px-1.5 leading-4">
              {cards.length}
            </span>
          </button>
        )}

        {confirmingDelete ? (
          <div className="flex items-center gap-1 shrink-0 animate-fade-in">
            <button
              onClick={() => onDeleteList(list.id)}
              className="text-[11px] font-medium text-white bg-red-600 hover:bg-red-700 rounded px-1.5 py-0.5 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => setConfirmingDelete(false)}
              className="text-[11px] text-muted hover:text-ink px-1"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="text-muted hover:text-red-600 hover:bg-black/5 rounded text-xs px-1.5 py-0.5 shrink-0 transition-colors"
            aria-label={`Delete ${list.title}`}
          >
            ✕
          </button>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto scroll-on-light space-y-2 px-0.5 py-0.5 min-h-[8px] rounded-lg transition-colors ${
          isOver ? 'bg-accent/10 ring-2 ring-accent/30' : ''
        }`}
      >
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.length === 0 && !isOver && (
            <p className="text-[12px] text-muted/70 px-1.5 py-1 italic select-none">
              No cards yet
            </p>
          )}
          {cards.map((card) => (
            <Card
              key={card.id}
              card={card}
              onOpen={onOpenCard}
              onStatusChange={onStatusChange}
            />
          ))}
        </SortableContext>
      </div>

      {addingCard ? (
        <form onSubmit={submitCard} className="mt-2 px-0.5">
          <textarea
            autoFocus
            value={newCardTitle}
            onChange={(e) => setNewCardTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submitCard(e)
              }
              if (e.key === 'Escape') {
                setAddingCard(false)
                setNewCardTitle('')
              }
            }}
            placeholder="Enter a title for this card…"
            className="w-full bg-white rounded-card px-3 py-2 text-sm outline-none ring-1 ring-line focus:ring-accent resize-none transition-shadow"
            rows={2}
          />
          <div className="flex items-center gap-2 mt-1.5">
            <button
              type="submit"
              disabled={!newCardTitle.trim()}
              className="bg-accent disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent/90 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              Add card
            </button>
            <button
              type="button"
              onClick={() => {
                setAddingCard(false)
                setNewCardTitle('')
              }}
              className="text-muted hover:text-ink text-xs px-2"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setAddingCard(true)}
          className="mt-1 text-left text-muted hover:bg-black/5 text-sm px-2 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
        >
          <span className="text-base leading-none">+</span> Add a card
        </button>
      )}
    </div>
  )
}