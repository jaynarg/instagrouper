-- ============================================================
-- Instagrouper — Supabase schema (multi-workspace)
-- Fresh install: run the whole file.
-- Already have a table from before? Skip to the MIGRATION block at the bottom.
-- ============================================================

create table if not exists posts (
  id             uuid primary key default gen_random_uuid(),
  workspace      text not null,               -- which person's library this row belongs to
  fbid           text,                         -- IG id / URL shortcode (unique *per workspace*)
  url            text not null,
  caption        text,                         -- original IG caption, kept read-only
  owner_name     text,                         -- the Instagram account (not the workspace)
  owner_username text,
  saved_date     date,
  ts             bigint,
  category       text,
  content_type   text,
  tags           text[] default '{}',
  summary        text,
  edited         boolean default false,
  created_at     timestamptz default now(),
  unique (workspace, fbid)
);

create index if not exists posts_workspace_idx on posts (workspace);
create index if not exists posts_category_idx  on posts (category);
create index if not exists posts_tags_idx      on posts using gin (tags);
create extension if not exists pg_trgm;
create index if not exists posts_caption_idx   on posts using gin (caption gin_trgm_ops);

-- All reads and writes go through the API routes using the service_role key,
-- which bypasses RLS. The app scopes every query to a workspace itself.
alter table posts enable row level security;

-- ============================================================
-- MIGRATION — run THIS instead if your table already exists with data.
-- It adds the workspace column, stamps your existing rows as 'jay', swaps the
-- old global-unique-on-fbid for unique-per-workspace, and indexes workspace.
-- ============================================================
-- alter table posts add column if not exists workspace text;
-- update posts set workspace = 'jay' where workspace is null;
-- alter table posts alter column workspace set not null;
-- alter table posts drop constraint if exists posts_fbid_key;        -- old global unique
-- alter table posts add constraint posts_workspace_fbid_key unique (workspace, fbid);
-- create index if not exists posts_workspace_idx on posts (workspace);
