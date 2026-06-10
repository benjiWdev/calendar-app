# Agents Guide — Calendar App

This file defines the boundaries, conventions, and constraints for any AI agent working in this repository.

---

## Project Overview

A single-user calendar application built with Nuxt 4 (SPA), Vuetify 3, TypeScript, and PostgreSQL. Users view a monthly calendar grid and create, edit, and delete entries — each with a title, optional description, a mandatory start and end date, and one or more assigned elements. Entries render as bars spanning every day in their range. The UI is in German; the codebase and these instructions are in English.

---

## Stack

| Layer          | Technology                              |
|----------------|-----------------------------------------|
| Framework      | Nuxt 4 (SPA, `ssr: false`)              |
| UI             | Vuetify 3                               |
| Language       | TypeScript 5 (strict mode)              |
| Database       | PostgreSQL via `pg`                     |
| Migrations     | node-pg-migrate                         |
| Icons          | MDI (`@mdi/font`)                       |
| Fonts          | Nunito (Fontsource)                     |
| Linting        | ESLint 9 + typescript-eslint 8          |
| Package manager| pnpm                                    |

---

## File Structure

```
calendar-app/
├── app.vue                          # Root layout (v-app, v-app-bar, NuxtPage)
├── nuxt.config.ts                   # SPA mode, Vuetify vite plugin, runtimeConfig
├── tsconfig.json                    # Extends .nuxt/tsconfig.json, strict: true
├── eslint.config.mjs                # withNuxt() from .nuxt/eslint.config.mjs
├── package.json
├── db/
│   └── schema.sql                   # Human-readable reference only — superseded by migrations/
├── migrations/                      # node-pg-migrate SQL files (immutable; up + down)
│   ├── 1700000000000_initial_schema.sql
│   ├── 1700000000001_add_elements.sql
│   └── 1700000000002_end_date_mandatory_check.sql
├── types/
│   └── index.ts                     # Shared interfaces (CalendarEntry, CreateEntryPayload, ElementName)
├── constants/
│   └── elements.ts                  # ELEMENT_OPTIONS + ELEMENT_COLORS
├── composables/
│   ├── useEntryForm.ts              # Reactive form state, reset, ISO-date, error helpers
│   └── useMonthBookingSummary.ts    # Pure helper: distinct booked days per element per month
├── plugins/
│   └── vuetify.ts                   # Vuetify init: components, MDI icons, date adapter, light theme
├── styles/
│   └── settings.scss                # Vuetify SCSS settings entry point
├── pages/
│   └── index.vue                    # Fetches entries (useFetch), renders CalendarView + dialogs
├── components/
│   ├── CalendarView.vue             # Pure-display 7-col CSS grid monthly calendar
│   ├── MonthOverviewBand.vue        # Pure-display 3-month booking overview band
│   ├── AddEntryDialog.vue           # v-dialog to create entries (wraps EntryForm)
│   ├── EditEntryDialog.vue          # v-dialog to edit/delete entries (wraps EntryForm)
│   └── EntryForm.vue                # Shared form fields + client-side validation (defineModel)
└── server/
    ├── utils/
    │   └── db.ts                    # Lazy pg Pool — call getPool()
    └── api/entries/
        ├── index.get.ts             # GET    /api/entries      — all entries ordered by start_date
        ├── index.post.ts            # POST   /api/entries      — validates + inserts a new entry
        ├── [id].put.ts              # PUT    /api/entries/:id  — validates + updates an entry
        └── [id].delete.ts           # DELETE /api/entries/:id  — deletes an entry
```

### Key Entry Points

| File | Purpose |
|------|---------|
| `app.vue` | Application root layout and app bar |
| `pages/index.vue` | Main (only) page; data fetching and dialog orchestration |
| `nuxt.config.ts` | SPA config, Vuetify plugin wiring, `runtimeConfig.databaseUrl` |
| `plugins/vuetify.ts` | Vuetify registration: theme, icons, date adapter |
| `types/index.ts` | Single source of truth for shared data shapes |
| `server/utils/db.ts` | PostgreSQL connection pool accessor (`getPool()`) |
| `migrations/` | Authoritative database schema (run with `pnpm migrate`) |

---

## Documentation

| Document | Path | Description |
|----------|------|-------------|
| README | `README.md` | Project landing page |
| Getting Started | `docs/getting-started.md` | Prerequisites, installation, running the app |
| Architecture | `docs/architecture.md` | Layered architecture and project structure |
| API Reference | `docs/api.md` | `/api/entries` endpoints, payloads, error codes |
| Database & Migrations | `docs/database.md` | Schema, node-pg-migrate workflow, configuration |

## AI Context Files

| File | Purpose |
|------|---------|
| CLAUDE.md | This file — authoritative agent constraints, conventions, and project map |
| .ai-factory/DESCRIPTION.md | Project intent, feature set, and stack rationale |
| .ai-factory/ARCHITECTURE.md | Architecture pattern, layers, and dependency rules |
| .ai-factory/config.yaml | AI Factory behavior config (language, paths, git) |
| .ai-factory/rules/base.md | Auto-detected project conventions |

> Note: AI Factory tooling may regenerate an `AGENTS.md` file in the project root.
> It is git-ignored and not the source of truth — this `CLAUDE.md` is.

## Agent Rules

- Decompose chained shell commands instead of combining them with `&&`:
  - Incorrect (combined): `git checkout main && git pull`
  - Correct (decomposed): first `git checkout main`, then `git pull origin main`
