import { getPool } from '~/server/utils/db'
import { findConflictingEntry, buildConflictMessage } from '~/server/utils/entryConflicts'
import type { CalendarEntry, CreateEntryPayload } from '~/types'

export default defineEventHandler(async (event): Promise<CalendarEntry> => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, message: 'invalid id' })
  }

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
    excludeId: id,
  })
  if (conflict) {
    throw createError({ statusCode: 409, message: buildConflictMessage(conflict, body.elements) })
  }

  const result = await pool.query(
    `UPDATE calendar_entries
     SET title = $1, description = $2, start_date = $3, end_date = $4, elements = $5
     WHERE id = $6
     RETURNING *`,
    [
      body.title.trim(),
      body.description?.trim() || null,
      body.start_date,
      body.end_date,
      body.elements,
      id,
    ],
  )

  if (result.rowCount === 0) {
    throw createError({ statusCode: 404, message: 'entry not found' })
  }

  return result.rows[0] as CalendarEntry
})
