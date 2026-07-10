import {
  execute,
  query,
  queryOne,
  executeReturning,
  addCondition,
  buildUpdateFields,
  deleteById,
  isEmptyUpdate,
} from "@/lib/db";
import { withDbError } from "@/lib/utils";
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
  type UpdateTransactionParams,
  createTransactionParamsSchema,
  transactionStatisticsQuerySchema,
  transactionListQuerySchema,
  updateTransactionParamsSchema,
  updateTransactionSchema,
} from "./types";
import { idSchema } from "../common";

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
  storey_range_id:
    "CASE WHEN sr.min_storey <= 10 THEN '1-10' WHEN sr.min_storey <= 20 THEN '11-20' ELSE '20+' END",
};

function periodExpression(granularity: TransactionStatisticsGranularity) {
  return `DATE_FORMAT(rt.transaction_month, '${
    granularity === "yearly" ? "%Y" : "%Y-%m"
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
  return withDbError(async () => {
    const data = transactionListQuerySchema.parse(filters);
    const { page, pageSize } = data;
    const conditions: string[] = [];
    const params: unknown[] = [];

    addCondition(conditions, params, data.town_id, "p.town_id", "=");
    addCondition(conditions, params, data.flat_type_id, "rt.flat_type_id", "=");
    addCondition(
      conditions,
      params,
      data.flat_model_id,
      "rt.flat_model_id",
      "=",
    );
    addCondition(
      conditions,
      params,
      data.storey_range_id,
      "rt.storey_range_id",
      "=",
    );
    addCondition(conditions, params, data.price_min, "rt.resale_price", ">=");
    addCondition(conditions, params, data.price_max, "rt.resale_price", "<=");
    if (data.year !== undefined) {
      conditions.push("rt.transaction_month >= ? AND rt.transaction_month < ?");
      params.push(`${data.year}-01-01`, `${data.year + 1}-01-01`);
    }
    addCondition(conditions, params, data.property_id, "rt.property_id", "=");

    const where =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countJoin = data.town_id
      ? "JOIN properties p ON p.id = rt.property_id"
      : "";

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
         ${countJoin}
         ${where}`,
        params,
      ),
    ]);

    return {
      data: rows.map((row) => ({
        ...row,
        price_per_sqm: row.resale_price / row.floor_area_sqm,
      })),
      total: countRows[0].total,
    };
  });
}

export async function getTransactionStatistics(
  input: TransactionStatisticsQuery,
): Promise<TransactionStatisticRow[]> {
  return withDbError(async () => {
    const data = transactionStatisticsQuerySchema.parse(input);
    const groups = data.groupBy.map((group) => ({
      name: group,
      expression: statisticGroupExpression(group, data.granularity),
    }));
    const conditions: string[] = [];
    const params: unknown[] = [];
    addCondition(
      conditions,
      params,
      data.date_from,
      "rt.transaction_month",
      ">=",
    );
    addCondition(conditions, params, data.date_to, "rt.transaction_month", "<");
    if (data.granularity === "last 6 months") {
      conditions.push(
        "rt.transaction_month >= DATE_SUB((SELECT MAX(transaction_month) FROM resale_transactions), INTERVAL 5 MONTH)",
      );
    }
    addCondition(conditions, params, data.town_id, "p.town_id", "=");
    addCondition(conditions, params, data.flat_type_id, "rt.flat_type_id", "=");
    addCondition(conditions, params, data.property_id, "rt.property_id", "=");
    addCondition(
      conditions,
      params,
      data.storey_range_id,
      "rt.storey_range_id",
      "=",
    );

    const needsProperties =
      data.town_id !== undefined ||
      data.groupBy.includes("town_id") ||
      data.groupBy.includes("lease_remaining_year");
    const needsStoreyRanges = data.groupBy.includes("storey_range_id");

    const propertyJoin = needsProperties
      ? "JOIN properties p ON p.id = rt.property_id"
      : "";
    const storeyRangeJoin = needsStoreyRanges
      ? "JOIN storey_ranges sr ON sr.id = rt.storey_range_id"
      : "";

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
       ${propertyJoin}
       ${storeyRangeJoin}
       ${where}
       GROUP BY ${groupBy}
       ORDER BY ${orderBy}`,
      params,
    );
  });
}

export async function getTownSalesCounts6Months(): Promise<
  TransactionStatisticRow[]
> {
  return getTransactionStatistics({
    metric: "sales_count",
    granularity: "last 6 months",
    groupBy: ["town_id"],
  });
}

export async function getTransactionById(
  id: string,
): Promise<ResaleTransaction | null> {
  return withDbError(() =>
    queryOne<ResaleTransaction>(
      `SELECT ${TRANSACTION_COLUMNS}
     FROM resale_transactions rt WHERE rt.id = ? LIMIT 1`,
      [idSchema.parse(id)],
    ),
  );
}

export async function createTransaction(
  input: CreateTransactionParams,
): Promise<string> {
  return withDbError(async () => {
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
        `${data.transaction_month}-01`,
        data.resale_price,
      ],
    );
    return result[0].id;
  });
}

export async function updateTransaction(
  input: UpdateTransactionParams,
): Promise<ResaleTransaction | null> {
  return withDbError(async () => {
    const parsed = updateTransactionParamsSchema.parse(input);
    if (isEmptyUpdate(parsed.input)) return getTransactionById(parsed.id);

    const data = updateTransactionSchema.parse(parsed.input);
    const existing = await getTransactionById(parsed.id);
    if (!existing) return null;

    const transformed = { ...data };
    if (transformed.transaction_month !== undefined) {
      transformed.transaction_month =
        `${transformed.transaction_month}-01` as never;
    }
    const { setClause, params } = buildUpdateFields(transformed);
    await execute(`UPDATE resale_transactions SET ${setClause} WHERE id = ?`, [
      ...params,
      parsed.id,
    ] as (string | number)[]);
    return getTransactionById(parsed.id);
  });
}

export async function deleteTransaction(id: string): Promise<boolean> {
  return deleteById("resale_transactions", id);
}
