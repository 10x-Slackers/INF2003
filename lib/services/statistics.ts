import {
  getTransactionStatistics,
  type TransactionStatisticsGroup,
  type TransactionStatisticsGranularity,
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

export const METRICS = {
  AVG_PRICE_BY_FLAT_TYPE: "AVG_PRICE_BY_FLAT_TYPE",
  AVG_PRICE_PER_SQM_BY_FLAT_TYPE: "AVG_PRICE_PER_SQM_BY_FLAT_TYPE",
  AVG_PRICE_BY_TOWN_AND_FLAT_TYPE: "AVG_PRICE_BY_TOWN_AND_FLAT_TYPE",
  AVG_PRICE_BY_PROPERTY_AND_FLAT_TYPE: "AVG_PRICE_BY_PROPERTY_AND_FLAT_TYPE",
  AVG_PRICE_BY_LEASE_REMAINING_AND_FLAT_TYPE:
    "AVG_PRICE_BY_LEASE_REMAINING_AND_FLAT_TYPE",
  AVG_PRICE_BY_STOREY_RANGE_AND_FLAT_TYPE:
    "AVG_PRICE_BY_STOREY_RANGE_AND_FLAT_TYPE",
} as const;

type StatisticBuild = {
  metric: StatisticsUpsert["metric"];
  transactionMetric: TransactionStatisticsMetric;
  groupBy: TransactionStatisticsGroup[];
  filters?: Pick<TransactionStatisticsQuery, "town_id" | "property_id">;
  granularities?: TransactionStatisticsGranularity[];
};

async function buildStatistics({
  metric,
  transactionMetric,
  groupBy,
  filters = {},
  granularities = ["monthly", "yearly"],
}: StatisticBuild) {
  const groups: TransactionStatisticsGroup[] = ["period", ...groupBy];
  const rows = await Promise.all(
    granularities.map(async (granularity) => ({
      granularity,
      rows: await getTransactionStatistics({
        metric: transactionMetric,
        groupBy: groups,
        granularity,
        ...filters,
      }),
    })),
  );

  return rows.flatMap(({ granularity, rows }) =>
    prepareStatistics(metric, granularity, rows),
  );
}

async function buildTownStatistics(townId: string) {
  return buildStatistics({
    metric: METRICS.AVG_PRICE_BY_TOWN_AND_FLAT_TYPE,
    transactionMetric: "avg_price",
    groupBy: ["town_id", "flat_type_id"],
    filters: { town_id: townId },
    granularities: ["monthly", "yearly", "last 6 months"],
  });
}

async function buildPropertyStatistics(propertyId: string) {
  return buildStatistics({
    metric: METRICS.AVG_PRICE_BY_PROPERTY_AND_FLAT_TYPE,
    transactionMetric: "avg_price",
    groupBy: ["property_id", "flat_type_id"],
    filters: { property_id: propertyId },
  });
}

async function buildGlobalStatistics() {
  const [flatTypeStats, perSqmStats, leaseStats, storeyStats] =
    await Promise.all([
      buildStatistics({
        metric: METRICS.AVG_PRICE_BY_FLAT_TYPE,
        transactionMetric: "avg_price",
        groupBy: ["flat_type_id"],
      }),
      buildStatistics({
        metric: METRICS.AVG_PRICE_PER_SQM_BY_FLAT_TYPE,
        transactionMetric: "avg_price_per_sqm",
        groupBy: ["flat_type_id"],
      }),
      buildStatistics({
        metric: METRICS.AVG_PRICE_BY_LEASE_REMAINING_AND_FLAT_TYPE,
        transactionMetric: "avg_price",
        groupBy: ["lease_remaining_year", "flat_type_id"],
      }),
      buildStatistics({
        metric: METRICS.AVG_PRICE_BY_STOREY_RANGE_AND_FLAT_TYPE,
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

export async function updateTownStatistic(townId: string) {
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

export async function updateStatistics() {
  try {
    await upsertPreparedStatistics(await buildGlobalStatistics());
  } catch (error) {
    return handleDbError(error);
  }
}

export async function runStatisticsTrigger() {
  try {
    const { dirtyTownIds } = await getStatisticsTrigger();

    await updateStatistics();
    await Promise.all(
      dirtyTownIds.map((townId) => updateTownStatistic(townId)),
    );
    await flushStatisticsTrigger();
  } catch (error) {
    return handleDbError(error);
  }
}
