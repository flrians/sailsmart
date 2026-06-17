-- Run this in your Supabase SQL Editor

-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create a table to store manual documents (optional, for metadata)
create table if not exists manuals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  filename text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create a table to store the text chunks and their embeddings
create table if not exists manual_chunks (
  id uuid primary key default gen_random_uuid(),
  manual_id uuid references manuals(id) on delete cascade,
  page_number integer not null,
  content text not null,
  embedding vector(1536) -- OpenAI text-embedding-3-small uses 1536 dimensions
);

-- Create an index to speed up vector similarity search
create index on manual_chunks using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Create a match function for the RPC call
create or replace function match_manual_chunks (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  manual_id uuid,
  page_number integer,
  content text,
  similarity float
)
language sql stable
as $$
  select
    manual_chunks.id,
    manual_chunks.manual_id,
    manual_chunks.page_number,
    manual_chunks.content,
    1 - (manual_chunks.embedding <=> query_embedding) as similarity
  from manual_chunks
  where 1 - (manual_chunks.embedding <=> query_embedding) > match_threshold
  order by manual_chunks.embedding <=> query_embedding
  limit match_count;
$$;
