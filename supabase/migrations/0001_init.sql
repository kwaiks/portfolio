-- portfolio-web schema: RAG corpus (pgvector) + contact log + metadata-only AI analytics.
-- Apply in the Supabase SQL editor (or `supabase db push`). Idempotent.

-- ── pgvector ───────────────────────────────────────────────────
create extension if not exists vector;

-- ── Documents (RAG corpus) ──────────────────────────────────────
create table if not exists public.documents (
  id            text primary key,                          -- md5(source || ':' || chunk_index)
  source        text not null,                             -- e.g. 'experience/wilopo-cargo'
  section       text not null default '',                  -- heading/section label
  chunk_index   int  not null default 0,
  content       text not null,
  metadata      jsonb not null default '{}'::jsonb,
  tsv           tsvector generated always as (to_tsvector('english', content)) stored,
  embedding     vector(1536),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists documents_tsv_idx        on public.documents using gin (tsv);
create index if not exists documents_embedding_idx  on public.documents using hnsw (embedding vector_cosine_ops);
create index if not exists documents_source_idx     on public.documents (source);

-- ── Hybrid retrieval: semantic + keyword, fused via Reciprocal Rank Fusion ──
create or replace function public.match_documents_hybrid(
  p_query_text      text,
  p_query_embedding vector(1536),
  p_k               int  default 20,
  p_match_count     int  default 5
)
returns table (
  id                text,
  source            text,
  section           text,
  content           text,
  metadata          jsonb,
  rrf_score         float,
  semantic_distance float,
  keyword_rank      int
)
language sql
stable
as $$
  with semantic as (
    select id,
           embedding <=> p_query_embedding as dist,
           row_number() over (order by embedding <=> p_query_embedding) as rn
    from public.documents
    where embedding is not null
    order by embedding <=> p_query_embedding
    limit p_k
  ),
  keyword as (
    select id,
           row_number() over (
             order by ts_rank(tsv, websearch_to_tsquery('english', p_query_text)) desc
           ) as rn
    from public.documents
    where tsv @@ websearch_to_tsquery('english', p_query_text)
    order by ts_rank(tsv, websearch_to_tsquery('english', p_query_text)) desc
    limit p_k
  )
  select d.id,
         d.source,
         d.section,
         d.content,
         d.metadata,
         ( coalesce(1.0 / (60 + s.rn), 0.0) + coalesce(1.0 / (60 + k.rn), 0.0) ) as rrf_score,
         s.dist as semantic_distance,
         k.rn   as keyword_rank
  from public.documents d
  left join semantic s on s.id = d.id
  left join keyword  k on k.id = d.id
  where s.id is not null or k.id is not null
  order by rrf_score desc
  limit greatest(p_match_count, 1);
$$;

-- ── Contact submissions (the "who approached me" log) ──────────
create table if not exists public.contact_submissions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  message     text not null,
  status      text not null default 'new',
  created_at  timestamptz not null default now()
);
create index if not exists contact_submissions_created_idx
  on public.contact_submissions (created_at desc);

-- ── AI analytics: METADATA ONLY (no raw text / PII) ─────────────
create table if not exists public.ai_events (
  id           uuid primary key default gen_random_uuid(),
  session_hash text not null,           -- sha256(client session id), truncated
  theme        text not null,           -- coarse category, never raw query
  page         text,
  has_context  boolean,
  created_at   timestamptz not null default now()
);
create index if not exists ai_events_created_idx on public.ai_events (created_at desc);
create index if not exists ai_events_theme_idx   on public.ai_events (theme);

-- ── Row-Level Security ─────────────────────────────────────────
-- Server code uses the service role (bypasses RLS). RLS here locks down
-- direct anon/key access from any client.
alter table public.documents           enable row level security;
alter table public.contact_submissions enable row level security;
alter table public.ai_events           enable row level security;

-- Documents: public read-only (in case of future client-side reads).
drop policy if exists "documents public read" on public.documents;
create policy "documents public read"
  on public.documents for select
  using (true);

-- contact_submissions and ai_events: NO public policies → anon cannot
-- read or write; only the service role (server) can.
