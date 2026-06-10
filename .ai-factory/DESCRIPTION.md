# Calendar App

## Overview

A single-user calendar application for tracking time-spanning entries across named
"elements" (locations/resources). Users view a monthly calendar grid and create,
edit, and delete entries — each with a title, optional description, a mandatory
start and end date, and one or more assigned elements. Entries render as bars that
span every day between their start and end date. The UI is in German; the codebase
and tooling instructions are in English.

The app runs as a client-only SPA (Nuxt `ssr: false`) backed by a small server API
that talks to PostgreSQL. There is no authentication — it is intended for a single
user.

## Core Features

- Monthly calendar grid (custom 7-column CSS grid, week starts Monday)
- Create entries via a dialog form (title, description, start/end date, elements)
- Edit and delete existing entries
- Multi-day entries span every day in their date range
- Color-coded element tags (Magazzino, Colmata, Kuhstall)
- Server-side validation with German user-facing error messages
- Schema evolution via `node-pg-migrate` SQL migrations

## Tech Stack

- **Framework:** Nuxt 4 (SPA mode, `ssr: false`)
- **UI:** Vuetify 3 (auto-import via `vite-plugin-vuetify`, MDI icons, Nunito font)
- **Language:** TypeScript 5 (strict mode)
- **Database:** PostgreSQL via `pg` (lazy `Pool` from `server/utils/db.ts`)
- **Migrations:** `node-pg-migrate` (SQL files with `-- Up` / `-- Down` markers)
- **Linting:** ESLint 9 + `@nuxt/eslint` (`withNuxt()`) + typescript-eslint 8
- **Package manager:** pnpm

## Architecture Notes

- **Single table:** `calendar_entries` is the only table. No additional tables
  without explicit approval.
- **Data flow:** `pages/index.vue` fetches entries with `useFetch` and passes them
  down as props. `CalendarView.vue` is a pure display component. Dialogs
  (`AddEntryDialog.vue`, `EditEntryDialog.vue`) wrap the shared `EntryForm.vue` and
  emit on success; the page refetches.
- **Form state:** the `useEntryForm` composable centralizes reactive form state,
  reset, ISO-date conversion, and error-message extraction.
- **Database boundary:** all queries go through `getPool()` and live exclusively in
  `server/`. No ORM or query builder — parameterized SQL only.
- **Config:** the PostgreSQL connection string is read from
  `runtimeConfig.databaseUrl` (`NUXT_DATABASE_URL` / `DATABASE_URL` env var).

## Architecture

See `.ai-factory/ARCHITECTURE.md` for detailed architecture guidelines.
Pattern: Layered Architecture (presentation → server API → data access, adapted to
Nuxt conventions).

## Non-Functional Requirements

- **Type safety:** strict TypeScript; no `any` (except the established
  `vite-plugin-vuetify` cast in `nuxt.config.ts`), no `@ts-ignore`.
- **Validation:** required fields validated server-side with
  `createError({ statusCode: 400, message })`; `end_date` must not precede
  `start_date`; at least one element required.
- **Data integrity:** field changes are applied atomically across migration →
  types → API → components (see `CLAUDE.md`).
- **Security:** no secrets in the repo; `.env` holds the connection string and is
  never read, logged, or modified.

## Out of Scope

SSR, authentication/accounts, additional tables, external calendar integrations,
extra npm packages, test frameworks, Docker, and CI — none without explicit user
approval (see `CLAUDE.md`).
