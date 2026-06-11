# Plan: Prevent Overlapping Bookings

**Branch:** main (fast plan — no branch)
**Created:** 2026-06-11
**Type:** Enhancement

## Goal

Reject creating or editing a calendar entry when one of its assigned elements is
already booked by another entry whose date range overlaps the new entry's range.
Enforcement is server-side (source of truth); the existing dialog error UI surfaces
the German message automatically.

## Settings

- **Testing:** No (test frameworks are out of scope per `CLAUDE.md`; manual verification only)
- **Logging:** DEBUG-level `console.debug` around the conflict check (candidate range/elements + result)
- **Docs:** Warn-only — update `docs/api.md` if the new 409 response should be documented (optional follow-up)

## Roadmap Linkage

Milestone: "none" — no `ROADMAP.md` present.

## Background (verified in codebase)

- `elements` column is `TEXT[]` (migration `1700000000001_add_elements.sql`) → use the
  PostgreSQL array-overlap operator `&&` to test for a shared element.
- Date ranges are **inclusive** (entries render a bar on every day from `start_date` to
  `end_date`), but a booking **may start on the day another one ends**. Touching ranges do
  not conflict, so the overlap test uses **strict** comparisons:
  `existing.start_date < new.end_date AND existing.end_date > new.start_date`.
- `end_date` is now mandatory (migration `1700000000002`), so no NULL handling is required for new data.
- Both `index.post.ts` and `[id].put.ts` already validate fields and call `getPool()`.
- `components/AddEntryDialog.vue` / `EditEntryDialog.vue` already render API error
  `data.message` in a `v-alert` via `extractErrorMessage` (`composables/useEntryForm.ts`).
  A `createError({ statusCode: 409, message })` therefore needs **no client changes**.

## Approach

Add one shared server utility and wire it into both write endpoints. No migration, no
schema change, no new table, no client change. Conflict semantics live in a single place
so create and edit stay consistent (CLAUDE.md: apply data-model logic atomically; here the
logic is read-only so it's a single shared helper).

## Tasks

### Task 1 — Add shared overlap-conflict detection util (`server/utils/entryConflicts.ts`) — [x] done

- Export `findConflictingEntry(pool, { startDate, endDate, elements, excludeId? })`:
  ```sql
  SELECT title, start_date, end_date, elements
  FROM calendar_entries
  WHERE start_date < $endDate     -- strict: a booking may start the day another ends
    AND end_date   > $startDate   -- strict: ...and may end the day another starts
    AND elements && $elements::text[]
    [AND id <> $excludeId]     -- only when excludeId is provided
  ORDER BY start_date
  LIMIT 1
  ```
  Returns the first conflicting row or `null`. Fully typed (no `any`).
- Export `buildConflictMessage(conflict, candidateElements)`: pick the first element shared
  between `conflict.elements` and `candidateElements`, format the existing booking's range as
  `DD.MM.YYYY`, return e.g. `"Kuhstall ist vom 12.06.2026 bis 14.06.2026 bereits gebucht."`.
- Add a `console.debug` logging the candidate range/elements and whether a conflict was found.
- **Files:** create `server/utils/entryConflicts.ts`.

### Task 2 — Enforce on creation (`server/api/entries/index.post.ts`) — [x] done

- After existing validation + `getPool()`, call `findConflictingEntry(pool, { startDate: body.start_date, endDate: body.end_date, elements: body.elements })`.
- If non-null: `throw createError({ statusCode: 409, message: buildConflictMessage(conflict, body.elements) })` **before** the INSERT.
- Leave the SELECT-after-INSERT return path unchanged. DEBUG-log when a conflict blocks insert.

### Task 3 — Enforce on update (`server/api/entries/[id].put.ts`) — [x] done

- Same call but pass `excludeId: id` so the edited entry doesn't conflict with itself.
- If non-null: `throw createError({ statusCode: 409, ... })` **before** the UPDATE.
- Preserve the existing `rowCount === 0 → 404` handling. DEBUG-log when a conflict blocks update.

### Task 4 — Verify types, lint, and manual flow — [x] static checks done (lint clean; runtime UI checks left to user to avoid mutating the live DB)

- `pnpm lint` and project typecheck pass; no `any` / `@ts-ignore` introduced.
- Manual checks:
  - Create overlapping element+range → 409, German message shows in Add dialog `v-alert`.
  - Edit an entry to overlap a *different* entry → blocked.
  - Edit an entry without changing its own range → still allowed (self-exclusion works).
  - Non-overlapping ranges, or overlapping ranges with *no shared element* → still succeed.

## Notes / Edge cases

- Same-day touching ranges are **allowed**: a booking may start on the day another one ends
  (and vice versa). This is enforced by the strict `<`/`>` comparisons in the overlap test —
  inclusive `<=`/`>=` would instead treat the shared boundary day as a conflict.
- Concurrency: two simultaneous inserts could both pass the check (no DB-level exclusion
  constraint). Acceptable for a single-user app; note only.
