import { Pool } from 'pg'

/**
 * Lazily initialised connection pool — one pool per server process.
 * useRuntimeConfig() is available globally inside the Nuxt server context.
 */
let pool: Pool | null = null

export function getPool(): Pool {
  if (!pool) {
    const config = useRuntimeConfig()

    pool = new Pool({
      connectionString: config.databaseUrl as string,
      max: 10,
    })
  }

  return pool
}
