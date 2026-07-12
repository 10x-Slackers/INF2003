import { db, withMongoError } from "@/lib/db/mongodb";
import {
  bulkUpsertStatisticsSchema,
  statisticsSearchSchema,
  type BulkUpsertStatisticsResult,
  type Statistics,
  type StatisticsSearch,
  type StatisticsUpsert,
} from "./types";
import { toStatisticsBulkOperations } from "./utils";
import { now } from "@/lib/utils";

const statistics = db.collection<Statistics>("statistics");

async function bulkUpsertStatistics(
  input: StatisticsUpsert[],
): Promise<BulkUpsertStatisticsResult> {
  return withMongoError(async () => {
    const data = bulkUpsertStatisticsSchema.parse(input);
    const computedAt = now();
    const operations = toStatisticsBulkOperations(data, computedAt);
    const result = await statistics.bulkWrite(operations);

    return {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      upsertedCount: result.upsertedCount,
    };
  });
}

export async function saveStats(input: StatisticsUpsert[]): Promise<void> {
  if (input.length === 0) return;
  await bulkUpsertStatistics(input);
}

export async function getStatisticsByMetricAndDimensions(
  input: StatisticsSearch,
): Promise<Statistics | null> {
  return withMongoError(async () => {
    const data = statisticsSearchSchema.parse(input);
    return await statistics.findOne(
      Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== undefined),
      ),
    );
  });
}
