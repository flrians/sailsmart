@AGENTS.md

# SailSmart — Project Conventions

## Response Style (Token Efficiency)
- No preamble ("Sure!", "I'll help you...", "Let me...")
- No trailing task summaries — user reads the diff
- One sentence per tool-call update, nothing more
- Answer in 1-3 sentences unless complexity genuinely demands more
- If a file path is known, read it directly — skip exploration
- Prefer `grep`/`find` over spawning agents for simple lookups
- Default: no code comments; no docstrings

## Stack

- **Next.js 16.2.9** App Router (see AGENTS.md — breaking changes apply)
- **Supabase** for auth (SSR via `@supabase/ssr`) and database/RAG embeddings
- **Vercel AI SDK** (`ai`, `@ai-sdk/openai`, `@ai-sdk/react`) for chat streaming — not raw OpenAI SDK
- **OpenAI** raw SDK only for embeddings (`text-embedding-3-small`, 1536-dim)
- **Lucide React** for icons
- **CSS Modules** for component styles, global utility classes in `app/globals.css`

## Supabase Client Usage

- **Browser / Client Components**: `import { createClient } from '@/lib/supabase/client'`
- **Server Components / Route Handlers / Server Actions**: `import { createClient } from '@/lib/supabase/server'`

Never use the browser client in server code — it has no cookie access and auth will silently fail.

## Database Schema

Tables: `boat_types`, `profiles`, `manuals`, `manual_boat_types`, `manual_chunks` (vector 1536-dim).
RPC `match_manual_chunks(query_embedding, match_threshold, match_count, filter_boat_type_id)` for RAG similarity search.
Full schema → `scripts/schema.sql`.

**Multi-boat architecture**: Bavaria C50 is the only `available: true` boat type. New boat types can be added to `boat_types` without schema changes.

## Auth & Middleware

All routes are protected by `middleware.ts` via Supabase SSR. Public paths: `/login`, `/register`, `/verify-email`, `/auth/callback`.

**Never use `next/image`** — the Next.js image optimizer makes server-side requests without user cookies, which triggers an auth redirect loop. Use plain `<img>` tags instead.

API routes (e.g. `/api/c50-config/...`) are also auth-protected because the middleware matcher covers them. This is intentional — authenticated browser requests include cookies and work correctly.

## Serving Files Outside `public/`

The `Manuals/` folder at the project root stores PDFs and PNGs that are **not** in `public/`. Serve them via Route Handlers that read files with `fs/promises` `readFile`:

```ts
// app/api/c50-config/[id]/route.ts
const filePath = path.join(process.cwd(), 'Manuals', 'C50 Configurations', filename);
const data = await readFile(filePath);
return new NextResponse(data, { headers: { 'Content-Type': 'image/png' } });
```

Do not copy these files into `public/` — keep them in `Manuals/`.

## CSS Design System

See [`brand/style-guide.md`](brand/style-guide.md) for CSS variables, glass-panel utility, and font. Read it before any UI/styling work.

## UI Implementation Details

Portrait image rotation and PDF rendering patterns → see [`brand/style-guide.md`](brand/style-guide.md).

## Key File Locations

| Path | Purpose |
|---|---|
| `app/(app)/` | Authenticated app routes (Chat, My C50, Profile) |
| `app/(auth)/` | Auth pages (login, register, etc.) |
| `app/actions/` | Server Actions: `auth.ts`, `profile.ts`, `chat.ts` |
| `app/api/chat/` | Chat API route — RAG + Vercel AI SDK streaming |
| `app/api/c50-config/[id]/` | Route handler: serves C50 config PNGs from `Manuals/` |
| `lib/supabase/client.ts` | Supabase browser client |
| `lib/supabase/server.ts` | Supabase server client (SSR, cookies) |
| `lib/boat-specs.ts` | Bavaria C50 spec data and config variant list |
| `scripts/schema.sql` | Full DB schema + RPC definitions |
| `Manuals/` | PDFs and PNGs — served via route handlers, not `public/` |
| `brand/style-guide.md` | CSS variables, design tokens, UI patterns |
| `public/` | Only truly static assets (PDF viewer worker, etc.) |

## Git & GitHub

- **Never push automatically** after making changes
- Only push when the user explicitly runs `/push_github`
- Always create new commits rather than amending
