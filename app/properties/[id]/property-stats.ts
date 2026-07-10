import { getStatisticsByMetricAndDimensions } from "@/lib/collections/statistics";
import { listFlatTypes } from "@/lib/tables/lookups";
import {
  listTransactions,
  type TransactionListItem,
} from "@/lib/tables/transactions";

export type PropertyStatsData = {
  flatTypes: {
    name: string;
    chartData: { period: string; value: number }[];
    minPrice: number;
    maxPrice: number;
  }[];
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
  const [flatTypes, transactions] = await Promise.all([
    listFlatTypes(),
    fetchAllTransactions(propertyId),
  ]);

  if (transactions.length === 0) return null;

  const flatTypeNameById = new Map(flatTypes.map((ft) => [ft.id, ft.name]));
  const flatTypeIdsInUse = [
    ...new Set(transactions.map((t) => t.flat_type_id)),
  ].sort((a, b) => a - b);

  const statsDocs = await Promise.all(
    flatTypeIdsInUse.map((flatTypeId) =>
      getStatisticsByMetricAndDimensions({
        metric: "AVG_PRICE_BY_PROPERTY_AND_FLAT_TYPE",
        dimensions: {
          townId: null,
          flatTypeId: String(flatTypeId),
          propertyId,
          leaseRemaining: null,
          storey: null,
        },
      }),
    ),
  );

  const priceRanges = computePriceRanges(transactions);
  const priceRangeMap = new Map(priceRanges.map((r) => [r.flatTypeName, r]));

  const result = flatTypeIdsInUse.map((flatTypeId, i) => {
    const name = flatTypeNameById.get(flatTypeId) ?? String(flatTypeId);
    const doc = statsDocs[i];
    const chartData = doc
      ? [...doc.series]
          .map((p) => ({ period: p.period, value: p.value }))
          .sort((a, b) => a.period.localeCompare(b.period))
      : [];
    const range = priceRangeMap.get(name);
    return {
      name,
      chartData,
      minPrice: range?.minPrice ?? 0,
      maxPrice: range?.maxPrice ?? 0,
    };
  });

  if (result.every((ft) => ft.chartData.length === 0)) return null;

  return { flatTypes: result };
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
