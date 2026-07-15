# Flowboard — Phase 1

A working Trello-style board: boards → lists → cards, with drag-and-drop
reordering and live sync across teammates. This is the foundation you'll
build the rest of the features on top of.

## What's included

- Create boards, lists, and cards
- Drag-and-drop reordering (cards within/between lists, via `@dnd-kit`)
- Card details: description, due date
- Real-time sync — when a teammate moves a card, you see it update live
- Clean data model ready to extend (see `supabase/schema.sql`)

## Setup (15 minutes)

### 1. Create a Supabase project
Go to [supabase.com](https://supabase.com), create a free project.

### 2. Run the database schema
In your Supabase project, open the **SQL Editor** and paste the contents of
`supabase/schema.sql`, then run it. This creates the `boards`, `lists`, and
`cards` tables with row-level security and realtime enabled.

### 3. Turn on email auth (or your preferred provider)
In Supabase: **Authentication → Providers**, enable Email. You'll need a
simple login page for teammates to sign in — that's the first thing to add
in Phase 3 below. For now, you can test as a single authenticated user via
the Supabase dashboard's **Authentication → Users → Add user**, and grab a
session by signing in through Supabase's hosted auth UI or your own login
form.

### 4. Configure environment variables
```bash
cp .env.local.example .env.local
```
Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from
**Project Settings → API** in Supabase.

### 5. Install and run
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

## Deploying for your company

The fastest path: push this to a GitHub repo, then import it in
[Vercel](https://vercel.com) (free tier is fine to start). Add the same two
environment variables in the Vercel project settings. Every push to `main`
auto-deploys.

## Roadmap — where to go from here

This ships Phase 1 of the plan. Next up:

**Phase 2 — Card details**
- Labels (colored tags) — new `labels` + `card_labels` tables (already
  drafted, commented out, at the bottom of `schema.sql`)
- Checklists — `checklists` + `checklist_items` tables (also drafted)
- File attachments — use Supabase Storage, attach a `storage_path` column
  to a new `attachments` table

**Phase 3 — Collaboration**
- Proper login/signup page using `supabase.auth.signInWithPassword` /
  `signUp`
- Board membership — who can see/edit which boards (tighten the RLS
  policies in `schema.sql` beyond "any authenticated user")
- Comments on cards (`comments` table, drafted)
- Assign members to cards (`card_members` table, drafted)
- Activity log per board (`activity_log` table, drafted)
- In-app + email notifications (Supabase Edge Functions + Resend/Postmark)

**Phase 4 — Search & polish**
- Global search across cards
- Filter by label/member/due date
- Keyboard shortcuts (`n` for new card, etc.)

**Phase 5 — Automation & power-ups**
- Rule-based automation ("when a card enters Done, archive it in 3 days")
- Slack/calendar integrations
- Board templates

Each phase builds on this codebase directly — the data model in
`types/index.ts` and `supabase/schema.sql` was designed to extend cleanly
rather than needing a rewrite.

## Project structure

```
app/
  page.tsx              → dashboard (list of boards)
  board/[id]/page.tsx    → board view (drag-and-drop lives here)
  layout.tsx, globals.css
components/
  List.tsx               → a column of cards
  Card.tsx                → a single draggable card
  CardModal.tsx           → card detail editor
lib/supabase.ts          → Supabase client
types/index.ts            → shared TypeScript types
supabase/schema.sql       → full database schema + RLS policies
```
hi