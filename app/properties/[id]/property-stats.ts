import { listFlatTypes } from "@/lib/tables/lookups";
import {
  getTransactionStatistics,
  listTransactions,
  type TransactionListItem,
  type TransactionStatisticRow,
} from "@/lib/tables/transactions";

export type PropertyStatsData = {
  chartData: Record<string, number | string>[];
  sqmChartData: Record<string, number | string>[];
  priceRanges: { flatTypeName: string; minPrice: number; maxPrice: number }[];
  flatTypeNames: string[];
};

const FETCH_PAGE_SIZE = 100;

async function fetchAllTransactions(
  propertyId: string,
): Promise<TransactionListItem[]> {
  const all: TransactionListItem[] = [];
  let page = 1;
  let total = Infinity;
  while (all.length < total) {
    const { data, total: t } = await listTransactions({
      property_id: propertyId,
      page,
      pageSize: FETCH_PAGE_SIZE,
    });
    all.push(...data);
    total = t;
    page++;
  }
  return all;
}

export async function getPropertyStats(
  propertyId: string,
): Promise<PropertyStatsData | null> {
  const [statsRows, sqmStatsRows, flatTypes, transactions] = await Promise.all([
    getTransactionStatistics({
      metric: "avg_price",
      granularity: "monthly",
      groupBy: ["period", "flat_type_id"],
      property_id: propertyId,
    }),
    getTransactionStatistics({
      metric: "avg_price_per_sqm",
      granularity: "monthly",
      groupBy: ["period", "flat_type_id"],
      property_id: propertyId,
    }),
    listFlatTypes(),
    fetchAllTransactions(propertyId),
  ]);

  if (statsRows.length === 0 && transactions.length === 0) return null;

  const flatTypeNameById = new Map(flatTypes.map((ft) => [ft.id, ft.name]));
  const flatTypeNames = resolveFlatTypeNames(
    statsRows,
    transactions,
    flatTypeNameById,
  );

  const chartData = pivotChart(statsRows, flatTypeNameById);
  const sqmChartData = pivotChart(sqmStatsRows, flatTypeNameById);
  const priceRanges = computePriceRanges(transactions);

  return { chartData, sqmChartData, priceRanges, flatTypeNames };
}

function resolveFlatTypeNames(
  statsRows: TransactionStatisticRow[],
  transactions: { flat_type_id: number }[],
  nameById: Map<number, string>,
): string[] {
  const ids = new Set<number>([
    ...statsRows
      .map((r) => r.flat_type_id)
      .filter((v): v is number => v !== undefined),
    ...transactions.map((t) => t.flat_type_id),
  ]);
  return [...ids]
    .map((id) => nameById.get(id) ?? String(id))
    .sort((a, b) => a.localeCompare(b));
}

function pivotChart(
  rows: TransactionStatisticRow[],
  nameById: Map<number, string>,
): Record<string, number | string>[] {
  const byPeriod = new Map<string, Record<string, number | string>>();
  for (const row of rows) {
    if (!row.period || row.flat_type_id === undefined) continue;
    const name = nameById.get(row.flat_type_id) ?? String(row.flat_type_id);
    const point = byPeriod.get(row.period) ?? { period: row.period };
    point[name] = row.value;
    byPeriod.set(row.period, point);
  }
  return [...byPeriod.values()].sort((a, b) =>
    String(a.period).localeCompare(String(b.period)),
  );
}

function computePriceRanges(
  transactions: { flat_type_name: string; resale_price: number }[],
): { flatTypeName: string; minPrice: number; maxPrice: number }[] {
  const ranges = new Map<string, { minPrice: number; maxPrice: number }>();
  for (const t of transactions) {
    const existing = ranges.get(t.flat_type_name);
    if (!existing) {
      ranges.set(t.flat_type_name, {
        minPrice: t.resale_price,
        maxPrice: t.resale_price,
      });
    } else {
      ranges.set(t.flat_type_name, {
        minPrice: Math.min(existing.minPrice, t.resale_price),
        maxPrice: Math.max(existing.maxPrice, t.resale_price),
      });
    }
  }
  return [...ranges.entries()]
    .map(([flatTypeName, { minPrice, maxPrice }]) => ({
      flatTypeName,
      minPrice,
      maxPrice,
    }))
    .sort((a, b) => a.flatTypeName.localeCompare(b.flatTypeName));
}
