import { getPool } from '~/server/utils/db'

export default defineEventHandler(async (event): Promise<void> => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, message: 'invalid id' })
  }

  const pool = getPool()

  const result = await pool.query('DELETE FROM calendar_entries WHERE id = $1', [id])

  if (result.rowCount === 0) {
    throw createError({ statusCode: 404, message: 'entry not found' })
  }
})
