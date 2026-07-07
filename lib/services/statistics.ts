import { bulkUpdateTownProfileTransactionsLast6Months } from "../collections/town-profile";
import {
  getTransactionStatistics,
  transactionStatisticsGranularitySchema,
  transactionStatisticsMetricSchema,
  type TransactionStatisticsGroup,
  type TransactionStatisticsMetric,
  type TransactionStatisticsQuery,
} from "../tables/transactions";
import { handleDbError } from "../utils";
import {
  bulkUpsertStatistics,
  prepareStatistics,
  type StatisticsUpsert,
} from "@/lib/collections/statistics";
import {
  flushStatisticsTrigger,
  getStatisticsTrigger,
} from "@/lib/collections/statistics-trigger";
import { metricsSchema } from "@/lib/collections/statistics";
import { listTowns } from "@/lib/tables/towns";

type StatisticBuild = {
  metric: StatisticsUpsert["metric"];
  transactionMetric: TransactionStatisticsMetric;
  groupBy: TransactionStatisticsGroup[];
  filters?: Pick<TransactionStatisticsQuery, "town_id" | "property_id">;
};

async function buildStatistics({
  metric,
  transactionMetric,
  groupBy,
  filters = {},
}: StatisticBuild) {
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

async function buildTownStatistics(townId: string) {
  return buildStatistics({
    metric: metricsSchema.enum.AVG_PRICE_BY_TOWN_AND_FLAT_TYPE,
    transactionMetric: "avg_price",
    groupBy: ["town_id", "flat_type_id"],
    filters: { town_id: townId },
  });
}

async function buildAllTownStatistics() {
  return buildStatistics({
    metric: metricsSchema.enum.AVG_PRICE_BY_TOWN_AND_FLAT_TYPE,
    transactionMetric: "avg_price",
    groupBy: ["town_id", "flat_type_id"],
  });
}

async function buildPropertyStatistics(propertyId: string) {
  return buildStatistics({
    metric: metricsSchema.enum.AVG_PRICE_BY_PROPERTY_AND_FLAT_TYPE,
    transactionMetric: "avg_price",
    groupBy: ["property_id", "flat_type_id"],
    filters: { property_id: propertyId },
  });
}

async function buildAllPropertyStatistics() {
  return buildStatistics({
    metric: metricsSchema.enum.AVG_PRICE_BY_PROPERTY_AND_FLAT_TYPE,
    transactionMetric: "avg_price",
    groupBy: ["property_id", "flat_type_id"],
  });
}

async function buildGlobalStatistics() {
  const [flatTypeStats, perSqmStats, leaseStats, storeyStats] =
    await Promise.all([
      buildStatistics({
        metric: metricsSchema.enum.AVG_PRICE_BY_FLAT_TYPE,
        transactionMetric: "avg_price",
        groupBy: ["flat_type_id"],
      }),
      buildStatistics({
        metric: metricsSchema.enum.AVG_PRICE_PER_SQM_BY_FLAT_TYPE,
        transactionMetric: "avg_price_per_sqm",
        groupBy: ["flat_type_id"],
      }),
      buildStatistics({
        metric: metricsSchema.enum.AVG_PRICE_BY_LEASE_REMAINING_AND_FLAT_TYPE,
        transactionMetric: "avg_price",
        groupBy: ["lease_remaining_year", "flat_type_id"],
      }),
      buildStatistics({
        metric: metricsSchema.enum.AVG_PRICE_BY_STOREY_RANGE_AND_FLAT_TYPE,
        transactionMetric: "avg_price",
        groupBy: ["storey_range_id", "flat_type_id"],
      }),
    ]);

  return [...flatTypeStats, ...perSqmStats, ...leaseStats, ...storeyStats];
}

async function upsertPreparedStatistics(stats: StatisticsUpsert[]) {
  if (stats.length === 0) return;
  await bulkUpsertStatistics(stats);
}

async function updateTownStatistic(townId: string) {
  try {
    await upsertPreparedStatistics(await buildTownStatistics(townId));
  } catch (error) {
    return handleDbError(error);
  }
}

export async function updatePropertyStatistic(propertyId: string) {
  try {
    await upsertPreparedStatistics(await buildPropertyStatistics(propertyId));
  } catch (error) {
    return handleDbError(error);
  }
}

async function updateStatistics() {
  try {
    await upsertPreparedStatistics(await buildGlobalStatistics());
  } catch (error) {
    return handleDbError(error);
  }
}

export async function forceGenerateStatisticsExceptProperties() {
  try {
    const townIds = (await listTowns()).map((town) => town.id);
    const [globalStats, townStats, townUpdates] = await Promise.all([
      buildGlobalStatistics(),
      buildAllTownStatistics(),
      buildTownLast6MonthsUpdates(townIds),
    ]);
    const stats = [...globalStats, ...townStats];

    await upsertPreparedStatistics(stats);
    await bulkUpdateTownProfileTransactionsLast6Months(townUpdates);
    await flushStatisticsTrigger();

    return { statistics: stats.length, towns: townIds.length };
  } catch (error) {
    return handleDbError(error);
  }
}

export async function forceGeneratePropertyStatistics() {
  try {
    const stats = await buildAllPropertyStatistics();
    const propertyIds = new Set<string>();

    for (const stat of stats) {
      if (stat.dimensions.propertyId)
        propertyIds.add(stat.dimensions.propertyId);
    }

    await upsertPreparedStatistics(stats);

    return { statistics: stats.length, properties: propertyIds.size };
  } catch (error) {
    return handleDbError(error);
  }
}

export async function runStatisticsTrigger() {
  try {
    const { dirtyTownIds } = await getStatisticsTrigger();
    await updateStatistics();

    if (dirtyTownIds.length > 0) {
      await bulkUpdateTownProfileTransactionsLast6Months(
        await buildTownLast6MonthsUpdates(dirtyTownIds),
      );
      await Promise.all(
        dirtyTownIds.map((townId) => updateTownStatistic(townId)),
      );
    }
    await flushStatisticsTrigger();
  } catch (error) {
    return handleDbError(error);
  }
}

async function buildTownLast6MonthsUpdates(townIds: string[]) {
  try {
    const rows = await getTransactionStatistics({
      metric: transactionStatisticsMetricSchema.enum.sales_count,
      granularity: transactionStatisticsGranularitySchema.enum["last 6 months"],
      groupBy: ["town_id"],
    });
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
