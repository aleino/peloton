import pg from 'pg';

import { logger } from '../utils/logger.js';

import { env } from './env.js';

const { Pool } = pg;

export const pool = new Pool({
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

process.on('SIGTERM', () => {
  void closePool().then(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  void closePool().then(() => {
    process.exit(0);
  });
});
