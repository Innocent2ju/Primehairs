# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev         # Start dev server (Turbopack)
pnpm build       # Production build
pnpm start       # Start production server
pnpm lint        # Run ESLint
pnpm test        # Run test suite before finishing any task
```

There is no test suite configured yet — add one before running `pnpm test`.

## Workflow

Always run `pnpm test` before considering a task complete.

## Architecture

**Next.js 16 App Router** project. All routes live under `app/` as `page.tsx` files — there is no `pages/` directory. Every component is a React Server Component by default; add `"use client"` only when browser APIs or interactivity are needed.

### Key conventions

- **Path alias:** `@/*` resolves to the project root. Use `@/app/components/Foo` instead of relative `../../` imports.
- **Styling:** Tailwind CSS v4 — no `tailwind.config.js`. Theme tokens (colors, fonts) are declared in `app/globals.css` via `@theme inline`. Do not create a separate Tailwind config file.
- **Fonts:** Geist Sans and Geist Mono are loaded in `app/layout.tsx` via `next/font/google` and exposed as CSS variables `--font-geist-sans` / `--font-geist-mono`, which Tailwind picks up through the theme block in `globals.css`.

### Planned backend (installed, not yet wired up)

- **Database:** Neon serverless Postgres via `@neondatabase/serverless`. Schema and migrations are managed with **Drizzle ORM** (`drizzle-orm` + `drizzle-kit`). Drizzle is the only ORM to use — do not introduce Prisma or raw SQL outside of Drizzle. Schema files and `drizzle.config.ts` still need to be created; schema goes in `db/schema.ts` by convention, migrations in `db/migrations/`.
- **Auth:** `better-auth` is installed. Auth routes (e.g. `app/api/auth/[...all]/route.ts`) and session handling still need to be set up.

### Pages to build

- `/cart` — linked in `Navbar.tsx` but the route does not exist yet.
- `/products` — placeholder; needs a product grid backed by Neon DB.
