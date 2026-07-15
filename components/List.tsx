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
}: {
  list: ListType
  cards: CardItem[]
  onAddCard: (listId: string, title: string) => void
  onOpenCard: (card: CardItem) => void
  onRenameList: (listId: string, title: string) => void
  onDeleteList: (listId: string) => void
}) {
  const { setNodeRef } = useDroppable({ id: list.id, data: { type: 'list', list } })
  const [addingCard, setAddingCard] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState('')
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(list.title)

  function submitCard(e: React.FormEvent) {
    e.preventDefault()
    if (!newCardTitle.trim()) return
    onAddCard(list.id, newCardTitle.trim())
    setNewCardTitle('')
    setAddingCard(false)
  }

  function submitTitle() {
    if (titleDraft.trim() && titleDraft !== list.title) {
      onRenameList(list.id, titleDraft.trim())
    }
    setEditingTitle(false)
  }

  return (
    <div className="w-72 shrink-0 bg-board rounded-xl p-2.5 flex flex-col max-h-full">
      <div className="flex items-center justify-between px-1 pb-2">
        {editingTitle ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={submitTitle}
            onKeyDown={(e) => e.key === 'Enter' && submitTitle()}
            className="font-medium text-sm bg-white rounded px-1.5 py-0.5 outline-none ring-1 ring-accent flex-1"
          />
        ) : (
          <h3
            onClick={() => setEditingTitle(true)}
            className="font-medium text-sm text-ink px-1.5 cursor-text"
          >
            {list.title}
          </h3>
        )}
        <button
          onClick={() => onDeleteList(list.id)}
          className="text-muted hover:text-red-600 text-xs px-1.5"
          aria-label={`Delete ${list.title}`}
        >
          ✕
        </button>
      </div>

      <div ref={setNodeRef} className="flex-1 overflow-y-auto space-y-2 px-0.5 min-h-[8px]">
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <Card key={card.id} card={card} onOpen={onOpenCard} />
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
            }}
            placeholder="Enter a title for this card…"
            className="w-full bg-white rounded-card px-3 py-2 text-sm outline-none ring-1 ring-line focus:ring-accent resize-none"
            rows={2}
          />
          <div className="flex items-center gap-2 mt-1.5">
            <button
              type="submit"
              className="bg-accent text-white text-xs font-medium px-3 py-1.5 rounded-lg"
            >
              Add card
            </button>
            <button
              type="button"
              onClick={() => {
                setAddingCard(false)
                setNewCardTitle('')
              }}
              className="text-muted text-xs px-2"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setAddingCard(true)}
          className="mt-1 text-left text-muted hover:bg-black/5 text-sm px-2 py-1.5 rounded-lg transition-colors"
        >
          + Add a card
        </button>
      )}
    </div>
  )
}