- Use **pnpm** exclusively — never `npm` or `yarn` (see Hard Constraints).
- Apply any data-model field change atomically across migration → types → API →
  components (see Conventions › Data model). Never edit an existing migration file.

---

## Hard Constraints

### Do not touch without explicit instruction
- `.env` — contains production secrets; never read, log, or modify
- `pnpm-lock.yaml` — never manually edit; only `pnpm install` may change it
- `.nuxt/` — generated at build time; never edit generated files directly
- `db/schema.sql` — reference only; never run it or treat it as authoritative
- `migrations/` — never manually edit an existing migration file; always create a new one

### Package manager
- Use **pnpm** exclusively. Never use `npm` or `yarn`.
- `pnpm.onlyBuiltDependencies` in `package.json` is intentional — do not remove entries from it.

### TypeScript
- Strict mode is enforced. All new code must be fully typed.
- Do not use `any` except where already established (the Vuetify plugin cast in `nuxt.config.ts`).
- Do not add `@ts-ignore` or `@ts-expect-error` — fix the underlying type issue instead.

### ESLint
- All code must pass `pnpm lint` cleanly.
- `prefer-const` is an error — never use `let` for variables that are never reassigned.
- `vue/multi-word-component-names` is disabled intentionally — do not re-enable it.

### Vuetify
- Use Vuetify components (`v-btn`, `v-text-field`, etc.) for all UI — do not introduce raw HTML form elements or a second UI library.
- Respect the existing theme colors defined in `plugins/vuetify.ts`. Do not add inline hex colors.
- Use MDI icon names (`mdi-*`) only — no other icon sets.

### Database
- PostgreSQL only. Do not introduce an ORM or query builder.
- All queries go through `getPool()` from `server/utils/db.ts`.
- Server-side only — database code lives exclusively in `server/`.
- The connection string is read from `runtimeConfig.databaseUrl` (`NUXT_DATABASE_URL` env var).

---

## Conventions

### Data model
- `types/index.ts` is the single source of truth for all TypeScript data shapes.
- **Any change to a field — add, remove, rename, or retype — must be applied atomically across the full stack in this order:**
  1. `migrations/` — create a new migration with `pnpm migrate:create <name>`; write the `-- Up Migration` and `-- Down Migration` SQL; also update `db/schema.sql` to keep it in sync as a reference
  2. `types/index.ts` — update the read interface and the write/payload interface
  3. `server/api/` — update every query, INSERT/UPDATE param list, and validation that touches the field
  4. `components/` and `pages/` — update every form field, v-model binding, prop, and display reference
- Never edit an existing migration file — migrations are immutable once created. All changes go in a new migration.
- Never leave any layer out of sync with the others. If a field is removed, delete every reference to it — do not leave dead code behind.

### API handlers
- Validate required fields server-side with `createError({ statusCode: 400, message: '...' })`.
- Trim string inputs; coerce empty strings to `null` for optional fields before inserting.
- Return the full typed response object after insert (SELECT after INSERT pattern), typed to the matching interface in `types/index.ts`.

### Components
- `CalendarView.vue` is a pure display component — it receives `entries` as a prop and emits nothing. Keep it that way.
- `AddEntryDialog.vue` uses `defineModel<boolean>` for dialog visibility and emits `created` on success.
- Do not fetch data inside components — data fetching belongs in `pages/index.vue` via `useFetch`.

### Styling
- Component-scoped styles only (`<style scoped>`).
- Use Vuetify spacing utilities (`pa-`, `ma-`, `mr-`, etc.) over custom CSS where possible.
- The global font family (Nunito) is set on `v-app` in `app.vue` — do not override it per-component.

---

## Out of Scope

Do not introduce any of the following without explicit user approval:

- Server-side rendering (SSR) — the app is SPA-only
- Authentication or user accounts
- Additional database tables beyond `calendar_entries`
- External API integrations (Google Calendar, etc.)
- Additional npm packages not already present
- Unit or e2e test frameworks
- Docker or containerisation config
- CI/CD pipeline files
- Additional Nuxt modules

---

## Environment Variables

| Variable           | Purpose                        | Required |
|--------------------|--------------------------------|----------|
| `NUXT_DATABASE_URL`| PostgreSQL connection string   | Yes      |

Format: `postgresql://user:password@host:port/database`

No other environment variables exist. Do not add new ones without updating `.env.example`.

---

## Running the Project

```bash
# Install dependencies
pnpm install

# Run all pending migrations (first-time setup and after schema changes)
pnpm migrate

# Start dev server
pnpm dev

# Lint
pnpm lint
pnpm lint:fix
```

## Database Migrations

Migrations live in `migrations/` and are managed by `node-pg-migrate`. They read `NUXT_DATABASE_URL` from `.env`.

```bash
# Apply all pending migrations
pnpm migrate

# Roll back the last migration
pnpm migrate:down

# Create a new SQL migration file (fill in up/down SQL after)
pnpm migrate:create <name>
```

Migration files use `-- Up Migration` and `-- Down Migration` comment markers to separate the two directions:

```sql
-- Up Migration
ALTER TABLE calendar_entries ADD COLUMN location VARCHAR(255);

-- Down Migration
ALTER TABLE calendar_entries DROP COLUMN location;
```

**Rules:**
- Never edit an existing migration file.
- Always write a `-- Down Migration` block so rollbacks work.
- Keep `db/schema.sql` updated as a human-readable snapshot of the current schema.
