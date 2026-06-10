[← Getting Started](getting-started.md) · [Back to README](../README.md) · [API Reference →](api.md)

# Architecture

The app follows a **Layered Architecture** adapted to Nuxt conventions: a client
presentation layer talks over HTTP to a thin server API layer, which delegates all
persistence to a single data-access boundary. For the full rationale, dependency
rules, and code examples, see [`.ai-factory/ARCHITECTURE.md`](../.ai-factory/ARCHITECTURE.md).

## Layers at a Glance

| Layer | Lives in | Responsibility |
|-------|----------|----------------|
| Presentation (client) | `pages/`, `components/`, `composables/`, `constants/`, `plugins/` | Render UI, collect input, fetch via the API |
| Transport / API (server) | `server/api/entries/` | Validate requests, run queries, return typed rows |
| Data access (server) | `server/utils/db.ts` | The single PostgreSQL access point (`getPool()`) |
| Shared contracts | `types/`, `constants/` | Data shapes used by both client and server |

## Data Flow

```text
pages/index.vue  ──useFetch──▶  /api/entries (Nitro)  ──getPool()──▶  PostgreSQL
      │                                                                   │
      ▼                                                                   ▼
components/* (props in, events out)                          calendar_entries table
```

- `pages/index.vue` is the **only** place data is fetched. It passes entries down
  as props and refetches after a dialog reports success.
- `CalendarView.vue` is a pure display component — props in, no fetching, no emits.
- `MonthOverviewBand.vue` is also pure-display: it receives the same `entries` prop,
  keeps its own 3-month window state, and derives the booked day ranges (timeframes)
  via the `useMonthBookingSummary` composable, rendering them as positioned blocks.
- Dialogs (`AddEntryDialog.vue`, `EditEntryDialog.vue`) wrap the shared
  `EntryForm.vue` and emit on success.

## Project Structure

```text
calendar-app/
├── app.vue                  # Root layout (v-app, app bar, NuxtPage)
├── pages/index.vue          # Route + data orchestration (useFetch)
├── components/
│   ├── CalendarView.vue       # Pure-display monthly grid
│   ├── MonthOverviewBand.vue  # Pure-display 3-month booking overview band
│   ├── AddEntryDialog.vue     # Create dialog
│   ├── EditEntryDialog.vue    # Edit/delete dialog
│   └── EntryForm.vue          # Shared form fields + client validation
├── composables/
│   ├── useEntryForm.ts            # Reactive form state, reset, ISO-date, error helpers
│   └── useMonthBookingSummary.ts  # Pure helper: booked day ranges per element per month
├── constants/elements.ts    # Element options + colors
├── plugins/vuetify.ts       # Vuetify init (theme, icons, date adapter)
├── types/index.ts           # CalendarEntry, CreateEntryPayload, ElementName
├── server/
│   ├── api/entries/         # GET / POST / PUT / DELETE handlers
│   └── utils/db.ts          # getPool() — PostgreSQL pool
├── migrations/              # node-pg-migrate SQL (authoritative schema)
└── db/schema.sql            # Human-readable snapshot (reference only)
```

## Key Conventions

- **Single source of truth for shapes:** `types/index.ts`. DB column names
  (`snake_case`) are preserved in the interfaces.
- **No fetching in components** — only `pages/` fetches.
- **No DB access outside `server/`** — and always via `getPool()`.
- **Parameterized SQL only** — no string interpolation, no ORM.
- **Atomic field changes** across migration → types → API → components
  (see [`CLAUDE.md`](../CLAUDE.md)).

## See Also

- [API Reference](api.md) — the endpoints the presentation layer calls.
- [Database & Migrations](database.md) — the data-access layer's schema.
