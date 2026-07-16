-- Flowboard Database Setup
-- Phase 1: Workspaces > Boards > Lists > Cards

create extension if not exists "uuid-ossp";

-- =========================
-- BOARDS
-- =========================

create table if not exists public.boards (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  color text not null default '#3D7BFF',
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- =========================
-- LISTS
-- =========================

create table if not exists public.lists (
  id uuid primary key default uuid_generate_v4(),
  board_id uuid not null 
    references public.boards(id) 
    on delete cascade,

  title text not null,
  position integer default 0,
  created_at timestamptz default now()
);

-- =========================
-- CARDS
-- =========================

create table if not exists public.cards (
  id uuid primary key default uuid_generate_v4(),

  list_id uuid not null
    references public.lists(id)
    on delete cascade,

  title text not null,
  description text default '',
  position integer default 0,

  due_date timestamptz,

  created_by uuid references auth.users(id),

  created_at timestamptz default now()
);

-- =========================
-- ENABLE SECURITY
-- =========================

alter table public.boards enable row level security;
alter table public.lists enable row level security;
alter table public.cards enable row level security;

-- =========================
-- REMOVE OLD POLICIES
-- =========================

drop policy if exists "boards_select" on public.boards;
drop policy if exists "boards_insert" on public.boards;
drop policy if exists "boards_update" on public.boards;
drop policy if exists "boards_delete" on public.boards;

drop policy if exists "lists_select" on public.lists;
drop policy if exists "lists_insert" on public.lists;
drop policy if exists "lists_update" on public.lists;
drop policy if exists "lists_delete" on public.lists;

drop policy if exists "cards_select" on public.cards;
drop policy if exists "cards_insert" on public.cards;
drop policy if exists "cards_update" on public.cards;
drop policy if exists "cards_delete" on public.cards;

-- =========================
-- BOARD POLICIES
-- =========================

create policy "boards_select"
on public.boards
for select
using (auth.role() = 'authenticated');

create policy "boards_insert"
on public.boards
for insert
with check (auth.role() = 'authenticated');

create policy "boards_update"
on public.boards
for update
using (auth.role() = 'authenticated');

create policy "boards_delete"
on public.boards
for delete
using (auth.role() = 'authenticated');

-- =========================
-- LIST POLICIES
-- =========================

create policy "lists_select"
on public.lists
for select
using (auth.role() = 'authenticated');

create policy "lists_insert"
on public.lists
for insert
with check (auth.role() = 'authenticated');

create policy "lists_update"
on public.lists
for update
using (auth.role() = 'authenticated');

create policy "lists_delete"
on public.lists
for delete
using (auth.role() = 'authenticated');

-- =========================
-- CARD POLICIES
-- =========================

create policy "cards_select"
on public.cards
for select
using (auth.role() = 'authenticated');

create policy "cards_insert"
on public.cards
for insert
with check (auth.role() = 'authenticated');

create policy "cards_update"
on public.cards
for update
using (auth.role() = 'authenticated');

create policy "cards_delete"
on public.cards
for delete
using (auth.role() = 'authenticated');

-- =========================
-- REALTIME
-- =========================

alter publication supabase_realtime add table public.boards;
alter publication supabase_realtime add table public.lists;
alter publication supabase_realtime add table public.cards;

-- Refresh Supabase API schema cache
notify pgrst, 'reload schema';