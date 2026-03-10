import { getPool } from '~/server/utils/db'
import type { CalendarEntry } from '~/types'

export default defineEventHandler(async (): Promise<CalendarEntry[]> => {
  const pool = getPool()

  const result = await pool.query('SELECT * FROM calendar_entries ORDER BY start_date ASC')

  return result.rows as CalendarEntry[]
})
