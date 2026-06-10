# Architecture: Layered Architecture

## Overview

This project is a single-user CRUD calendar app, so it uses a **Layered
Architecture** — the simplest pattern that still separates concerns cleanly. Rather
than inventing a generic `controllers/services/repositories` tree, the layers map
directly onto the conventions Nuxt already provides: a client presentation layer
(pages, components, composables) talks over HTTP to a thin server API layer
(Nitro route handlers), which performs validation and delegates all persistence to
a single data-access boundary (`getPool()` + parameterized SQL against PostgreSQL).

Each layer depends only on the layer "below" it. The browser never reaches the
database directly — it goes through the HTTP API; the API never embeds UI concerns;
and database access is confined to `server/`. This keeps the app easy to reason
about and matches what the code already does today.

## Decision Rationale

- **Project type:** single-user CRUD calendar (view month grid; create/edit/delete
  multi-day entries) — see `.ai-factory/DESCRIPTION.md`.
- **Tech stack:** TypeScript 5 (strict), Nuxt 4 SPA, Vuetify 3, PostgreSQL via
  `pg`, `node-pg-migrate`.
- **Key factor:** one table (`calendar_entries`), low domain complexity, a single
  developer, and a small server API. The decision matrix points to Layered
  Architecture for simple CRUD; heavier patterns would add ceremony without value.

## Folder Structure

The structure below extends the project's existing layout — it does not replace it.
Layer responsibilities are annotated.

```text
calendar-app/
├── app.vue                       # Presentation — root layout (v-app, app bar, NuxtPage)
│
│  ── PRESENTATION LAYER (client, browser) ──
├── pages/
│   └── index.vue                 # Route + data orchestration; fetches via useFetch, owns dialog state
├── components/
│   ├── CalendarView.vue          # Pure display (props in, no fetching, no emits)
│   ├── AddEntryDialog.vue        # Create dialog (wraps EntryForm, emits on success)
│   ├── EditEntryDialog.vue       # Edit/delete dialog (wraps EntryForm)
│   └── EntryForm.vue             # Shared form fields + client-side validation (defineModel)
├── composables/
│   └── useEntryForm.ts           # Reusable reactive form state, reset, ISO-date, error extraction
├── constants/
│   └── elements.ts               # Static UI data (element options + colors)
├── plugins/
│   └── vuetify.ts                # Vuetify registration (theme, icons, date adapter)
├── styles/
│   └── settings.scss             # Vuetify SCSS settings
│
│  ── TRANSPORT / API LAYER (server, Nitro) ──
├── server/
│   ├── api/entries/
│   │   ├── index.get.ts          # GET    /api/entries        — list, ordered by start_date
│   │   ├── index.post.ts         # POST   /api/entries        — validate + insert
│   │   ├── [id].put.ts           # PUT    /api/entries/:id     — validate + update
│   │   └── [id].delete.ts        # DELETE /api/entries/:id     — delete
│   │
│   │  ── DATA-ACCESS LAYER (server only) ──
│   └── utils/
│       └── db.ts                 # getPool() — the single PostgreSQL access point
│
│  ── SHARED (cross-layer contracts) ──
├── types/
│   └── index.ts                  # CalendarEntry, CreateEntryPayload, ElementName
│
│  ── DATABASE SCHEMA ──
├── migrations/                   # node-pg-migrate SQL (immutable; up + down)
└── db/
    └── schema.sql                # Human-readable snapshot (reference only — never run)
```

## Dependency Rules

The dependency direction flows downward; nothing lower imports anything higher.

```text
pages  →  components / composables / constants
  │
  └── (HTTP over $fetch / useFetch)  →  server/api/*  →  server/utils/db.ts  →  PostgreSQL
```

- ✅ `pages/` fetches data and passes it down to `components/` as props.
- ✅ `server/api/*` handlers call `getPool()` for all persistence.
- ✅ Both client and server import shared shapes from `types/`.
- ✅ Client and server share validation *intent* (required title, mandatory
  `end_date ≥ start_date`, ≥1 element) — but the **server** is the source of truth.
- ❌ Components must not fetch data — only `pages/` does (via `useFetch`).
- ❌ The client must not touch the database — it goes through `/api/entries`.
- ❌ Database access must not appear outside `server/`; never bypass `getPool()`.
- ❌ Server handlers must not import Vue components, `composables/`, or `pages/`.

## Layer Communication

- **Presentation → API:** the page calls the Nitro endpoints with Nuxt's
  `useFetch`/`$fetch`. Dialogs emit a success event; the page refetches the list
  rather than mutating shared state in place.
