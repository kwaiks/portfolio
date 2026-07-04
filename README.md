# AI-powered portfolio (Alexander Jacquelline)

A single-page **Next.js 15** portfolio whose differentiator is a live, **retrieval-grounded AI assistant**. The assistant answers questions about my work using RAG over this site's own content, with guardrails (relevance gate + out-of-scope refusal) and a pre-ship **eval gate** (≥90% acceptable answers, 0 hallucinations).

## Stack
- **Next.js 15 (App Router) + React 19 + TypeScript + Tailwind**
- **Supabase Postgres + pgvector** — vector + full-text (hybrid) retrieval
- **OpenAI `text-embedding-3-small`** — embeddings (1536-dim)
- **DeepSeek** (OpenAI-compatible) — generation (flash tier, eval-gated)
- **Resend** — contact-form email (Reply-To = sender)

## Quickstart
```bash
pnpm install
cp .env.example .env.local      # then fill in your keys
pnpm dev                      # http://localhost:3000
```

## 1. Database (Supabase)
1. Create a Supabase project.
2. Open **SQL Editor** and run [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql). It creates the `vector` extension, the `documents` table (+ `match_documents_hybrid` RPC), `contact_submissions`, and metadata-only `ai_events`, with RLS.
3. Copy the project **URL**, **publishable** key, and **secret** key into `.env.local`.

## 2. Environment (`.env.local`)
```
NEXT_PUBLIC_SITE_URL=https://kwaiks.xyz     # canonical URL (metadata/OG)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...   # dashboard "publishable" key (formerly "anon")
SUPABASE_SECRET_KEY=...                    # server only (formerly "service_role")
DEEPSEEK_API_KEY=...
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-chat           # confirmed live; env-overridable
OPENAI_API_KEY=...
RESEND_API_KEY=...
CONTACT_EMAIL=alexanderjacq02@gmail.com
RESEND_FROM=onboarding@resend.dev    # verify a domain for prod
```

### DeepSeek model id
Default is `deepseek-chat` (confirmed live — the API accepts it). Verify reachability with:
```bash
pnpm check-model
```

## 3. Ingest content (embed + upsert)
Content lives in `content/**/*.md` (single source for both display and RAG). After any content change:
```bash
pnpm ingest
```

## 4. Run the eval gate (before shipping)
```bash
pnpm eval
```
Runs the golden set (`eval/golden.json`) through the full pipeline, scored by an LLM-as-judge. **Ship only when it prints `✅ PASS`** (≥90% acceptable, 0 hallucinations). Full report → `eval/last-run.json`. To tune, adjust the relevance threshold in `src/lib/ai/retrieve.ts` or the system prompt in `src/lib/ai/prompts.ts`.

## 5. Deploy (Vercel)
1. Push to GitHub; import into Vercel.
2. Add all env vars from `.env.local` in the Vercel dashboard (mark the Supabase **secret** key + API keys as **server-only**).
3. After the first deploy (or any content change), run `pnpm ingest` against the production Supabase project, then `pnpm eval` to confirm the gate passes live.
4. Add a custom domain (DNS) in Vercel.

## How the AI works (summary)
`content/*.md` → chunked + embedded (OpenAI) → stored in `documents` (pgvector + auto `tsvector`). At query time: embed question → `match_documents_hybrid` (semantic `<=>` + `ts_rank`, fused by Reciprocal Rank Fusion) → **relevance gate** (refuse if no relevant context) → DeepSeek generation at temperature 0, answer-only-from-context. Privacy: only metadata (session hash, theme, page) is logged — **never raw query text**. See the in-site "How this site's AI works" section.

## Project structure
```
content/            # markdown — single source (display + RAG)
supabase/migrations # 0001_init.sql
scripts/            # ingest.ts, eval.ts, check-model.ts (+ _env.ts)
eval/               # golden.json (+ last-run.json)
src/app/            # page.tsx (single page), api/{chat,contact}/route.ts
src/components/     # sections + assistant/AssistantWidget.tsx (floating)
src/lib/            # ai/{embed,retrieve,prompts,generate,guardrails,answer}, content, contact, analytics, config
```

## Notes
- The eval gate result is reported truthfully — do not ship below 90% / with any hallucination.
- Contact form is **persist-first**: the row is saved before email is attempted, so no message is lost if Resend fails.
