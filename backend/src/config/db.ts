import { Pool, QueryResult, QueryResultRow } from 'pg';
import { env } from './env';

export const pool = new Pool({
  host: env.PGHOST,
  port: env.PGPORT,
  database: env.PGDATABASE,
  user: env.PGUSER,
  password: env.PGPASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error]: Unexpected error on idle client', err);
});

/**
 * Execute raw parameterized SQL queries with safety and logging.
 * STRICT COMPLIANCE: No ORMs allowed (Prisma/TypeORM prohibited).
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SQL Query] (${duration}ms) rows=${result.rowCount}`);
    }
    return result;
  } catch (error) {
    console.error(`[SQL Error executing query]: "${text}"`, error);
    throw error;
  }
}

/**
 * Test and verify PostgreSQL connection on server startup
 */
export async function testDbConnection(): Promise<boolean> {
  try {
    const res = await query('SELECT version();');
    console.log(`[PostgreSQL 18 Connected]: ${res.rows[0].version.split(',')[0]}`);
    return true;
  } catch (err) {
    console.error('[PostgreSQL Connection Failed]:', err);
    return false;
  }
}
