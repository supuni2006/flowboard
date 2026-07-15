'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CardItem } from '@/types'

export default function Card({
  card,
  onOpen,
}: {
  card: CardItem
  onOpen: (card: CardItem) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id, data: { type: 'card', card } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const isOverdue =
    card.due_date && new Date(card.due_date).getTime() < Date.now()

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(card)}
      className="bg-surface rounded-card shadow-card hover:shadow-cardHover px-3 py-2.5 cursor-grab active:cursor-grabbing transition-shadow"
    >
      <p className="text-sm text-ink leading-snug">{card.title}</p>
      {card.due_date && (
        <span
          className={`inline-block mt-1.5 text-[11px] font-medium px-1.5 py-0.5 rounded ${
            isOverdue
              ? 'bg-red-100 text-red-700'
              : 'bg-board text-muted'
          }`}
        >
          {new Date(card.due_date).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })}
        </span>
      )}
    </div>
  )
}
