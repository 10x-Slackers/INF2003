import {
  getStatisticsByMetricAndDimensions,
  metricsSchema,
} from "@/lib/collections/statistics";
import { listFlatTypes } from "@/lib/tables/lookups";
import type { z } from "zod";

type FlatTypeSeries = {
  series: { period: string; value: number; sampleSize: number }[];
  timeRange: { start: string; end: string };
  computedAt: number;
};

type FlatTypeTrend = {
  id: number;
  name: string;
  monthly?: FlatTypeSeries;
  yearly?: FlatTypeSeries;
};

export type FlatTypeTrends = {
  flatTypes: FlatTypeTrend[];
};

async function getTrendsByMetric(
  metric: z.infer<typeof metricsSchema>,
): Promise<FlatTypeTrends> {
  const flatTypes = await listFlatTypes();

  const stats = await Promise.all(
    flatTypes.flatMap((flatType) =>
      (["monthly", "yearly"] as const).map(async (granularity) => ({
        flatType,
        granularity,
        statistic: await getStatisticsByMetricAndDimensions({
          metric,
          granularity,
          dimensions: {
            townId: null,
            flatTypeId: String(flatType.id),
            propertyId: null,
          },
        }),
      })),
    ),
  );

  const byFlatType = new Map<
    number,
    { monthly?: FlatTypeSeries; yearly?: FlatTypeSeries }
  >();
  for (const { flatType, granularity, statistic } of stats) {
    if (!statistic?.series.length) continue;
    byFlatType.set(flatType.id, {
      ...byFlatType.get(flatType.id),
      [granularity]: {
        series: [...statistic.series].sort((a, b) =>
          a.period.localeCompare(b.period),
        ),
        timeRange: statistic.timeRange,
        computedAt: statistic.computedAt,
      },
    });
  }

  return {
    flatTypes: flatTypes
      .map((ft) => ({ id: ft.id, name: ft.name, ...byFlatType.get(ft.id) }))
      .filter((ft) => ft.monthly || ft.yearly),
  };
}

export function getAvgPriceByFlatType() {
  return getTrendsByMetric(metricsSchema.enum.AVG_PRICE_BY_FLAT_TYPE);
}

export function getPricePerSqmByFlatType() {
  return getTrendsByMetric(metricsSchema.enum.AVG_PRICE_PER_SQM_BY_FLAT_TYPE);
}
