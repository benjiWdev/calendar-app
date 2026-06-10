# Project Base Rules

> Auto-detected conventions from codebase analysis. Edit as needed.
> These complement the hard constraints in `CLAUDE.md` — when they conflict,
> `CLAUDE.md` wins.

## Naming Conventions

- **Files:**
  - Vue components: `PascalCase.vue` (`CalendarView.vue`, `EntryForm.vue`)
  - Composables: `camelCase.ts` with a `use` prefix (`useEntryForm.ts`)
  - Constants modules: `camelCase.ts` (`constants/elements.ts`)
  - Server API routes: Nitro file-routing convention
    (`index.get.ts`, `index.post.ts`, `[id].put.ts`, `[id].delete.ts`)
  - Migrations: `<timestamp>_<snake_case_name>.sql`
- **TypeScript:** interfaces and exported types in `PascalCase`
  (`CalendarEntry`, `CreateEntryPayload`, `ElementName`); functions and variables
  in `camelCase`; module-level constant data in `SCREAMING_SNAKE_CASE`
  (`ELEMENT_OPTIONS`, `ELEMENT_COLORS`).
- **Database columns:** `snake_case` (`start_date`, `end_date`, `created_at`).
  These names are preserved verbatim in the TypeScript read interfaces — do not
  camelCase DB fields when mapping rows to types.

## Module Structure

- `app.vue` — root layout (`v-app`, `v-app-bar`, `NuxtPage`)
- `pages/` — route components; the only place data is fetched (`useFetch`)
- `components/` — presentational components and dialogs; no data fetching
- `composables/` — shared reactive logic (`use*` functions)
- `constants/` — static config data (element options, colors)
- `plugins/` — Nuxt plugins (Vuetify registration)
- `types/` — single source of truth for shared data shapes (`types/index.ts`)
- `server/api/entries/` — Nitro HTTP handlers
- `server/utils/` — server-only helpers; DB access via `getPool()` only
- `migrations/` — immutable `node-pg-migrate` SQL files
- `db/schema.sql` — human-readable schema snapshot (reference only, never run)
- Use the `~` alias for intra-project imports (`~/types`, `~/server/utils/db`,
  `~/constants/elements`).

## Error Handling

- **Server:** validate required fields up front and throw
  `createError({ statusCode: 400, message: '...' })`; use `404` for missing
  records (`UPDATE ... RETURNING` with a `rowCount === 0` check). Messages are
  lowercase technical strings (e.g. `'title is required'`).
- **Client:** surface failures through `errorMsg` and the `extractErrorMessage`
  helper in `useEntryForm`; user-facing form validation messages are German
  (`'Titel ist erforderlich'`).
- Trim string inputs and coerce empty optional strings to `null` before insert.

## Database Access

- PostgreSQL only via `pg`. No ORM or query builder.
- All queries go through `getPool()` from `server/utils/db.ts`; DB code lives only
  in `server/`.
- Use parameterized queries (`$1`, `$2`, …) exclusively — never interpolate input
  into SQL strings.
- Follow the SELECT-after-INSERT (or `RETURNING *`) pattern and return the full
  typed row cast to the matching `types/index.ts` interface.

## Logging

- No logging library is in use. Do not introduce one without approval — rely on
  thrown `createError` for server-side failures.

## Testing

- No test framework is present and tests are out of scope per `CLAUDE.md`. Do not
  add one without explicit user approval.

## Style

- TypeScript strict mode; no `any` (except the established
  `vite-plugin-vuetify` cast in `nuxt.config.ts`), no `@ts-ignore` /
  `@ts-expect-error`.
- 2-space indentation. `prefer-const` is enforced — never `let` for values that are
  never reassigned.
- All code must pass `pnpm lint` cleanly.
- UI built exclusively with Vuetify components; theme colors come from
  `plugins/vuetify.ts` — no inline hex colors in components (element colors are the
  established exception, centralized in `constants/elements.ts`).
- Component styles are `<style scoped>` only; prefer Vuetify spacing utilities
  (`pa-`, `ma-`, `mr-`) over custom CSS.
