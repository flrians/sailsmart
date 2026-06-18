-- Run this in your Supabase SQL Editor

-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Boat types available in the app
create table if not exists boat_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  available boolean not null default false
);

-- User profiles (linked to Supabase Auth users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  boat_type_id uuid references boat_types(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Manual documents (one per PDF — a boat type can have multiple manuals)
create table if not exists manuals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  filename text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Text chunks extracted from manuals, with vector embeddings for similarity search
create table if not exists manual_chunks (
  id uuid primary key default gen_random_uuid(),
  manual_id uuid references manuals(id) on delete cascade,
  boat_type_id uuid references boat_types(id),
  page_number integer not null,
  content text not null,
  embedding vector(1536) -- OpenAI text-embedding-3-small
);

-- Index to speed up vector similarity search
create index on manual_chunks using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- RPC for vector similarity search, filtered by boat type, returning source filename
-- Run this to create or update the function:
create or replace function match_manual_chunks (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_boat_type_id uuid default null
)
returns table (
  id uuid,
  manual_id uuid,
  page_number integer,
  content text,
  similarity float,
  filename text
)
language sql stable
as $$
  select
    mc.id,
    mc.manual_id,
    mc.page_number,
    mc.content,
    1 - (mc.embedding <=> query_embedding) as similarity,
    m.filename
  from manual_chunks mc
  join manuals m on m.id = mc.manual_id
  where
    (filter_boat_type_id is null or mc.boat_type_id = filter_boat_type_id)
    and 1 - (mc.embedding <=> query_embedding) > match_threshold
  order by mc.embedding <=> query_embedding
  limit match_count;
$$;
