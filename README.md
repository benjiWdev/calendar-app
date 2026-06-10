# Calendar App

> A single-user monthly calendar for tracking multi-day entries across named elements.

A client-only Nuxt SPA backed by a small PostgreSQL-powered API. View a monthly
grid and create, edit, and delete entries — each with a title, optional
description, a mandatory start and end date, and one or more assigned elements.
Entries render as bars spanning every day in their range. The UI is in German.

## Quick Start

```bash
pnpm install            # install dependencies
cp .env.example .env     # then set your PostgreSQL connection string
pnpm migrate            # apply database migrations
pnpm dev                # start the dev server
```

See [Getting Started](docs/getting-started.md) for prerequisites and details.

## Key Features

- **Monthly calendar grid** — custom 7-column layout, week starts Monday.
- **Multi-day entries** — each entry spans every day between its start and end date.
- **Create / edit / delete** — entries managed through Vuetify dialog forms.
- **Color-coded elements** — tag entries with Magazzino, Colmata, or Kuhstall.
- **Server-side validation** — required fields and date/element rules enforced in the API.
- **Migration-managed schema** — PostgreSQL schema evolved via `node-pg-migrate`.

## Tech Stack

- **Nuxt 4** (SPA, `ssr: false`) · **Vuetify 3** · **TypeScript 5** (strict)
- **PostgreSQL** via `pg` · **node-pg-migrate** · **pnpm**

## Example

```bash
# Create an entry via the API
curl -X POST http://localhost:3000/api/entries \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Wartung",
    "start_date": "2026-06-10",
    "end_date": "2026-06-12",
    "elements": ["Magazzino"]
  }'
```

---

## Documentation

| Guide | Description |
|-------|-------------|
| [Getting Started](docs/getting-started.md) | Prerequisites, installation, running the app |
| [Architecture](docs/architecture.md) | Layered architecture and project structure |
| [API Reference](docs/api.md) | `/api/entries` endpoints, payloads, error codes |
| [Database & Migrations](docs/database.md) | Schema, `node-pg-migrate` workflow, configuration |

For AI-agent conventions, hard constraints, and the project map, see
[`CLAUDE.md`](CLAUDE.md).

---

## AI Factory

This project is set up with [AI Factory](https://skills.sh) for
[Claude Code](https://claude.com/claude-code) — a suite of skills, agents, and
project context that guides AI-assisted development.

### Layout

| Path | Tracked? | Purpose |
|------|----------|---------|
| `.ai-factory/config.yaml` | ✅ committed | Language, paths, and git workflow settings |
| `.ai-factory/DESCRIPTION.md` | ✅ committed | Project intent, features, and stack |
| `.ai-factory/ARCHITECTURE.md` | ✅ committed | Architecture pattern and dependency rules |
| `.ai-factory/rules/base.md` | ✅ committed | Auto-detected project conventions |
| `.ai-factory.json` | ✅ committed | Manifest of installed skills/agents (lets `/aif` rebuild them) |
| `.mcp.json` | ✅ committed | MCP server config (`filesystem`, `postgres`, `playwright`) |
| `.claude/` | 🚫 ignored | Installed skills + agents — regenerable, not committed |
| `CLAUDE.md` | ✅ committed | Authoritative agent instructions and project map |

### Initialize on a fresh clone

The `.claude/` tooling is git-ignored and regenerated from the committed
`.ai-factory.json` manifest. To set it up after cloning:

1. Open the project in **Claude Code**.
2. Run the setup skill:

   ```text
   /aif
   ```

   On an existing project this analyzes the stack, installs the AI Factory skills
   and agents into `.claude/`, and wires up MCP servers. It will not overwrite the
   committed `.ai-factory/` context unless you ask it to.

### MCP environment

The `postgres` MCP server reads the `DATABASE_URL` environment variable. Set it (in
addition to `NUXT_DATABASE_URL` used by the app) if you want database access from
the agent:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/calendar
```

### Useful skills

| Command | Purpose |
|---------|---------|
| `/aif` | Set up or refresh project AI context (skills, agents, MCP) |
| `/aif-plan <feature>` | Plan a feature before implementing |
| `/aif-implement` | Execute the current plan |
| `/aif-docs` | Generate or update this README and the `docs/` pages |
| `/aif-review` | Review staged changes or a PR |
