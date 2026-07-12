import { bulkUpdateTownProfileTransactionsLast6Months } from "@/lib/collections/town-profile";
import {
  flushStatisticsTrigger,
  getStatisticsTrigger,
} from "@/lib/collections/statistics-trigger";
import {
  metricsSchema,
  prepareStatistics,
  saveStats,
  type StatisticsUpsert,
} from "@/lib/collections/statistics";
import {
  getTownSalesCounts6Months,
  getTransactionStatistics,
  type TransactionStatisticsGroup,
  type TransactionStatisticsMetric,
  type TransactionStatisticsQuery,
} from "@/lib/tables/transactions";
import { listTowns } from "@/lib/tables/towns";

type StatsBuild = {
  metric: StatisticsUpsert["metric"];
  transactionMetric: TransactionStatisticsMetric;
  groupBy: TransactionStatisticsGroup[];
  filters?: Pick<TransactionStatisticsQuery, "town_id" | "property_id">;
};

async function buildStats({
  metric,
  transactionMetric,
  groupBy,
  filters = {},
}: StatsBuild) {
  const groups: TransactionStatisticsGroup[] = ["period", ...groupBy];
  const [monthlyTransactions, yearlyTransactions] = await Promise.all([
    getTransactionStatistics({
      metric: transactionMetric,
      groupBy: groups,
      granularity: "monthly",
      ...filters,
    }),
    getTransactionStatistics({
      metric: transactionMetric,
      groupBy: groups,
      granularity: "yearly",
      ...filters,
    }),
  ]);

  return [
    ...prepareStatistics(metric, "monthly", monthlyTransactions),
    ...prepareStatistics(metric, "yearly", yearlyTransactions),
  ];
}

async function buildTownStats(townId?: string) {
  return buildStats({
    metric: metricsSchema.enum.AVG_PRICE_BY_TOWN_AND_FLAT_TYPE,
    transactionMetric: "avg_price",
    groupBy: ["town_id", "flat_type_id"],
    filters: { town_id: townId },
  });
}

export async function buildAllTownStats(): Promise<StatisticsUpsert[]> {
  return buildTownStats();
}

async function buildPropertyStats(propertyId?: string) {
  return buildStats({
    metric: metricsSchema.enum.AVG_PRICE_BY_PROPERTY_AND_FLAT_TYPE,
    transactionMetric: "avg_price",
    groupBy: ["property_id", "flat_type_id"],
    filters: { property_id: propertyId },
  });
}

export async function buildAllPropertyStats(): Promise<StatisticsUpsert[]> {
  return buildPropertyStats();
}

export async function buildGlobalStats(): Promise<StatisticsUpsert[]> {
  const [flatTypeStats, perSqmStats] = await Promise.all([
    buildStats({
      metric: metricsSchema.enum.AVG_PRICE_BY_FLAT_TYPE,
      transactionMetric: "avg_price",
      groupBy: ["flat_type_id"],
    }),
    buildStats({
      metric: metricsSchema.enum.AVG_PRICE_PER_SQM_BY_FLAT_TYPE,
      transactionMetric: "avg_price_per_sqm",
      groupBy: ["flat_type_id"],
    }),
  ]);

  return [...flatTypeStats, ...perSqmStats];
}

export async function regenerateGeneralAndTownStatistics(): Promise<{
  statistics: number;
  towns: number;
}> {
  const townIds = (await listTowns()).map((town) => town.id);
  const [globalStats, townStats, townUpdates] = await Promise.all([
    buildGlobalStats(),
    buildAllTownStats(),
    buildTownCountUpdates(townIds),
  ]);
  const stats = [...globalStats, ...townStats];

  await saveStats(stats);
  await bulkUpdateTownProfileTransactionsLast6Months(townUpdates);
  await flushStatisticsTrigger();

  return { statistics: stats.length, towns: townIds.length };
}

export async function regeneratePropertyStatistics(): Promise<{
  statistics: number;
  properties: number;
}> {
  const stats = await buildAllPropertyStats();
  const propertyIds = new Set(
    stats.flatMap((stat) =>
      stat.dimensions.propertyId ? [stat.dimensions.propertyId] : [],
    ),
  );

  await saveStats(stats);

  return { statistics: stats.length, properties: propertyIds.size };
}

async function refreshTownStats(townId: string) {
  await saveStats(await buildTownStats(townId));
}

export async function refreshPropertyStats(propertyId: string) {
  await saveStats(await buildPropertyStats(propertyId));
}

async function refreshStats() {
  await saveStats(await buildGlobalStats());
}

export async function syncStats() {
  const { dirtyTownIds } = await getStatisticsTrigger();
  await refreshStats();

  if (dirtyTownIds.length > 0) {
    await bulkUpdateTownProfileTransactionsLast6Months(
      await buildTownCountUpdates(dirtyTownIds),
    );
    await Promise.all(dirtyTownIds.map((townId) => refreshTownStats(townId)));
  }
  await flushStatisticsTrigger();
}

export async function buildTownCountUpdates(
  townIds: string[],
): Promise<{ townId: string; transactionsLast6Months: number }[]> {
  const rows = await getTownSalesCounts6Months();
  const countByTown = new Map(
    rows.filter((row) => row.town_id).map((row) => [row.town_id!, row.value]),
  );

  return townIds.map((townId) => ({
    townId,
    transactionsLast6Months: countByTown.get(townId) ?? 0,
  }));
}
