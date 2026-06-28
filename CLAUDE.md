# CLAUDE.md

See **AGENTS.md** for project context, engineering posture (prefer simplicity
over robustness — trade safeguards for fewer, clearer lines; don't
over-engineer), task completion steps, and UI conventions. All of it applies.

This file only adds what AGENTS.md doesn't cover.

## Commands

Package manager is **pnpm**.

- `pnpm dev` — Next.js dev server
- `pnpm build` — production build
- `pnpm lint` / `pnpm format` — eslint + prettier (run after every task)
- `npx tsc --noEmit` — typecheck; the quick way to verify a change (there is no test suite)

## Architecture

Next.js (App Router), **no ORM** — plain SQL via `query`/`execute` from `@/lib/db`.
Dual database: MariaDB for relational data, MongoDB for alert documents.

- Business logic lives in `lib/domain/` (imported via the `@/lib/domain` barrel).
- `lib/schema/` = Zod 4 schemas validating **input**; `lib/types.ts` = types for
  DB **output**. Keep both — a schema can't describe a query result.

## Conventions

- List functions return `{ data, total }`, building filters with
  `conditions[]`/`params[]` and a `Promise.all([dataQuery, countQuery])`.
- Throw plain `Error` for failures — domain logic is not HTTP-aware (HTTP
  status mapping belongs at the API boundary, not here). Classify DB errors with
  the `@/lib/db` error predicates rather than checking raw error codes.
