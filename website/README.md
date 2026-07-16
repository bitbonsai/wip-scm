# wip-scm.org

RFC-stage landing page for wip. Shibumi stack: Bun, Hono, Zod, Drizzle, SQLite, Alpine.

## Run

```sh
bun install
bun dev        # http://localhost:9010
```

## Structure

- `src/index.ts` Hono server: serves `public/`, `POST /api/notify` stores signup emails.
- `src/db.ts` Drizzle schema + bun:sqlite, writes `data.db` (gitignored).
- `public/index.html` the whole page. Copy sources: `../onepager.md`.
- `public/main.js` hero terminal animation + Alpine notify-form component. Loads before Alpine on purpose.
- `public/style.css` amber-phosphor RFC theme.

## Deploy

Needs a Bun runtime for the signup endpoint (Railway, Fly, a VPS). If deploying static-only (GitHub/Cloudflare Pages), swap the form for a hosted form endpoint and drop `src/`.
