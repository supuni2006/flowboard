'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Attachment, CardItem, CardStatus } from '@/types'

const STATUS_META: Record<CardStatus, { label: string; dot: string; badge: string }> = {
  upcoming: { label: 'Upcoming', dot: 'bg-sky-500', badge: 'bg-sky-100 text-sky-700' },
  ongoing: { label: 'Ongoing', dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700' },
  complete: { label: 'Complete', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Cancelled', dot: 'bg-red-500', badge: 'bg-red-100 text-red-700' },
  deleted: { label: 'Deleted', dot: 'bg-gray-400', badge: 'bg-gray-200 text-gray-600' },
}

const STATUS_ORDER: CardStatus[] = ['upcoming', 'ongoing', 'complete', 'cancelled', 'deleted']

const CARD_COLORS = ['#3D7BFF', '#FFB020', '#2BB673', '#E5484D', '#8B5CF6', '#0EA5E9']

const BUCKET = 'card-attachments'

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
  const [dueDate, setDueDate] = useState(card.due_date ? card.due_date.slice(0, 10) : '')
  const [status, setStatus] = useState<CardStatus>(card.status ?? 'upcoming')
  const [color, setColor] = useState<string | null>(card.color)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [coverUrl, setCoverUrl] = useState<string | null>(card.cover_url ?? null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  useEffect(() => {
    loadAttachments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id])

  async function loadAttachments() {
    const { data, error } = await supabase
      .from('attachments')
      .select('*')
      .eq('card_id', card.id)
      .order('created_at', { ascending: true })

    if (!error) setAttachments((data as Attachment[]) || [])
  }

  const ACCEPTED_TYPES = [
    'image/',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
  ]
  const MAX_FILE_BYTES = 15 * 1024 * 1024 // 15MB

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const isAccepted = ACCEPTED_TYPES.some((t) => file.type.startsWith(t))
    if (!isAccepted) {
      setUploadError('That file type isn\'t supported. Try an image, PDF, Word, Excel, PowerPoint, or text file.')
      e.target.value = ''
      return
    }

    if (file.size > MAX_FILE_BYTES) {
      setUploadError('File is too large. Max size is 15MB.')
      e.target.value = ''
      return
    }

    setUploading(true)
    setUploadError(null)

    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
    const path = `${card.id}/${crypto.randomUUID()}-${safeName}`

    const { error: storageError } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

    if (storageError) {
      setUploadError(storageError.message)
      setUploading(false)
      e.target.value = ''
      return
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)

    const { data, error: insertError } = await supabase
      .from('attachments')
      .insert({
        card_id: card.id,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_path: path,
        file_size: file.size,
        file_type: file.type,
      })
      .select()
      .single()

    if (insertError) {
      setUploadError(insertError.message)
      await supabase.storage.from(BUCKET).remove([path])
    } else if (data) {
      setAttachments((prev) => [...prev, data as Attachment])
      if (file.type.startsWith('image/')) {
        setCoverUrl(urlData.publicUrl)
        onSave(card.id, { cover_url: urlData.publicUrl })
      }
    }

    setUploading(false)
    e.target.value = ''
  }

  function isImageAttachment(att: Attachment) {
    return (att.file_type ?? '').startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(att.file_name)
  }

  function toggleCover(att: Attachment) {
    const next = coverUrl === att.file_url ? null : att.file_url
    setCoverUrl(next)
    onSave(card.id, { cover_url: next })
  }

  async function removeAttachment(att: Attachment) {
    setAttachments((prev) => prev.filter((a) => a.id !== att.id))
    if (coverUrl === att.file_url) {
      setCoverUrl(null)
      onSave(card.id, { cover_url: null })
    }
    await supabase.storage.from(BUCKET).remove([att.file_path])
    await supabase.from('attachments').delete().eq('id', att.id)
  }

  function save() {
    onSave(card.id, {
      title: title.trim() || card.title,
      description,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      status,
      color,
      cover_url: coverUrl,
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
        className="bg-surface rounded-xl w-full max-w-lg shadow-2xl animate-modal-in overflow-hidden max-h-[90vh] flex flex-col"
      >
        {color && <div className="h-1.5 shrink-0" style={{ backgroundColor: color }} />}

        <div className="flex items-start justify-between px-4 sm:px-6 pt-5 sm:pt-6 shrink-0">
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

        <div className="px-4 sm:px-6 pb-6 pt-2 overflow-y-auto">
          {/* STATUS */}
          <label className="flex items-center gap-1.5 text-xs font-medium text-muted uppercase tracking-wide mb-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Status
          </label>
          <div className="flex flex-wrap gap-1.5 mb-5">
            {STATUS_ORDER.map((s) => {
              const meta = STATUS_META[s]
              const active = status === s
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${
                    active
                      ? `${meta.badge} border-transparent ring-2 ring-offset-1 ring-accent/40`
                      : 'bg-board text-muted border-line hover:bg-black/5'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                  {meta.label}
                </button>
              )
            })}
          </div>

          {/* COLOR */}
          <label className="flex items-center gap-1.5 text-xs font-medium text-muted uppercase tracking-wide mb-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
            </svg>
            Card color
          </label>
          <div className="flex items-center gap-2 mb-5">
            <button
              type="button"
              onClick={() => setColor(null)}
              aria-label="No color"
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] text-muted ${
                color === null ? 'border-accent' : 'border-line'
              } bg-board`}
            >
              ✕
            </button>
            {CARD_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`Set color ${c}`}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${
                  color === c ? 'border-accent scale-110' : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          {/* DESCRIPTION */}
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

          {/* DUE DATE */}
          <label className="flex items-center gap-1.5 text-xs font-medium text-muted uppercase tracking-wide mb-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M3 9h18M8 2v4M16 2v4" strokeLinecap="round" />
            </svg>
            Due date
          </label>
          <div className="flex items-center gap-2 mb-5">
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

          {/* ATTACHMENTS */}
          <label className="flex items-center gap-1.5 text-xs font-medium text-muted uppercase tracking-wide mb-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7M17 8l-5-5-5 5M12 3v13" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Attachments
          </label>

          <div className="flex flex-wrap gap-2 mb-2">
            {attachments.map((att) => {
              const isImage = isImageAttachment(att)
              const isCover = isImage && coverUrl === att.file_url
              return (
                <div
                  key={att.id}
                  className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-board group/att ${
                    isCover ? 'ring-2 ring-accent' : ''
                  }`}
                >
                  {isImage ? (
                    <img
                      src={att.file_url}
                      alt={att.file_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <a
                      href={att.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full h-full flex flex-col items-center justify-center gap-1 px-1 text-muted hover:bg-black/5 transition-colors"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-[9px] leading-tight text-center line-clamp-2 break-all">
                        {att.file_name}
                      </span>
                    </a>
                  )}

                  {isImage && (
                    <button
                      type="button"
                      onClick={() => toggleCover(att)}
                      title={isCover ? 'Remove as cover' : 'Set as cover'}
                      className={`absolute bottom-1 left-1 w-5 h-5 rounded-full flex items-center justify-center transition-opacity ${
                        isCover
                          ? 'bg-accent text-white opacity-100'
                          : 'bg-black/60 text-white opacity-100 sm:opacity-0 sm:group-hover/att:opacity-100'
                      }`}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <rect x="3" y="5" width="18" height="14" rx="2" />
                        <circle cx="8.5" cy="10.5" r="1.5" fill="currentColor" stroke="none" />
                        <path d="M21 15l-5-5-6 6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => removeAttachment(att)}
                    aria-label={`Remove ${att.file_name}`}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-[10px] flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover/att:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                </div>
              )
            })}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg border-2 border-dashed border-line hover:border-accent hover:bg-black/5 flex flex-col items-center justify-center text-muted transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <span className="text-[10px]">Uploading…</span>
              ) : (
                <>
                  <span className="text-lg leading-none">+</span>
                  <span className="text-[10px] mt-0.5">Add file</span>
                </>
              )}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {coverUrl && (
            <p className="text-[11px] text-muted mb-2 flex items-center gap-1">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="5" width="18" height="14" rx="2" />
              </svg>
              Cover image set —
              <button
                type="button"
                onClick={() => {
                  setCoverUrl(null)
                  onSave(card.id, { cover_url: null })
                }}
                className="text-accent hover:underline"
              >
                remove
              </button>
            </p>
          )}

          {uploadError && (
            <p className="text-[11px] text-red-600 mb-2">{uploadError}</p>
          )}

          {createdLabel && (
            <p className="text-[11px] text-muted/70 mt-3">Created {createdLabel}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-3 sm:py-4 border-t border-line bg-board/50 shrink-0">
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