- **API → Data access:** handlers obtain the pool with `getPool()` and run
  **parameterized** SQL (`$1`, `$2`, …). They follow the SELECT-after-INSERT or
  `RETURNING *` pattern and return the row cast to a `types/index.ts` interface.
- **Shared contracts:** `types/index.ts` is the single source of truth for data
  shapes; `constants/elements.ts` holds shared static UI data. A field change is
  applied atomically across migration → types → API → components (see `CLAUDE.md`).

## Key Principles

1. **Thin handlers.** A server handler validates input, runs one or two queries,
   and returns a typed row. No UI logic, no cross-feature orchestration.
2. **Single data-access point.** All SQL goes through `getPool()` in
   `server/utils/db.ts`. No ORM, no query builder, no second connection path.
3. **Pure display components.** `CalendarView.vue` receives `entries` as a prop and
   emits nothing; data fetching lives only in `pages/`.
4. **Shared types as the contract.** Client and server agree on shapes via
   `types/index.ts`; DB column names (`snake_case`) are preserved in the interfaces.
5. **Schema lives in migrations.** `migrations/` is authoritative and immutable;
   `db/schema.sql` is only a readable snapshot.
6. **Server is the validation authority.** Client-side rules improve UX, but the
   API re-validates every required field and the date/element constraints.

## Code Examples

### Data-access layer — the single PostgreSQL access point

```typescript
// server/utils/db.ts — every query goes through this pool.
import { Pool } from 'pg'

let pool: Pool | null = null

export function getPool(): Pool {
  if (!pool) {
    const config = useRuntimeConfig()
    pool = new Pool({ connectionString: config.databaseUrl as string, max: 10 })
  }
  return pool
}
```

### Transport/API layer — thin handler: validate, query, return typed row

```typescript
// server/api/entries/index.post.ts
import { getPool } from '~/server/utils/db'
import type { CalendarEntry, CreateEntryPayload } from '~/types'

export default defineEventHandler(async (event): Promise<CalendarEntry> => {
  const body = await readBody<Partial<CreateEntryPayload>>(event)

  // Server is the validation authority.
  if (!body.title?.trim()) throw createError({ statusCode: 400, message: 'title is required' })
  if (!body.start_date)    throw createError({ statusCode: 400, message: 'start_date is required' })
  if (!body.end_date)      throw createError({ statusCode: 400, message: 'end_date is required' })
  if (body.end_date < body.start_date)
    throw createError({ statusCode: 400, message: 'end_date must not be before start_date' })
  if (!body.elements?.length)
    throw createError({ statusCode: 400, message: 'at least one element is required' })

  const pool = getPool()

  // Parameterized SQL + SELECT-after-INSERT, returned as a typed shape.
  const { rows } = await pool.query(
    `INSERT INTO calendar_entries (title, description, start_date, end_date, elements)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [body.title.trim(), body.description?.trim() || null, body.start_date, body.end_date, body.elements ?? []],
  )
  return rows[0] as CalendarEntry
})
```

### Presentation layer — page fetches, component displays

```vue
<!-- pages/index.vue — the ONLY place data is fetched -->
<script setup lang="ts">
import type { CalendarEntry } from '~/types'

const { data: entries, refresh } = await useFetch<CalendarEntry[]>('/api/entries')
</script>

<template>
  <!-- CalendarView is pure display: props in, nothing fetched here -->
  <CalendarView :entries="entries ?? []" />
  <AddEntryDialog @created="refresh" />
</template>
```

## Anti-Patterns

- ❌ **Fetching inside components.** Calling `useFetch`/`$fetch` from
  `CalendarView.vue` or a dialog instead of the page. Data fetching belongs in
  `pages/`; components receive props and emit events.
- ❌ **Bypassing the data-access layer.** Creating a second `pg` Pool, or running
  queries from anywhere other than via `getPool()`.
- ❌ **Database code outside `server/`.** Importing `pg` or building SQL in
  `components/`, `composables/`, or `pages/`.
- ❌ **Fat handlers.** Putting view/formatting concerns or multi-feature
  orchestration into a route handler — keep handlers thin.
- ❌ **String-interpolated SQL.** Concatenating user input into a query instead of
  using parameter placeholders (`$1`, `$2`, …).
- ❌ **Trusting the client.** Relying only on `EntryForm.vue` validation and
  skipping the server-side checks.
- ❌ **Drifting layers.** Changing a field in one layer (migration, types, API, or
  components) without updating the others in the same change.
```
