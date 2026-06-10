[Back to README](../README.md) · [Architecture →](architecture.md)

# Getting Started

Set up the Calendar App locally and run it against a PostgreSQL database.

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 20+ | Matches `@types/node` 20 |
| pnpm | latest | Package manager — **do not** use npm or yarn |
| PostgreSQL | 12+ | Any reachable instance (local, Docker, or hosted) |

## Installation

```bash
# 1. Install dependencies (runs `nuxt prepare` via postinstall)
pnpm install

# 2. Create your environment file
cp .env.example .env
```

Then edit `.env` and set your PostgreSQL connection string:

```bash
NUXT_DATABASE_URL=postgresql://user:password@localhost:5432/calendar
```

See [Database & Migrations](database.md) for connection-string details and how the
variable is consumed.

## Database Setup

Apply all pending migrations to create the `calendar_entries` table and its
constraints:

```bash
pnpm migrate
```

## Run the App

```bash
pnpm dev
```

The app starts on `http://localhost:3000`. Because it runs in SPA mode
(`ssr: false`), the page is rendered entirely in the browser and talks to the
server API under `/api/entries`.

## Verify It Works

- Open `http://localhost:3000` — you should see the monthly calendar grid.
- The list endpoint should return an array (empty until you add entries):

```bash
curl http://localhost:3000/api/entries
# []
```

## Common Scripts

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm preview` | Preview the production build |
| `pnpm lint` | Run ESLint |
| `pnpm lint:fix` | Auto-fix lint issues |
| `pnpm migrate` | Apply pending migrations |
| `pnpm migrate:down` | Roll back the last migration |
| `pnpm migrate:create <name>` | Create a new migration file |

## Next Steps

- [Architecture](architecture.md) — how the layers fit together.
- [Database & Migrations](database.md) — schema and migration workflow.

## See Also

- [API Reference](api.md) — the endpoints the frontend calls.
- [Architecture](architecture.md) — project structure and data flow.
