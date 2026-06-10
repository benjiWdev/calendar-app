[← Architecture](architecture.md) · [Back to README](../README.md) · [Database & Migrations →](database.md)

# API Reference

All endpoints are server routes under `/api/entries`, handled by Nitro. Requests
and responses are JSON. There is no authentication (single-user app).

Base URL (dev): `http://localhost:3000`

## Data Shapes

A stored entry (`CalendarEntry`):

```ts
{
  id: number
  title: string
  description: string | null
  start_date: string        // "YYYY-MM-DD"
  end_date: string          // "YYYY-MM-DD"
  elements: ElementName[]   // ("Magazzino" | "Colmata" | "Kuhstall")[]
  created_at: string        // timestamp
}
```

Create / update payload (`CreateEntryPayload`):

```ts
{
  title: string
  description?: string      // optional; empty string is stored as null
  start_date: string        // "YYYY-MM-DD"
  end_date: string          // "YYYY-MM-DD"
  elements?: ElementName[]  // at least one required
}
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/entries` | List all entries, ordered by `start_date` ascending |
| `POST` | `/api/entries` | Create a new entry |
| `PUT` | `/api/entries/:id` | Update an existing entry |
| `DELETE` | `/api/entries/:id` | Delete an entry |

### GET /api/entries

Returns an array of `CalendarEntry`, ordered by `start_date ASC`.

```bash
curl http://localhost:3000/api/entries
```

```json
[
  {
    "id": 1,
    "title": "Wartung",
    "description": null,
    "start_date": "2026-06-10",
    "end_date": "2026-06-12",
    "elements": ["Magazzino"],
    "created_at": "2026-06-01T08:00:00.000Z"
  }
]
```

### POST /api/entries

Creates an entry and returns the full stored `CalendarEntry` (HTTP 200).

```bash
curl -X POST http://localhost:3000/api/entries \
  -H 'Content-Type: application/json' \
  -d '{"title":"Wartung","start_date":"2026-06-10","end_date":"2026-06-12","elements":["Magazzino"]}'
```

### PUT /api/entries/:id

Updates the entry with the given `id` and returns the updated `CalendarEntry`.
Returns `404` if no entry has that id.

```bash
curl -X PUT http://localhost:3000/api/entries/1 \
  -H 'Content-Type: application/json' \
  -d '{"title":"Wartung","start_date":"2026-06-10","end_date":"2026-06-13","elements":["Magazzino","Colmata"]}'
```

### DELETE /api/entries/:id

Deletes the entry. Returns an empty body on success, or `404` if not found.

```bash
curl -X DELETE http://localhost:3000/api/entries/1
```

## Validation Rules

`POST` and `PUT` apply the same server-side validation (the server is the source of
truth; the form also validates client-side for UX):

| Rule | Failure message |
|------|-----------------|
| `title` is required (non-empty after trim) | `title is required` |
| `start_date` is required | `start_date is required` |
| `end_date` is required | `end_date is required` |
| `end_date` must not be before `start_date` | `end_date must not be before start_date` |
| at least one `element` is required | `at least one element is required` |

Notes:
- `description` is trimmed; an empty string is stored as `null`.
- `PUT` and `DELETE` also reject a non-numeric `:id` with `invalid id`.

## Error Codes

| Status | When |
|--------|------|
| `400` | Validation failed, or an invalid (non-numeric) id was supplied |
| `404` | `PUT` / `DELETE` referenced an id that does not exist |

Errors are returned via Nuxt's `createError`, e.g.:

```json
{ "statusCode": 400, "message": "title is required" }
```

## See Also

- [Database & Migrations](database.md) — the schema behind these endpoints.
- [Architecture](architecture.md) — how the API layer fits into the app.
