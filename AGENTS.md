# AGENTS.md

## Project

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · mongoDB
Single-package app. Spanish-language community web app for UNETI student project.

## Commands

| Task       | Command          | Notes                                |
| ---------- | ---------------- | ------------------------------------ |
| Dev        | `npm run dev`    | Supports `--turbo` for Turbopack     |
| Build      | `npm run build`  |                                      |
| Lint       | `npm run lint`   | ESLint + next/core-web-vitals        |
| Typecheck  | `npx tsc --noEmit` | No npm script defined, run directly |

No test runner, formatter, or pre-commit hooks configured.

## Architecture

```
app/
  layout.tsx          # Root layout — NavBurger (header), NavBasic (nav), footer
  page.tsx            # Home page
  globals.css         # Tailwind v4 (@import "tailwindcss"), custom heroImage bg
  login/              # Separate layout + page (isolated from root layout)
  (purpose)/          # Route group — URL does NOT include "purpose"
    solicitudes/      # /solicitudes — create & look up benefit requests
    consultas/        # /consultas — check request status
  blog/page.tsx       # /blog
  acerca-de/page.tsx  # /acerca-de
  api/solicitudes/    # GET ?cedula= & POST new solicitud
  components/         # NavBurger.tsx, NavBasic.tsx
  lib/db.ts           # SQLite setup, schema, seed data
```

Path alias: `@/*` → `./*` (tsconfig.json)

## Database

- **File**: `comunidad_data.db` at **repo root** (not in `app/`)
- **Not in `.gitignore`** — the `.db` file is tracked by git
- **Tables**: `beneficiarios` (residents), `solicitudes` (requests)
- `initDB()` creates tables IF NOT EXISTS and seeds data only if tables are empty
- API routes call `initDB()` on every request — safe but redundant
- `export const runtime = "nodejs"` on API routes (required for better-sqlite3)
- Seed data uses Venezuelan cedulas (e.g. `"V-12345678"`)

## Key Conventions

- All UI text in Spanish
- Client components (`"use client"`) use inline `alert()` for errors, no toast lib
- `/* eslint-disable @typescript-eslint/no-explicit-any */` at top of files using `any`
- Tailwind v4 syntax: `@import "tailwindcss"` in globals.css, `@theme inline` for custom tokens
- Hero image at `/images/hero-image.jpg` (must exist in `public/`)

## Gotchas

- No test framework installed — do not run `npm test`
- No `prettier` or `biome` — code style is manual
- `comunidad_data.db` committed to repo; deleting it resets seed data on next API call
- Login route has its own `layout.tsx` and `globals.css` — isolated from root layout
