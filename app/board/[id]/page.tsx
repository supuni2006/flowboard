'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
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

export default function BoardPage({ params }: { params: { id: string } }) {
  const boardId = params.id
  const [board, setBoard] = useState<Board | null>(null)
  const [lists, setLists] = useState<ListType[]>([])
  const [cards, setCards] = useState<CardItem[]>([])
  const [activeCard, setActiveCard] = useState<CardItem | null>(null)
  const [openCard, setOpenCard] = useState<CardItem | null>(null)
  const [addingList, setAddingList] = useState(false)
  const [newListTitle, setNewListTitle] = useState('')

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

  async function addList(e: React.FormEvent) {
    e.preventDefault()
    if (!newListTitle.trim()) return
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
      // Moved to a different list
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

    // Persist changes for the moved card and any cards whose position shifted
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
      <header className="px-6 py-4 flex items-center gap-4 bg-black/10">
        <Link href="/" className="text-white/60 hover:text-white text-sm">
          ← Boards
        </Link>
        <h1 className="font-display font-semibold text-white text-lg">
          {board?.title || 'Loading…'}
        </h1>
      </header>

      <div className="flex-1 overflow-x-auto px-6 py-5">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 h-full items-start">
            <SortableContext items={lists.map((l) => l.id)} strategy={horizontalListSortingStrategy}>
              {lists.map((list) => (
                <List
                  key={list.id}
                  list={list}
                  cards={cards
                    .filter((c) => c.list_id === list.id)
                    .sort((a, b) => a.position - b.position)}
                  onAddCard={addCard}
                  onOpenCard={setOpenCard}
                  onRenameList={renameList}
                  onDeleteList={deleteList}
                />
              ))}
            </SortableContext>

            {addingList ? (
              <form onSubmit={addList} className="w-72 shrink-0 bg-board rounded-xl p-2.5">
                <input
                  autoFocus
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  placeholder="List name…"
                  className="w-full bg-white rounded-lg px-3 py-2 text-sm outline-none ring-1 ring-line focus:ring-accent"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    type="submit"
                    className="bg-accent text-white text-xs font-medium px-3 py-1.5 rounded-lg"
                  >
                    Add list
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddingList(false)}
                    className="text-muted text-xs px-2"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setAddingList(true)}
                className="w-72 shrink-0 text-left text-white/70 hover:bg-white/10 text-sm px-3 py-2.5 rounded-xl transition-colors"
              >
                + Add another list
              </button>
            )}
          </div>

          <DragOverlay>
            {activeCard ? (
              <div className="w-72">
                <Card card={activeCard} onOpen={() => {}} />
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
