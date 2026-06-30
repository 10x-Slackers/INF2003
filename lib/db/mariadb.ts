import mysql, {
  type Pool,
  type PoolOptions,
  type RowDataPacket,
  type ResultSetHeader,
  type ExecuteValues,
} from "mysql2/promise";
import { requireEnv } from "@/lib/utils";

const poolConfig: PoolOptions = {
  host: requireEnv("MARIADB_HOST"),
  port: Number(process.env.MARIADB_PORT) || 3306,
  user: requireEnv("MARIADB_USER"),
  password: requireEnv("MARIADB_PASSWORD"),
  database: requireEnv("MARIADB_DATABASE"),
  charset: "utf8mb4",
  connectionLimit: 10,
  connectTimeout: 5000,
  enableKeepAlive: true,
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
  params: ExecuteValues = [],
): Promise<QueryResult> {
  const [result] = await pool.execute(sql, params);
  const { affectedRows, insertId } = result as ResultSetHeader;
  return { affectedRows, insertId };
}

export async function executeReturning<
  T extends Record<string, unknown> = RowDataPacket,
>(sql: string, params: unknown[] = []): Promise<T[]> {
  return query<T>(sql, params);
}
