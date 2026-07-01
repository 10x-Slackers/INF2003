import { execute, query } from "@/lib/db";
import { handleDbError } from "@/lib/utils";
import {
  createTransactionSchema,
  type CreateTransactionParams,
  type ResaleTransaction,
  type TransactionStatisticRow,
  type TransactionStatisticsGranularity,
  type TransactionStatisticsGroup,
  type TransactionStatisticsMetric,
  type TransactionStatisticsQuery,
  type TransactionListItem,
  type TransactionListQuery,
  type UpdateTransaction,
  type UpdateTransactionParams,
  createTransactionParamsSchema,
  transactionStatisticsQuerySchema,
  transactionListQuerySchema,
  updateTransactionParamsSchema,
  updateTransactionSchema,
} from "./types";
import { idSchema } from "../common";
import { executeReturning } from "@/lib/db/mariadb";

const TRANSACTION_COLUMNS = `rt.id AS id, rt.uploaded_by_user_id AS uploaded_by_user_id,
            rt.property_id AS property_id, rt.flat_type_id AS flat_type_id,
            rt.flat_model_id AS flat_model_id, rt.storey_range_id AS storey_range_id,
            rt.floor_area_sqm AS floor_area_sqm, rt.transaction_month AS transaction_month,
            rt.resale_price AS resale_price`;

const TRANSACTION_LIST_COLUMNS = `${TRANSACTION_COLUMNS},
            p.town_id AS town_id, t.name AS town_name, p.block AS block,
            p.street_name AS street_name, p.lease_commence_year AS lease_commence_year,
            ft.name AS flat_type_name, fm.name AS flat_model_name,
            sr.min_storey AS min_storey, sr.max_storey AS max_storey,
            u.name AS uploaded_by_user_name`;

const TRANSACTION_LIST_JOIN = `
       JOIN properties p ON p.id = rt.property_id
       JOIN towns t ON t.id = p.town_id
       JOIN flat_types ft ON ft.id = rt.flat_type_id
       JOIN flat_models fm ON fm.id = rt.flat_model_id
       JOIN storey_ranges sr ON sr.id = rt.storey_range_id
       LEFT JOIN users u ON u.id = rt.uploaded_by_user_id`;

const STATISTIC_METRICS: Record<TransactionStatisticsMetric, string> = {
  avg_price: "CAST(AVG(rt.resale_price) AS DOUBLE)",
  avg_price_per_sqm: "CAST(AVG(rt.resale_price / rt.floor_area_sqm) AS DOUBLE)",
  sales_count: "COUNT(*)",
};

const STATISTIC_GROUPS: Record<
  Exclude<TransactionStatisticsGroup, "period">,
  string
> = {
  town_id: "p.town_id",
  flat_type_id: "rt.flat_type_id",
  property_id: "rt.property_id",
  lease_remaining_year:
    "99 - (YEAR(rt.transaction_month) - p.lease_commence_year)",
  storey_range_id: "rt.storey_range_id",
};

const isEmptyUpdate = (input: UpdateTransaction) =>
  Object.values(input).every((value) => value === undefined);

function periodExpression(granularity: TransactionStatisticsGranularity) {
  return `DATE_FORMAT(rt.transaction_month, '${
    granularity === "monthly" ? "%Y-%m" : "%Y"
  }')`;
}

function statisticGroupExpression(
  group: TransactionStatisticsGroup,
  granularity: TransactionStatisticsGranularity,
) {
  return group === "period"
    ? periodExpression(granularity)
    : STATISTIC_GROUPS[group];
}

export async function listTransactions(
  filters: TransactionListQuery,
): Promise<{ data: TransactionListItem[]; total: number }> {
  try {
    const data = transactionListQuerySchema.parse(filters);
    const { page, pageSize } = data;
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (data.town_id !== undefined) {
      conditions.push("p.town_id = ?");
      params.push(data.town_id);
    }
    if (data.flat_type_id !== undefined) {
      conditions.push("rt.flat_type_id = ?");
      params.push(data.flat_type_id);
    }
    if (data.flat_model_id !== undefined) {
      conditions.push("rt.flat_model_id = ?");
      params.push(data.flat_model_id);
    }
    if (data.storey_range_id !== undefined) {
      conditions.push("rt.storey_range_id = ?");
      params.push(data.storey_range_id);
    }
    if (data.price_min !== undefined) {
      conditions.push("rt.resale_price >= ?");
      params.push(data.price_min);
    }
    if (data.price_max !== undefined) {
      conditions.push("rt.resale_price <= ?");
      params.push(data.price_max);
    }
    if (data.year !== undefined) {
      conditions.push("YEAR(rt.transaction_month) = ?");
      params.push(data.year);
    }
    if (data.property_id !== undefined) {
      conditions.push("rt.property_id = ?");
      params.push(data.property_id);
    }

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows, countRows] = await Promise.all([
      query<TransactionListItem>(
        `SELECT ${TRANSACTION_LIST_COLUMNS}
       FROM resale_transactions rt
       ${TRANSACTION_LIST_JOIN}
       ${where}
       ORDER BY rt.transaction_month DESC
       LIMIT ? OFFSET ?`,
        [...params, pageSize, (page - 1) * pageSize],
      ),
      query<{ total: number }>(
        `SELECT COUNT(*) AS total
         FROM resale_transactions rt
         ${TRANSACTION_LIST_JOIN}
         ${where}`,
        params,
      ),
    ]);

    return { data: rows, total: countRows[0].total };
  } catch (error) {
    return handleDbError(error);
  }
}

