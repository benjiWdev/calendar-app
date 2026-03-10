import mysql from 'mysql2/promise'

/**
 * Lazily initialised connection pool — one pool per server process.
 * useRuntimeConfig() is available globally inside the Nuxt server context.
 */
let pool: mysql.Pool | null = null

export function getPool(): mysql.Pool {
  if (!pool) {
    const config = useRuntimeConfig()

    pool = mysql.createPool({
      host: config.dbHost as string,
      port: Number(config.dbPort) || 3306,
      user: config.dbUser as string,
      password: config.dbPassword as string,
      database: config.dbName as string,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      // Return JS Date objects for DATETIME / TIMESTAMP columns
      dateStrings: false,
      timezone: 'Z',
    })
  }

  return pool
}
