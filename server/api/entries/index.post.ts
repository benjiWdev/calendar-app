import { getPool } from '~/server/utils/db'
import { findConflictingEntry, buildConflictMessage } from '~/server/utils/entryConflicts'
import type { CalendarEntry, CreateEntryPayload } from '~/types'

export default defineEventHandler(async (event): Promise<CalendarEntry> => {
  const body = await readBody<Partial<CreateEntryPayload>>(event)

  if (!body.title?.trim()) {
    throw createError({ statusCode: 400, message: 'title is required' })
  }
  if (!body.start_date) {
    throw createError({ statusCode: 400, message: 'start_date is required' })
  }
  if (!body.end_date) {
    throw createError({ statusCode: 400, message: 'end_date is required' })
  }
  if (body.end_date < body.start_date) {
    throw createError({ statusCode: 400, message: 'end_date must not be before start_date' })
  }
  if (!body.elements?.length) {
    throw createError({ statusCode: 400, message: 'at least one element is required' })
  }

  const pool = getPool()

  const conflict = await findConflictingEntry(pool, {
    startDate: body.start_date,
    endDate: body.end_date,
    elements: body.elements,
  })
  if (conflict) {
    throw createError({ statusCode: 409, message: buildConflictMessage(conflict, body.elements) })
  }

  const insertResult = await pool.query(
    `INSERT INTO calendar_entries (title, description, start_date, end_date, elements)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [
      body.title.trim(),
      body.description?.trim() || null,
      body.start_date,
      body.end_date,
      body.elements ?? [],
    ],
  )

  const insertId = insertResult.rows[0].id

  const result = await pool.query(
    'SELECT * FROM calendar_entries WHERE id = $1',
    [insertId],
  )

  return result.rows[0] as CalendarEntry
})
