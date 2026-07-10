import { db, findById, deleteDocById } from "@/lib/db";
import {
  bulkUpsertStatisticsSchema,
  statisticsListQuerySchema,
  statisticsSearchSchema,
  upsertStatisticsSchema,
  type BulkUpsertStatisticsResult,
  type Statistics,
  type StatisticsListQuery,
  type StatisticsSearch,
  type StatisticsUpsert,
} from "./types";
import { toStatisticsBulkOperations, toStatisticsDocument } from "./utils";
import { withDbError, now } from "@/lib/utils";

const statistics = db.collection<Statistics>("statistics");

export async function listStatistics(
  input: StatisticsListQuery,
): Promise<Statistics[]> {
  return withDbError(async () => {
    const data = statisticsListQuerySchema.parse(input);
    return await statistics
      .find({})
      .sort({ computedAt: -1 })
      .skip(data.page * data.pageSize)
      .limit(data.pageSize)
      .toArray();
  });
}

export async function getStatisticsById(
  id: string,
): Promise<Statistics | null> {
  return findById(statistics, id);
}

// checks if document exist, if it does, update it, if not, create a new one
export async function upsertStatistics(
  input: StatisticsUpsert,
): Promise<Statistics> {
  return withDbError(async () => {
    const data = upsertStatisticsSchema.parse(input);
    const document = toStatisticsDocument(data, now());
    const { _id, ...fields } = document;

    await statistics.updateOne({ _id }, { $set: fields }, { upsert: true });
    return document;
  });
}

export async function bulkUpsertStatistics(
  input: StatisticsUpsert[],
): Promise<BulkUpsertStatisticsResult> {
  return withDbError(async () => {
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

export async function deleteStatistics(id: string): Promise<boolean> {
  return deleteDocById(statistics, id);
}

export async function getStatisticsByMetricAndDimensions(
  input: StatisticsSearch,
): Promise<Statistics | null> {
  return withDbError(async () => {
    const data = statisticsSearchSchema.parse(input);
    return await statistics.findOne(
      Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== undefined),
      ),
    );
  });
}
