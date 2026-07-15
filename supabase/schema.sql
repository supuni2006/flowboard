-- Run this in the Supabase SQL editor to set up your database.
-- Phase 1 schema: workspaces > boards > lists > cards
-- Later phases (labels, checklists, comments, activity log) extend this file —
-- see the bottom section, commented out, ready to uncomment when you get there.

create extension if not exists "uuid-ossp";

create table if not exists boards (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  color text not null default '#3D7BFF',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists lists (
  id uuid primary key default uuid_generate_v4(),
  board_id uuid not null references boards(id) on delete cascade,
  title text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists cards (
  id uuid primary key default uuid_generate_v4(),
  list_id uuid not null references lists(id) on delete cascade,
  title text not null,
  description text default '',
  position integer not null default 0,
  due_date timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- Row Level Security: for Phase 1 we keep it open to any authenticated user
-- so your whole company can see all boards. Tighten this in Phase 3 when you
-- add per-board membership.
alter table boards enable row level security;
alter table lists enable row level security;
alter table cards enable row level security;

create policy "Authenticated users can read boards" on boards
  for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert boards" on boards
  for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update boards" on boards
  for update using (auth.role() = 'authenticated');
create policy "Authenticated users can delete boards" on boards
  for delete using (auth.role() = 'authenticated');

create policy "Authenticated users can read lists" on lists
  for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert lists" on lists
  for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update lists" on lists
  for update using (auth.role() = 'authenticated');
create policy "Authenticated users can delete lists" on lists
  for delete using (auth.role() = 'authenticated');

create policy "Authenticated users can read cards" on cards
  for select using (auth.role() = 'authenticated');
create policy "Authenticated users can insert cards" on cards
  for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update cards" on cards
  for update using (auth.role() = 'authenticated');
create policy "Authenticated users can delete cards" on cards
  for delete using (auth.role() = 'authenticated');

-- Enable Realtime so drag-and-drop updates sync live across users
alter publication supabase_realtime add table boards;
alter publication supabase_realtime add table lists;
alter publication supabase_realtime add table cards;

-- ============================================================
-- PHASE 2+ (uncomment when you get there — labels, checklists,
-- attachments, comments, members, activity log)
-- ============================================================

-- create table if not exists labels (
--   id uuid primary key default uuid_generate_v4(),
--   board_id uuid not null references boards(id) on delete cascade,
--   name text not null,
--   color text not null
-- );
--
-- create table if not exists card_labels (
--   card_id uuid references cards(id) on delete cascade,
--   label_id uuid references labels(id) on delete cascade,
--   primary key (card_id, label_id)
-- );
--
-- create table if not exists checklists (
--   id uuid primary key default uuid_generate_v4(),
--   card_id uuid not null references cards(id) on delete cascade,
--   title text not null default 'Checklist'
-- );
--
-- create table if not exists checklist_items (
--   id uuid primary key default uuid_generate_v4(),
--   checklist_id uuid not null references checklists(id) on delete cascade,
--   content text not null,
--   is_done boolean not null default false,
--   position integer not null default 0
-- );
--
-- create table if not exists comments (
--   id uuid primary key default uuid_generate_v4(),
--   card_id uuid not null references cards(id) on delete cascade,
--   author_id uuid references auth.users(id),
--   body text not null,
--   created_at timestamptz not null default now()
-- );
--
-- create table if not exists card_members (
--   card_id uuid references cards(id) on delete cascade,
--   user_id uuid references auth.users(id),
--   primary key (card_id, user_id)
-- );
--
-- create table if not exists activity_log (
--   id uuid primary key default uuid_generate_v4(),
--   board_id uuid references boards(id) on delete cascade,
--   user_id uuid references auth.users(id),
--   action text not null,
--   entity_type text not null,
--   entity_id uuid not null,
--   created_at timestamptz not null default now()
-- );
