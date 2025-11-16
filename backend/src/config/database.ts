import pg from 'pg';

import { logger } from '../utils/logger.js';

import { env } from './env.js';

const { Pool } = pg;

/**
 * Transform query results by converting snake_case column names to camelCase
 */
function toCamelCase<T extends pg.QueryResultRow>(result: pg.QueryResult): pg.QueryResult<T> {
  return {
    ...result,
    rows: result.rows.map((row) => {
      const camelized: Record<string, unknown> = {};
      for (const key in row) {
        if (Object.prototype.hasOwnProperty.call(row, key)) {
          const camelKey = key.replace(/_([a-z])/g, (_match, letter: string) => letter.toUpperCase());
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          camelized[camelKey] = row[key];
        }
      }
      return camelized as T;
    }),
  };
}

// Create the database pool
const pool = new Pool({
  host: env.POSTGRES_HOST,
  port: env.POSTGRES_PORT,
  database: env.POSTGRES_DB,
  user: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
  min: env.DB_POOL_MIN,
  max: env.DB_POOL_MAX,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * Execute a database query with automatic camelCase conversion
 * 
 * All snake_case column names are automatically converted to camelCase
 * 
 * @example
 * ```typescript
 * // Database has columns: station_id, created_at
 * const result = await query<{ stationId: string, createdAt: Date }>(
 *   'SELECT station_id, created_at FROM hsl.stations WHERE station_id = $1',
 *   ['001']
 * );
 * // Result automatically has camelCase keys: { stationId: '001', createdAt: Date }
 * ```
 */
export async function query<T extends pg.QueryResultRow>(
  text: string | pg.QueryConfig,
  params?: unknown[]
): Promise<pg.QueryResult<T>> {
  const result = await pool.query<T>(text, params);
  return toCamelCase<T>(result);
}

export { pool };


export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    logger.info('Database connection established successfully');
    return true;
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    return false;
  }
}

export async function closePool(): Promise<void> {
  await pool.end();
  logger.info('Database connection pool closed');
}


export async function checkDatabaseHealth(): Promise<{ connected: boolean }> {
  const connected = await testConnection();
  return { connected };
}

export async function closeDatabasePool(): Promise<void> {
  return closePool();
}

process.on('SIGTERM', () => {
  void closePool().finally(() => process.exit(0));
});

process.on('SIGINT', () => {
  void closePool().finally(() => process.exit(0));
});
