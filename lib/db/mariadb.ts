import mysql, {
  type Pool,
  type PoolOptions,
  type RowDataPacket,
  type ResultSetHeader,
  type ExecuteValues,
} from "mysql2/promise";
import { handleDbError, requireEnv } from "@/lib/utils";
import { idSchema } from "@/lib/tables/common";

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
 */
export async function execute(
  sql: string,
  params: unknown[] = [],
): Promise<QueryResult> {
  const [result] = await pool.execute(sql, params as ExecuteValues);
  const { affectedRows, insertId } = result as ResultSetHeader;
  return { affectedRows, insertId };
}

export async function executeReturning<
  T extends Record<string, unknown> = RowDataPacket,
>(sql: string, params: unknown[] = []): Promise<T[]> {
  return query<T>(sql, params);
}

/**
 * Run a parameterised SELECT and return the first row, or `null` if no rows.
 */
export async function queryOne<
  T extends Record<string, unknown> = RowDataPacket,
>(sql: string, params: unknown[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

/** True when every value in `input` is `undefined` (i.e. an empty update). */
export function isEmptyUpdate(input: Record<string, unknown>): boolean {
  return Object.values(input).every((value) => value === undefined);
}

/**
 * Build a `SET` clause and params from a data object, skipping `undefined`.
 */
export function buildUpdateFields(data: Record<string, unknown>): {
  setClause: string;
  params: unknown[];
} {
  const fields: string[] = [];
  const params: unknown[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      params.push(value);
    }
  }
  return { setClause: fields.join(", "), params };
}

/** Push `column <operator> ?` with `field` if `field` is not `undefined`. */
export function addCondition<T>(
  conditions: string[],
  params: unknown[],
  field: T | undefined,
  column: string,
  operator: string = "=",
) {
  if (field !== undefined) {
    conditions.push(`${column} ${operator} ?`);
    params.push(field);
  }
}

/** Push `column IN (?, ?, ...)` with `values` if `values` is non-empty. */
export function addInCondition(
  conditions: string[],
  params: unknown[],
  values: unknown[] | undefined,
  column: string,
) {
  if (values?.length) {
    conditions.push(`${column} IN (${values.map(() => "?").join(", ")})`);
    params.push(...values);
  }
}

/** Delete a row by id, returning true if a row was deleted. */
export async function deleteById(table: string, id: string): Promise<boolean> {
  try {
    const result = await execute(`DELETE FROM ${table} WHERE id = ?`, [
      idSchema.parse(id),
    ]);
    return result.affectedRows > 0;
  } catch (error) {
    return handleDbError(error);
  }
}

/**
 * Run a data query and a count query in parallel, returning a paginated result.
 * `dataSql` must end with `LIMIT ? OFFSET ?`; `countSql` must return `{ total }`.
 */
export async function paginatedQuery<T extends Record<string, unknown>>(
  dataSql: string,
  countSql: string,
  params: unknown[],
  page: number,
  pageSize: number,
): Promise<{ data: T[]; total: number }> {
  try {
    const [rows, countRows] = await Promise.all([
      query<T>(dataSql, [...params, pageSize, (page - 1) * pageSize]),
      query<{ total: number }>(countSql, params),
    ]);
    return { data: rows, total: countRows[0].total };
  } catch (error) {
    return handleDbError(error);
  }
}
