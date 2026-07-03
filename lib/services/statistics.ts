import {
  getTransactionStatistics,
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
};

async function buildStatistics({
  metric,
  transactionMetric,
  groupBy,
  filters = {},
}: StatisticBuild) {
  const groups: TransactionStatisticsGroup[] = ["period", ...groupBy];
  const monthlyTransactions = await getTransactionStatistics({
    metric: transactionMetric,
    groupBy: groups,
    granularity: "monthly",
    ...filters,
  });
  const yearlyTransactions = await getTransactionStatistics({
    metric: transactionMetric,
    groupBy: groups,
    granularity: "yearly",
    ...filters,
  });

  return [
    ...prepareStatistics(metric, "monthly", monthlyTransactions),
    ...prepareStatistics(metric, "yearly", yearlyTransactions),
  ];
}

async function upsertPreparedStatistics(stats: StatisticsUpsert[]) {
  if (stats.length === 0) return;
  await bulkUpsertStatistics(stats);
}

export async function updateTownStatistic(townId: string) {
  try {
    const stats = await buildStatistics({
      metric: METRICS.AVG_PRICE_BY_TOWN_AND_FLAT_TYPE,
      transactionMetric: "avg_price",
      groupBy: ["town_id", "flat_type_id"],
      filters: { town_id: townId },
    });

    await upsertPreparedStatistics(stats);
  } catch (error) {
    return handleDbError(error);
  }
}

export async function updatePropertyStatistic(propertyId: string) {
  try {
    const stats = await buildStatistics({
      metric: METRICS.AVG_PRICE_BY_PROPERTY_AND_FLAT_TYPE,
      transactionMetric: "avg_price",
      groupBy: ["property_id", "flat_type_id"],
      filters: { property_id: propertyId },
    });

    await upsertPreparedStatistics(stats);
  } catch (error) {
    return handleDbError(error);
  }
}

export async function updateStatistics() {
  try {
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
        await buildStatistics({
          metric: METRICS.AVG_PRICE_BY_STOREY_RANGE_AND_FLAT_TYPE,
          transactionMetric: "avg_price",
          groupBy: ["storey_range_id", "flat_type_id"],
        }),
      ]);
    const stats = [
      ...flatTypeStats,
      ...perSqmStats,
      ...leaseStats,
      ...storeyStats,
    ];

    await upsertPreparedStatistics(stats);
  } catch (error) {
    return handleDbError(error);
  }
}