export async function getTransactionStatistics(
  input: TransactionStatisticsQuery,
): Promise<TransactionStatisticRow[]> {
  try {
    const data = transactionStatisticsQuerySchema.parse(input);
    const groups = data.groupBy.map((group) => ({
      name: group,
      expression: statisticGroupExpression(group, data.granularity),
    }));
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (data.date_from !== undefined) {
      conditions.push("rt.transaction_month >= ?");
      params.push(data.date_from);
    }
    if (data.date_to !== undefined) {
      conditions.push("rt.transaction_month < ?");
      params.push(data.date_to);
    }
    if (data.town_id !== undefined) {
      conditions.push("p.town_id = ?");
      params.push(data.town_id);
    }
    if (data.flat_type_id !== undefined) {
      conditions.push("rt.flat_type_id = ?");
      params.push(data.flat_type_id);
    }
    if (data.property_id !== undefined) {
      conditions.push("rt.property_id = ?");
      params.push(data.property_id);
    }
    if (data.storey_range_id !== undefined) {
      conditions.push("rt.storey_range_id = ?");
      params.push(data.storey_range_id);
    }

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const selectGroups = groups
      .map(({ name, expression }) => `${expression} AS ${name}`)
      .join(", ");
    const groupBy = groups.map(({ expression }) => expression).join(", ");
    const orderBy = groups.map(({ name }) => name).join(", ");

    return await query<TransactionStatisticRow>(
      `SELECT ${selectGroups}, ${STATISTIC_METRICS[data.metric]} AS value,
              COUNT(*) AS sample_size
       FROM resale_transactions rt
       JOIN properties p ON p.id = rt.property_id
       ${where}
       GROUP BY ${groupBy}
       ORDER BY ${orderBy}`,
      params,
    );
  } catch (error) {
    return handleDbError(error);
  }
}

export async function getTransactionById(
  id: string,
): Promise<ResaleTransaction | null> {
  try {
    const rows = await query<ResaleTransaction>(
      `SELECT ${TRANSACTION_COLUMNS}
     FROM resale_transactions rt WHERE rt.id = ? LIMIT 1`,
      [idSchema.parse(id)],
    );
    return rows[0] ?? null;
  } catch (error) {
    return handleDbError(error);
  }
}

export async function createTransaction(
  input: CreateTransactionParams,
): Promise<string> {
  try {
    const params = createTransactionParamsSchema.parse(input);
    const data = createTransactionSchema.parse(params.input);
    const result = await executeReturning<{ id: string }>(
      `INSERT INTO resale_transactions
         (uploaded_by_user_id, property_id, flat_type_id, flat_model_id,
          storey_range_id, floor_area_sqm, transaction_month, resale_price)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      [
        params.uploadedByUserId,
        data.property_id,
        data.flat_type_id,
        data.flat_model_id,
        data.storey_range_id,
        data.floor_area_sqm,
        data.transaction_month,
        data.resale_price,
      ],
    );
    return result[0].id;
  } catch (error) {
    return handleDbError(error);
  }
}

export async function updateTransaction(
  input: UpdateTransactionParams,
): Promise<ResaleTransaction | null> {
  try {
    const parsed = updateTransactionParamsSchema.parse(input);
    if (isEmptyUpdate(parsed.input)) return getTransactionById(parsed.id);

    const data = updateTransactionSchema.parse(parsed.input);
    const existing = await getTransactionById(parsed.id);
    if (!existing) return null;

    const fields: string[] = [];
    const params: (string | number)[] = [];

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        params.push(value);
      }
    }

    await execute(
      `UPDATE resale_transactions SET ${fields.join(", ")} WHERE id = ?`,
      [...params, parsed.id],
    );
    return getTransactionById(parsed.id);
  } catch (error) {
    return handleDbError(error);
  }
}

export async function deleteTransaction(id: string): Promise<boolean> {
  try {
    const result = await execute(
      "DELETE FROM resale_transactions WHERE id = ?",
      [idSchema.parse(id)],
    );
    return result.affectedRows > 0;
  } catch (error) {
    return handleDbError(error);
  }
}
