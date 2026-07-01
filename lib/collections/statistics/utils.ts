import type { AnyBulkWriteOperation } from "mongodb";
import type { Statistics, StatisticsUpsert } from "./types";

function storeyKey(data: StatisticsUpsert["dimensions"]["storey"]): string {
  if (!data) return "all";
  if (data.label) return data.label;
  return `${data.min ?? "all"}-${data.max ?? "all"}`;
}

export function getStatisticsId(data: StatisticsUpsert): string {
  return [
    data.metric,
    data.granularity,
    data.timeRange.start,
    data.timeRange.end,
    `town:${data.dimensions.townId ?? "all"}`,
    `flatType:${data.dimensions.flatTypeId ?? "all"}`,
    `property:${data.dimensions.propertyId ?? "all"}`,
    `lease:${data.dimensions.leaseRemaining?.year ?? "all"}`,
    `storey:${storeyKey(data.dimensions.storey)}`,
  ].join(":");
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
