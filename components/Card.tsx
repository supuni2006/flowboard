'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CardItem } from '@/types'

function dueMeta(dueDate: string | null) {
  if (!dueDate) return null
  const due = new Date(dueDate)
  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  const diffDays = Math.round((startOfDue.getTime() - startOfToday.getTime()) / 86400000)

  const label = due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

  if (diffDays < 0) return { label, tone: 'overdue' as const }
  if (diffDays === 0) return { label: 'Today', tone: 'today' as const }
  if (diffDays === 1) return { label: 'Tomorrow', tone: 'upcoming' as const }
  return { label, tone: 'upcoming' as const }
}

const TONE_STYLES: Record<string, string> = {
  overdue: 'bg-red-100 text-red-700',
  today: 'bg-accent2/20 text-amber-700',
  upcoming: 'bg-board text-muted',
}

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

  const due = dueMeta(card.due_date)

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(card)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen(card)
        }
      }}
      role="button"
      tabIndex={0}
      className="group bg-surface rounded-card shadow-card hover:shadow-cardHover px-3 py-2.5 cursor-grab active:cursor-grabbing transition-all duration-150 hover:-translate-y-0.5 animate-card-in"
    >
      <p className="text-sm text-ink leading-snug">{card.title}</p>

      {(due || card.description) && (
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          {due && (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded ${TONE_STYLES[due.tone]}`}
            >
              {due.tone === 'overdue' && (
                <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-red-600" />
              )}
              {due.label}
            </span>
          )}
          {card.description && (
            <span
              className="inline-flex items-center text-muted/70 group-hover:text-muted transition-colors"
              aria-label="Has description"
              title="Has description"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
              </svg>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
