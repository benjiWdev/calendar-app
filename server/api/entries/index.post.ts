import type { ResultSetHeader, RowDataPacket } from 'mysql2'
import { getPool } from '~/server/utils/db'
import type { CalendarEntry, CreateEntryPayload } from '~/types'

export default defineEventHandler(async (event): Promise<CalendarEntry> => {
  const body = await readBody<Partial<CreateEntryPayload>>(event)

  if (!body.title?.trim()) {
    throw createError({ statusCode: 400, message: 'title is required' })
  }
  if (!body.start_date) {
    throw createError({ statusCode: 400, message: 'start_date is required' })
  }

  const pool = getPool()

  const [result] = await pool.execute<ResultSetHeader>(
    `INSERT INTO calendar_entries (title, description, start_date, start_time, end_date, end_time)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      body.title.trim(),
      body.description?.trim() || null,
      body.start_date,
      body.start_time || null,
      body.end_date || null,
      body.end_time || null,
    ],
  )

  const insertId = result.insertId

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM calendar_entries WHERE id = ?',
    [insertId],
  )

  return rows[0] as unknown as CalendarEntry
})
