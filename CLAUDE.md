@AGENTS.md

# SailSmart — Project Conventions

## Stack

- **Next.js 16.2.9** App Router (see AGENTS.md — breaking changes apply)
- **Supabase** for auth (SSR via `@supabase/ssr`) and database/RAG embeddings
- **OpenAI** for chat and embeddings (`text-embedding-3-small`, 1536-dim)
- **Lucide React** for icons
- **CSS Modules** for component styles, global utility classes in `app/globals.css`

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

Global CSS variables (defined in `app/globals.css`):

```css
--bg-primary: #FFFFFF
--bg-secondary: #F0F8FF
--text-primary: #003366        /* Deep Sea Blue */
--text-secondary: #4A90E2      /* Mediterranean Blue */
--accent-blue: #0077BE         /* Ocean Blue */
--accent-light: #E0F2FE
--border-light: rgba(0,119,190,0.15)
--shadow-subtle: 0 4px 20px rgba(0,51,102,0.08)
--radius-lg: 16px
--radius-full: 9999px
--transition-fast: 0.2s cubic-bezier(0.4,0,0.2,1)
```

Global utility class for cards/panels:

```css
.glass-panel {
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-subtle);
}
```

Font: `Outfit` (Google Fonts), weights 300–700.

## Portrait Image Rotation (C50 Configurations)

Configuration PNGs are 2410×908 landscape. To display them as portrait (bow at top) without modifying source files, use this CSS trick:

```css
/* Wrapper: declare the portrait aspect ratio */
.imageWrap {
  width: 100%;
  aspect-ratio: 908 / 2410;
  position: relative;
  overflow: hidden;
}

/* Image: wider than container, rotated 90° CCW */
.image {
  width: 265.6%;
  height: auto;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-90deg);
}
```

This is used in both `my-c50/page.module.css` (selected config display) and `my-c50/ConfigSelector.module.css` (grid thumbnails).

## PDF Rendering (PdfPageModal)

PDFs are rendered via `pdfjs-dist`. To get sharp output at native zoom, oversample 3× and cap at 5000px wide:

```js
const naturalWidth = pdfPage.getViewport({ scale: 1 }).width;
const scale = Math.min((width / naturalWidth) * 3, 5000 / naturalWidth);
```

The canvas is rendered at 3× size; the browser's CSS downscale makes it appear sharp. Full-screen mode uses `window.innerWidth - 32` (no 800px cap).

## Key File Locations

| Path | Purpose |
|---|---|
| `app/(app)/` | Authenticated app routes (Chat, My C50, Profile) |
| `app/(auth)/` | Auth pages (login, register, etc.) |
| `app/api/c50-config/[id]/` | Route handler: serves C50 config PNGs from `Manuals/` |
| `app/api/chat/` | Chat API route (RAG + OpenAI) |
| `lib/boat-specs.ts` | Bavaria C50 spec data and config variant list |
| `Manuals/` | PDFs and PNGs — served via route handlers, not `public/` |
| `public/` | Only truly static assets (PDF viewer worker, etc.) |

## Git & GitHub

- **Never push automatically** after making changes
- Only push when the user explicitly runs `/push_github`
- Always create new commits rather than amending
