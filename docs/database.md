[← API Reference](api.md) · [Back to README](../README.md)

# Database & Migrations

The app uses **PostgreSQL** through the `pg` driver. The schema is managed by
**`node-pg-migrate`**; all access goes through a single connection pool.

## Configuration

The connection string is read from `runtimeConfig.databaseUrl` in
`nuxt.config.ts`, which is populated from the environment:

```bash
# .env
NUXT_DATABASE_URL=postgresql://user:password@localhost:5432/calendar
```

Format: `postgresql://user:password@host:port/database`

- Nuxt maps the `NUXT_DATABASE_URL` env var onto `runtimeConfig.databaseUrl`.
- The migration scripts read `NUXT_DATABASE_URL` from `.env` directly
  (`node-pg-migrate -d NUXT_DATABASE_URL --envPath .env`).
- `.env` holds secrets and is git-ignored — never commit it.

The pool is created lazily in `server/utils/db.ts` (`getPool()`), with `max: 10`
connections, and reused for the life of the server process. All queries go through
this single accessor.

## Schema

The only table is `calendar_entries` (current state after all migrations):

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `SERIAL` | Primary key |
| `title` | `VARCHAR(255)` | `NOT NULL` |
| `description` | `VARCHAR(1000)` | nullable |
| `start_date` | `DATE` | `NOT NULL` |
| `end_date` | `DATE` | `NOT NULL`, `CHECK (end_date >= start_date)` |
| `elements` | `TEXT[]` | `NOT NULL DEFAULT '{}'` |
| `created_at` | `TIMESTAMP` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` |

Indexes:
- `idx_start_date` on `(start_date)`.

Constraints:
- `chk_end_date_gte_start_date` ensures `end_date >= start_date`.

> `db/schema.sql` is a human-readable snapshot for reference only. **Do not run it**
> — the migrations in `migrations/` are authoritative.

## Migration Workflow

Migration files live in `migrations/` and use `-- Up Migration` and
`-- Down Migration` comment markers to separate the two directions.

```bash
# Apply all pending migrations
pnpm migrate

# Roll back the last migration
pnpm migrate:down

# Create a new SQL migration file (then fill in up/down SQL)
pnpm migrate:create <name>
```

Example migration:

```sql
-- Up Migration
ALTER TABLE calendar_entries ADD COLUMN location VARCHAR(255);

-- Down Migration
ALTER TABLE calendar_entries DROP COLUMN location;
```

### Existing migrations

| File | Change |
|------|--------|
| `1700000000000_initial_schema.sql` | Create `calendar_entries` + `idx_start_date` |
| `1700000000001_add_elements.sql` | Add `elements TEXT[]` column |
| `1700000000002_end_date_mandatory_check.sql` | Make `end_date` mandatory + add `>=` check |

## Rules

- **Never edit an existing migration** — migrations are immutable. Add a new one.
- **Always write a `-- Down Migration`** so rollbacks work.
- **Keep `db/schema.sql` in sync** as the readable snapshot after each change.
- A data-model field change is applied atomically across migration → `types/` →
  `server/api/` → components (see [`CLAUDE.md`](../CLAUDE.md)).

## See Also

- [Getting Started](getting-started.md) — first-time database setup.
- [API Reference](api.md) — endpoints that read and write this table.
