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
import { handleDbError } from "@/lib/utils";

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

async function buildTownStats(townId: string) {
  return buildStats({
    metric: metricsSchema.enum.AVG_PRICE_BY_TOWN_AND_FLAT_TYPE,
    transactionMetric: "avg_price",
    groupBy: ["town_id", "flat_type_id"],
    filters: { town_id: townId },
  });
}

export async function buildAllTownStats(): Promise<StatisticsUpsert[]> {
  return buildStats({
    metric: metricsSchema.enum.AVG_PRICE_BY_TOWN_AND_FLAT_TYPE,
    transactionMetric: "avg_price",
    groupBy: ["town_id", "flat_type_id"],
  });
}

async function buildPropertyStats(propertyId: string) {
  return buildStats({
    metric: metricsSchema.enum.AVG_PRICE_BY_PROPERTY_AND_FLAT_TYPE,
    transactionMetric: "avg_price",
    groupBy: ["property_id", "flat_type_id"],
    filters: { property_id: propertyId },
  });
}

export async function buildAllPropertyStats(): Promise<StatisticsUpsert[]> {
  return buildStats({
    metric: metricsSchema.enum.AVG_PRICE_BY_PROPERTY_AND_FLAT_TYPE,
    transactionMetric: "avg_price",
    groupBy: ["property_id", "flat_type_id"],
  });
}

export async function buildGlobalStats(): Promise<StatisticsUpsert[]> {
  const [flatTypeStats, perSqmStats, leaseStats, storeyStats] =
    await Promise.all([
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
      buildStats({
        metric: metricsSchema.enum.AVG_PRICE_BY_LEASE_REMAINING_AND_FLAT_TYPE,
        transactionMetric: "avg_price",
        groupBy: ["lease_remaining_year", "flat_type_id"],
      }),
      buildStats({
        metric: metricsSchema.enum.AVG_PRICE_BY_STOREY_RANGE_AND_FLAT_TYPE,
        transactionMetric: "avg_price",
        groupBy: ["storey_range_id", "flat_type_id"],
      }),
    ]);

  return [...flatTypeStats, ...perSqmStats, ...leaseStats, ...storeyStats];
}

async function refreshTownStats(townId: string) {
  try {
    await saveStats(await buildTownStats(townId));
  } catch (error) {
    return handleDbError(error);
  }
}

export async function refreshPropertyStats(propertyId: string) {
  try {
    await saveStats(await buildPropertyStats(propertyId));
  } catch (error) {
    return handleDbError(error);
  }
}

async function refreshStats() {
  try {
    await saveStats(await buildGlobalStats());
  } catch (error) {
    return handleDbError(error);
  }
}

export async function syncStats() {
  try {
    const { dirtyTownIds } = await getStatisticsTrigger();
    await refreshStats();

    if (dirtyTownIds.length > 0) {
      await bulkUpdateTownProfileTransactionsLast6Months(
        await buildTownCountUpdates(dirtyTownIds),
      );
      await Promise.all(dirtyTownIds.map((townId) => refreshTownStats(townId)));
    }
    await flushStatisticsTrigger();
  } catch (error) {
    return handleDbError(error);
  }
}

export async function buildTownCountUpdates(
  townIds: string[],
): Promise<{ townId: string; transactionsLast6Months: number }[]> {
  try {
    const rows = await getTownSalesCounts6Months();
    const countByTown = new Map(
      rows.filter((row) => row.town_id).map((row) => [row.town_id!, row.value]),
    );

    return townIds.map((townId) => ({
      townId,
      transactionsLast6Months: countByTown.get(townId) ?? 0,
    }));
  } catch (error) {
    return handleDbError(error);
  }
}
