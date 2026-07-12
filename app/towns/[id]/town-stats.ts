import { getStatisticsByMetricAndDimensions } from "@/lib/collections/statistics";
import { getTownProfileById } from "@/lib/collections/town-profile";
import { listFlatTypes } from "@/lib/tables/lookups";

type PriceSeries = {
  series: { period: string; value: number; sampleSize: number }[];
  timeRange: { start: string; end: string };
  computedAt: number;
};

export type TownStatsData = {
  profile: {
    totalTransactions: number;
    transactionsLast6Months: number;
  } | null;
  flatTypes: {
    name: string;
    transactionCount?: number;
    monthly?: PriceSeries;
    yearly?: PriceSeries;
  }[];
};

export async function getTownStats(townId: string): Promise<TownStatsData> {
  const [profile, flatTypes] = await Promise.all([
    getTownProfileById(townId),
    listFlatTypes(),
  ]);
  const statistics = await Promise.all(
    flatTypes.flatMap((flatType) =>
      (["monthly", "yearly"] as const).map(async (granularity) => ({
        flatType,
        granularity,
        statistic: await getStatisticsByMetricAndDimensions({
          metric: "AVG_PRICE_BY_TOWN_AND_FLAT_TYPE",
          granularity,
          dimensions: {
            townId,
            flatTypeId: String(flatType.id),
            propertyId: null,
          },
        }),
      })),
    ),
  );

  const countByFlatType =
    profile?.transactionSummary.transactionCountByFlatType;
  const statsByFlatType = new Map<
    number,
    { monthly?: PriceSeries; yearly?: PriceSeries }
  >();

  for (const { flatType, granularity, statistic } of statistics) {
    if (!statistic?.series.length) continue;
    const series = {
      series: [...statistic.series].sort((a, b) =>
        a.period.localeCompare(b.period),
      ),
      timeRange: statistic.timeRange,
      computedAt: statistic.computedAt,
    };
    statsByFlatType.set(flatType.id, {
      ...statsByFlatType.get(flatType.id),
      [granularity]: series,
    });
  }

  return {
    profile: profile && {
      totalTransactions: profile.transactionSummary.totalTransaction,
      transactionsLast6Months:
        profile.transactionSummary.transactionsLast6Months,
    },
    flatTypes: flatTypes
      .map((flatType) => ({
        name: flatType.name,
        transactionCount: countByFlatType?.[String(flatType.id)],
        ...statsByFlatType.get(flatType.id),
      }))
      .filter(
        (flatType) =>
          flatType.transactionCount !== undefined ||
          flatType.monthly ||
          flatType.yearly,
      ),
  };
}
