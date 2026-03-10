import type { RowDataPacket } from 'mysql2'
import { getPool } from '~/server/utils/db'
import type { CalendarEntry } from '~/types'

export default defineEventHandler(async (): Promise<CalendarEntry[]> => {
  const pool = getPool()

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM calendar_entries ORDER BY start_date ASC',
  )

  return rows as unknown as CalendarEntry[]
})
