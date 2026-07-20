'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { supabase } from '@/lib/supabase'
import type { Board, List as ListType, CardItem } from '@/types'
import List from '@/components/List'
import Card from '@/components/Card'
import CardModal from '@/components/CardModal'

const PALETTE = ['#3D7BFF', '#FFB020', '#2BB673', '#E5484D', '#8B5CF6', '#0EA5E9', '#F43F9E', '#14B8A6']
const MAX_LISTS = 10

export default function BoardPage({ params }: { params: { id: string } }) {
  const boardId = params.id
  const router = useRouter()

  const [board, setBoard] = useState<Board | null>(null)
  const [lists, setLists] = useState<ListType[]>([])
  const [cards, setCards] = useState<CardItem[]>([])
  const [activeCard, setActiveCard] = useState<CardItem | null>(null)
  const [openCard, setOpenCard] = useState<CardItem | null>(null)
  const [addingList, setAddingList] = useState(false)
  const [newListTitle, setNewListTitle] = useState('')
  const [cardSearchQuery, setCardSearchQuery] = useState('')

  const [editingBoardTitle, setEditingBoardTitle] = useState(false)
  const [boardTitleDraft, setBoardTitleDraft] = useState('')

  const [showColorPicker, setShowColorPicker] = useState(false)
  const colorPickerRef = useRef<HTMLDivElement>(null)

  const [confirmingDeleteBoard, setConfirmingDeleteBoard] = useState(false)
  const [deletingBoard, setDeletingBoard] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  )

  useEffect(() => {
    loadBoard()
    // Live sync: reflect changes from other teammates on this board in real time
    const channel = supabase
      .channel(`board-${boardId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cards' },
        () => loadCardsAndLists()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lists', filter: `board_id=eq.${boardId}` },
        () => loadCardsAndLists()
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId])

  useEffect(() => {
    if (board) setBoardTitleDraft(board.title)
  }, [board])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false)
      }
    }
    if (showColorPicker) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [showColorPicker])

  async function loadBoard() {
    const { data: boardData } = await supabase
      .from('boards')
      .select('*')
      .eq('id', boardId)
      .single()
    setBoard(boardData as Board)
    await loadCardsAndLists()
  }

  const loadCardsAndLists = useCallback(async () => {
    const { data: listsData } = await supabase
      .from('lists')
      .select('*')
      .eq('board_id', boardId)
      .order('position')
    const listIds = (listsData || []).map((l) => l.id)
    let cardsData: CardItem[] = []
    if (listIds.length) {
      const { data } = await supabase
        .from('cards')
        .select('*')
        .in('list_id', listIds)
        .order('position')
      cardsData = (data || []) as CardItem[]
    }
    setLists((listsData || []) as ListType[])
    setCards(cardsData)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId])

  async function renameBoard(newTitle: string) {
    if (!board) return
    const trimmed = newTitle.trim()
    if (!trimmed || trimmed === board.title) {
      setBoardTitleDraft(board.title)
      setEditingBoardTitle(false)
      return
    }
    const previous = board
    setBoard({ ...board, title: trimmed })
    setEditingBoardTitle(false)

    const { error } = await supabase.from('boards').update({ title: trimmed }).eq('id', board.id)
    if (error) {
      console.error(error)
      setBoard(previous)
      alert('Could not rename board: ' + error.message)
    }
  }

  async function changeColor(color: string) {
    if (!board) return
    setShowColorPicker(false)
    if (board.color === color) return

    const previous = board
    setBoard({ ...board, color })

    const { error } = await supabase.from('boards').update({ color }).eq('id', board.id)
    if (error) {
      console.error(error)
      setBoard(previous)
      alert('Could not change color: ' + error.message)
    }
  }

  async function deleteBoard() {
    if (!board) return
    setDeletingBoard(true)

    const { error } = await supabase.from('boards').delete().eq('id', board.id)

    if (error) {
      console.error(error)
      alert('Could not delete board: ' + error.message)
      setDeletingBoard(false)
      return
    }

    router.push('/')
  }

  async function addList(e: React.FormEvent) {
    e.preventDefault()
    if (!newListTitle.trim()) return
    if (lists.length >= MAX_LISTS) return
    const { data } = await supabase
      .from('lists')
      .insert({ board_id: boardId, title: newListTitle.trim(), position: lists.length })
      .select()
      .single()
    if (data) setLists([...lists, data as ListType])
    setNewListTitle('')
    setAddingList(false)
  }

  async function renameList(listId: string, title: string) {
    setLists(lists.map((l) => (l.id === listId ? { ...l, title } : l)))
    await supabase.from('lists').update({ title }).eq('id', listId)
  }

  async function deleteList(listId: string) {
    setLists(lists.filter((l) => l.id !== listId))
    setCards(cards.filter((c) => c.list_id !== listId))
    await supabase.from('lists').delete().eq('id', listId)
  }

  async function addCard(listId: string, title: string) {
    const listCards = cards.filter((c) => c.list_id === listId)
    const { data } = await supabase
      .from('cards')
      .insert({ list_id: listId, title, position: listCards.length })
      .select()
      .single()
    if (data) setCards([...cards, data as CardItem])
  }

  async function saveCard(id: string, updates: Partial<CardItem>) {
    setCards(cards.map((c) => (c.id === id ? { ...c, ...updates } : c)))
    await supabase.from('cards').update(updates).eq('id', id)
  }

  async function deleteCard(id: string) {
    setCards(cards.filter((c) => c.id !== id))
    await supabase.from('cards').delete().eq('id', id)
  }

  async function updateCardStatus(id: string, status: CardItem['status']) {
    setCards(cards.map((c) => (c.id === id ? { ...c, status } : c)))
    const { error } = await supabase.from('cards').update({ status }).eq('id', id)
    if (error) {
      console.error('Failed to update status:', error)
      // Roll back optimistic update on failure
      loadCardsAndLists()
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const card = cards.find((c) => c.id === event.active.id)
    if (card) setActiveCard(card)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveCard(null)
    if (!over) return

    const activeCardItem = cards.find((c) => c.id === active.id)
    if (!activeCardItem) return

    const overIsList = lists.some((l) => l.id === over.id)
    const overCard = cards.find((c) => c.id === over.id)
    const targetListId = overIsList ? (over.id as string) : overCard?.list_id

    if (!targetListId) return

    let updated = [...cards]

    if (activeCardItem.list_id !== targetListId) {
      updated = updated.map((c) =>
        c.id === activeCardItem.id ? { ...c, list_id: targetListId } : c
      )
    }

    if (!overIsList && overCard) {
      const listCards = updated
        .filter((c) => c.list_id === targetListId)
        .sort((a, b) => a.position - b.position)
      const oldIndex = listCards.findIndex((c) => c.id === active.id)
      const newIndex = listCards.findIndex((c) => c.id === over.id)
      const reordered =
        oldIndex >= 0 ? arrayMove(listCards, oldIndex, newIndex) : listCards
      reordered.forEach((c, i) => {
        const idx = updated.findIndex((u) => u.id === c.id)
        updated[idx] = { ...updated[idx], position: i }
      })
    }

    setCards(updated)

    const targetListCards = updated.filter((c) => c.list_id === targetListId)
    for (const c of targetListCards) {
      await supabase
        .from('cards')
        .update({ list_id: c.list_id, position: c.position })
        .eq('id', c.id)
    }
  }

  return (
    <main className="h-screen flex flex-col">
      <div
        className="h-1 shrink-0"
        style={{ backgroundColor: board?.color || 'transparent' }}
      />
      <header className="px-3 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center gap-2 sm:gap-4 bg-black/10">
        <Link
          href="/"
          className="text-white/60 hover:text-white text-sm flex items-center gap-1 transition-colors shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M11 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="hidden sm:inline">Boards</span>
        </Link>
        <div className="w-px h-4 bg-white/15 hidden sm:block" />

        {editingBoardTitle ? (
          <input
            autoFocus
            value={boardTitleDraft}
            onChange={(e) => setBoardTitleDraft(e.target.value)}
            onFocus={(e) => e.target.select()}
            onBlur={() => renameBoard(boardTitleDraft)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
              if (e.key === 'Escape') {
                setBoardTitleDraft(board?.title || '')
                setEditingBoardTitle(false)
              }
            }}
            className="font-display font-semibold text-white text-lg bg-white/10 rounded px-2 py-0.5 outline-none ring-1 ring-white/40 min-w-[120px] max-w-full"
          />
        ) : (
          <button
            onClick={() => board && setEditingBoardTitle(true)}
            className="font-display font-semibold text-white text-lg truncate max-w-[45vw] sm:max-w-none hover:bg-white/10 rounded px-1.5 -mx-1.5 py-0.5 transition-colors text-left"
          >
            {board?.title || 'Loading…'}
          </button>
        )}

        <div className="relative">
          <button
            onClick={() => setShowColorPicker((v) => !v)}
            aria-label="Change board color"
            className="w-6 h-6 rounded-full border-2 border-white/40 hover:border-white/70 transition-colors"
            style={{ backgroundColor: board?.color || 'transparent' }}
          />
          {showColorPicker && (
            <div
              ref={colorPickerRef}
              className="absolute left-0 top-8 z-20 bg-gray-900 rounded-lg shadow-2xl p-2.5 grid grid-cols-4 gap-1.5 w-[132px]"
            >
              {PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => changeColor(c)}
                  aria-label={`Set color ${c}`}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    board?.color === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          )}
        </div>

        {board && (
          <span className="text-white/40 text-xs shrink-0 hidden sm:inline order-3 sm:order-none">
            {lists.length} list{lists.length === 1 ? '' : 's'} · {cards.length} card
            {cards.length === 1 ? '' : 's'}
          </span>
        )}

        <div className="relative sm:ml-auto w-full sm:w-56 order-4 sm:order-none basis-full sm:basis-auto">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            value={cardSearchQuery}
            onChange={(e) => setCardSearchQuery(e.target.value)}
            placeholder="Search cards…"
            aria-label="Search cards by title"
            className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-white/10 border border-white/10 text-white text-sm placeholder:text-white/40 outline-none focus:border-white/30 focus:bg-white/[0.14] transition-colors"
          />
          {cardSearchQuery && (
            <button
              onClick={() => setCardSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        {confirmingDeleteBoard ? (
          <div className="flex items-center gap-2 shrink-0 animate-fade-in">
            <span className="text-white/70 text-xs">Delete this board?</span>
            <button
              onClick={deleteBoard}
              disabled={deletingBoard}
              className="text-white text-xs font-medium bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg px-2 py-1 transition-colors"
            >
              {deletingBoard ? 'Deleting…' : 'Delete'}
            </button>
            <button
              onClick={() => setConfirmingDeleteBoard(false)}
              className="text-white/60 hover:text-white text-xs px-1.5"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingDeleteBoard(true)}
            aria-label="Delete board"
            className="shrink-0 text-white/50 hover:text-red-400 hover:bg-white/10 rounded-lg w-7 h-7 flex items-center justify-center transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path
                d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0l-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6h16z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </header>

      <div className="flex-1 overflow-x-auto px-3 sm:px-6 py-3 sm:py-5 snap-x snap-mandatory sm:snap-none">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-3 sm:gap-4 h-full items-start">
            <SortableContext items={lists.map((l) => l.id)} strategy={horizontalListSortingStrategy}>
              {lists.map((list) => (
                <List
                  key={list.id}
                  list={list}
                  cards={cards
                    .filter((c) => c.list_id === list.id)
                    .filter((c) =>
                      c.title.toLowerCase().includes(cardSearchQuery.trim().toLowerCase())
                    )
                    .sort((a, b) => a.position - b.position)}
                  isSearching={cardSearchQuery.trim().length > 0}
                  onAddCard={addCard}
                  onOpenCard={setOpenCard}
                  onRenameList={renameList}
                  onDeleteList={deleteList}
                  onStatusChange={updateCardStatus}
                />
              ))}
            </SortableContext>

            {lists.length >= MAX_LISTS ? (
              <div className="w-[85vw] max-w-[300px] sm:w-72 shrink-0 text-white/50 text-sm px-3 py-2.5">
                List limit reached ({MAX_LISTS} max per board)
              </div>
            ) : addingList ? (
              <form onSubmit={addList} className="w-[85vw] max-w-[300px] sm:w-72 shrink-0 snap-center bg-board rounded-xl p-2.5 animate-list-in">
                <input
                  autoFocus
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Escape' && setAddingList(false)}
                  placeholder="List name…"
                  className="w-full bg-white rounded-lg px-3 py-2 text-sm outline-none ring-1 ring-line focus:ring-accent transition-shadow"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    type="submit"
                    disabled={!newListTitle.trim()}
                    className="bg-accent disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent/90 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Add list
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddingList(false)}
                    className="text-muted hover:text-ink text-xs px-2"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setAddingList(true)}
                className="w-[85vw] max-w-[300px] sm:w-72 shrink-0 snap-center text-left text-white/70 hover:bg-white/10 text-sm px-3 py-2.5 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <span className="text-base leading-none">+</span>
                {lists.length === 0 ? 'Add your first list' : 'Add another list'}
              </button>
            )}
          </div>

          <DragOverlay>
            {activeCard ? (
              <div className="w-72 rotate-3 scale-105 shadow-cardHover rounded-card">
                <Card card={activeCard} onOpen={() => {}} onStatusChange={() => {}} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {openCard && (
        <CardModal
          card={openCard}
          onClose={() => setOpenCard(null)}
          onSave={saveCard}
          onDelete={deleteCard}
        />
      )}
    </main>
  )
}