import type { AnyBulkWriteOperation } from "mongodb";
import { type Statistics, type StatisticsUpsert, metricsSchema } from "./types";
import { z } from "zod";
import type { TransactionStatisticRow } from "../../tables/transactions/types";

type StatisticRow = TransactionStatisticRow;

type StatisticsMetrics = z.infer<typeof metricsSchema>;

export type StatisticGranularity = StatisticsUpsert["granularity"];

const STOREY_RANGES = [
  { label: "1-10", min: 1, max: 10 },
  { label: "11-20", min: 11, max: 20 },
  { label: "20+", min: 21, max: null },
] as const;

function baseDimensions(): StatisticsUpsert["dimensions"] {
  return {
    townId: null,
    flatTypeId: null,
    propertyId: null,
    leaseRemaining: null,
    storey: null,
  };
}

function storeyKey(data: StatisticsUpsert["dimensions"]["storey"]): string {
  if (!data) return "all";
  if (data.label) return data.label;
  return `${data.min ?? "all"}-${data.max ?? "all"}`;
}

function storeyDimension(
  label: number | string | undefined,
): StatisticsUpsert["dimensions"]["storey"] {
  const range = STOREY_RANGES.find((r) => r.label === label);
  if (range) return { min: range.min, max: range.max, label: range.label };
  return {
    min: null,
    max: null,
    label: label === undefined ? null : String(label),
  };
}

export function getStatisticsId(data: StatisticsUpsert): string {
  const id: string[] = [];

  id.push(data.metric);
  id.push(data.granularity);

  const { townId, flatTypeId, propertyId, leaseRemaining, storey } =
    data.dimensions;

  if (townId) id.push(`town:${townId}`);
  if (flatTypeId) id.push(`flatType:${flatTypeId}`);
  if (propertyId) id.push(`property:${propertyId}`);

  if (leaseRemaining?.year != null) {
    id.push(String(leaseRemaining.year));
  }

  if (storey?.label != null) {
    id.push(storeyKey(storey));
  }
  return id.join("|");
}

export function toStatisticsDocument(
  data: StatisticsUpsert,
  computedAt: number,
): Statistics {
  return {
    ...data,
    _id: data._id ?? getStatisticsId(data),
    computedAt,
  };
}

export function toStatisticsBulkOperations(
  data: StatisticsUpsert[],
  computedAt: number,
): AnyBulkWriteOperation<Statistics>[] {
  return data.map((item) => {
    const document = toStatisticsDocument(item, computedAt);
    const { _id, ...fields } = document;

    return {
      updateOne: {
        filter: { _id },
        update: { $set: fields },
        upsert: true,
      },
    };
  });
}

function dimensionsForRow(
  metric: StatisticsMetrics,
  row: StatisticRow,
): StatisticsUpsert["dimensions"] {
  const dimensions = baseDimensions();

  if (row.flat_type_id !== undefined) {
    dimensions.flatTypeId = String(row.flat_type_id);
  }
  if (metric === metricsSchema.enum.AVG_PRICE_BY_TOWN_AND_FLAT_TYPE) {
    dimensions.townId = row.town_id ?? null;
  }
  if (metric === metricsSchema.enum.AVG_PRICE_BY_PROPERTY_AND_FLAT_TYPE) {
    dimensions.propertyId = row.property_id ?? null;
  }
  if (
    metric === metricsSchema.enum.AVG_PRICE_BY_LEASE_REMAINING_AND_FLAT_TYPE
  ) {
    dimensions.leaseRemaining = { year: row.lease_remaining_year ?? null };
  }
  if (metric === metricsSchema.enum.AVG_PRICE_BY_STOREY_RANGE_AND_FLAT_TYPE) {
    dimensions.storey = storeyDimension(row.storey_range_id);
  }

  return dimensions;
}

export function prepareStatistics(
  metric: StatisticsMetrics,
  granularity: StatisticGranularity,
  rows: StatisticRow[],
): StatisticsUpsert[] {
  const documents = new Map<string, StatisticsUpsert>();

  for (const row of rows) {
    if (!row.period) continue;

    const period = row.period;
    const timeRange = { start: period, end: period };

    const dimensions = dimensionsForRow(metric, row);
    const key = JSON.stringify(dimensions);
    const document = documents.get(key);
    const point = {
      period,
      value: row.value,
      sampleSize: row.sample_size,
    };

    if (document) {
      document.series.push(point);
      document.timeRange.end = point.period;
    } else {
      documents.set(key, {
        metric,
        granularity,
        timeRange,
        dimensions,
        series: [point],
      });
    }
  }

  return [...documents.values()];
}
