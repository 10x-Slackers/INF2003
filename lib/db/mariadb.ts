import mysql, {
  type Pool,
  type PoolOptions,
  type RowDataPacket,
} from "mysql2/promise";

const poolConfig: PoolOptions = {
  host: process.env.MARIADB_HOST,
  port: Number(process.env.MARIADB_PORT) || 3306,
  user: process.env.MARIADB_USER,
  password: process.env.MARIADB_PASSWORD,
  database: process.env.MARIADB_DATABASE,
  charset: "utf8mb4",
  connectionLimit: 10,
  connectTimeout: 5000,
  enableKeepAlive: true,
  decimalNumbers: false,
};

/** Singleton MariaDB connection pool */
const globalForDb = globalThis as unknown as {
  __mariadbPool?: Pool;
};

function createPool(): Pool {
  return mysql.createPool(poolConfig);
}

export const pool: Pool = globalForDb.__mariadbPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__mariadbPool = pool;
}

/**
 * Result of an INSERT/UPDATE/DELETE
 */
export interface QueryResult {
  affectedRows: number;
  insertId: number;
}

/**
 * Run a parameterised SELECT and get typed rows.
 *
 * Example:
 * const towns = await query<{ id: string; name: string }>(
 *   "SELECT id, name FROM towns WHERE region = ?",
 *   ["CENTRAL REGION"],
 * );
 */
export async function query<T extends Record<string, unknown> = RowDataPacket>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const [rows] = await pool.query(sql, params);
  return rows as T[];
}

/**
 * Run a parameterised INSERT/UPDATE/DELETE and return a summary result.
 *
 * Example:
 * const result = await execute(
 *   "UPDATE users SET name = ? WHERE id = ?",
 *   ["Jane", userId],
 * );
 */
export async function execute(
  sql: string,
  params: unknown[] = [],
): Promise<QueryResult> {
  const [result] = await pool.query(sql, params);
  return result as unknown as QueryResult;
}

/**
 * Wrapper to acquire a single connection, start a transaction, and commit. Rolls back on any error.
 *
 * Example:
 * await withTransaction(async ({ execute }) => {
 *   await execute("INSERT INTO towns (...) VALUES (...)", [...]);
 *   await execute("INSERT INTO properties (...) VALUES (...)", [...]);
 * });
 */
export async function withTransaction<T>(
  work: (conn: {
    query: <R extends Record<string, unknown> = RowDataPacket>(
      sql: string,
      params?: unknown[],
    ) => Promise<R[]>;
    execute: (sql: string, params?: unknown[]) => Promise<QueryResult>;
  }) => Promise<T>,
): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Connection-scoped query/execute
    const connQuery = async <R extends Record<string, unknown> = RowDataPacket>(
      sql: string,
      params: unknown[] = [],
    ): Promise<R[]> => {
      const [rows] = await conn.query(sql, params);
      return rows as R[];
    };

    const connExecute = async (
      sql: string,
      params: unknown[] = [],
    ): Promise<QueryResult> => {
      const [result] = await conn.query(sql, params);
      return result as unknown as QueryResult;
    };

    // Run the caller's work and commit only if it returns without throwing.
    const result = await work({ query: connQuery, execute: connExecute });
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
