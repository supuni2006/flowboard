'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CardItem, CardStatus } from '@/types'

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

const STATUS_ORDER: CardStatus[] = ['upcoming', 'ongoing', 'complete', 'cancelled', 'deleted']

const STATUS_META: Record<CardStatus, { label: string; badge: string }> = {
  upcoming: { label: 'Upcoming', badge: 'bg-sky-100 text-sky-700' },
  ongoing: { label: 'Ongoing', badge: 'bg-amber-100 text-amber-700' },
  complete: { label: 'Complete', badge: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Cancelled', badge: 'bg-red-100 text-red-700' },
  deleted: { label: 'Deleted', badge: 'bg-gray-200 text-gray-600' },
}

export default function Card({
  card,
  onOpen,
  onStatusChange,
}: {
  card: CardItem
  onOpen: (card: CardItem) => void
  onStatusChange: (cardId: string, status: CardStatus) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id, data: { type: 'card', card } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const due = dueMeta(card.due_date)
  const status = card.status ?? 'upcoming'
  const statusMeta = STATUS_META[status]
  const isDeadState = status === 'deleted' || status === 'cancelled'

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
      className={`group bg-surface rounded-card shadow-card hover:shadow-cardHover px-3 py-2.5 cursor-grab active:cursor-grabbing transition-all duration-150 hover:-translate-y-0.5 animate-card-in overflow-hidden ${
        isDeadState ? 'opacity-60' : ''
      }`}
    >
      {card.color && (
        <div className="h-1 -mx-3 -mt-2.5 mb-2" style={{ backgroundColor: card.color }} />
      )}

      <p className={`text-sm text-ink leading-snug ${status === 'deleted' ? 'line-through' : ''}`}>
        {card.title}
      </p>

      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
        {/* Quick status picker — click doesn't open the card */}
        <select
          value={status}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onChange={(e) => {
            e.stopPropagation()
            onStatusChange(card.id, e.target.value as CardStatus)
          }}
          className={`appearance-none cursor-pointer text-[11px] font-medium pl-1.5 pr-4 py-0.5 rounded outline-none ${statusMeta.badge}`}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 24 24' fill='none' stroke='%23555' stroke-width='3'><path d='M6 9l6 6 6-6'/></svg>\")",
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 4px center',
          }}
        >
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {STATUS_META[s].label}
            </option>
          ))}
        </select>

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
    </div>
  )
}