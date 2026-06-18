-- ============================================================
-- Instagrouper — Supabase schema
-- Run in your Supabase project: SQL Editor -> New query -> Run.
-- (If you already created the table earlier, just run the ALTER at the bottom.)
-- ============================================================

create table if not exists posts (
  id             uuid primary key default gen_random_uuid(),
  fbid           text unique,                -- Instagram id / URL shortcode; used to dedupe
  url            text not null,
  caption        text,                       -- original IG caption, kept read-only
  owner_name     text,
  owner_username text,
  saved_date     date,
  ts             bigint,
  category       text,
  content_type   text,
  tags           text[] default '{}',
  summary        text,                        -- AI first pass + your manual edits
  edited         boolean default false,       -- true once you hand-edit a post
  created_at     timestamptz default now()
);

create index if not exists posts_category_idx on posts (category);
create index if not exists posts_tags_idx     on posts using gin (tags);
create extension if not exists pg_trgm;
create index if not exists posts_caption_idx  on posts using gin (caption gin_trgm_ops);

-- Row Level Security: all reads and writes go through the API routes using the
-- service_role key (which bypasses RLS), so the browser never holds a DB key.
-- Enabling RLS with no anon policy means the anon key can't touch the table at all.
alter table posts enable row level security;

-- ------------------------------------------------------------
-- Already have the table from an earlier step? Just add the new column:
-- ------------------------------------------------------------
alter table posts add column if not exists edited boolean default false;
