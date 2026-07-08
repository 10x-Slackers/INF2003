import { db } from "@/lib/db";
import {
  bulkUpsertStatisticsSchema,
  idSchema,
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
import { handleDbError, now } from "@/lib/utils";

const statistics = db.collection<Statistics>("statistics");

export async function listStatistics(
  input: StatisticsListQuery,
): Promise<Statistics[]> {
  try {
    const data = statisticsListQuerySchema.parse(input);
    return await statistics
      .find({})
      .sort({ computedAt: -1 })
      .skip(data.page * data.pageSize)
      .limit(data.pageSize)
      .toArray();
  } catch (error) {
    return handleDbError(error);
  }
}

export async function getStatisticsById(
  id: string,
): Promise<Statistics | null> {
  try {
    return await statistics.findOne({ _id: idSchema.parse(id) });
  } catch (error) {
    return handleDbError(error);
  }
}

// checks if document exist, if it does, update it, if not, create a new one
export async function upsertStatistics(
  input: StatisticsUpsert,
): Promise<Statistics> {
  try {
    const data = upsertStatisticsSchema.parse(input);
    const document = toStatisticsDocument(data, now());
    const { _id, ...fields } = document;

    await statistics.updateOne({ _id }, { $set: fields }, { upsert: true });
    return document;
  } catch (error) {
    return handleDbError(error);
  }
}

export async function bulkUpsertStatistics(
  input: StatisticsUpsert[],
): Promise<BulkUpsertStatisticsResult> {
  try {
    const data = bulkUpsertStatisticsSchema.parse(input);
    const computedAt = now();
    const operations = toStatisticsBulkOperations(data, computedAt);
    const result = await statistics.bulkWrite(operations);

    return {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      upsertedCount: result.upsertedCount,
    };
  } catch (error) {
    return handleDbError(error);
  }
}

export async function saveStats(input: StatisticsUpsert[]): Promise<void> {
  if (input.length === 0) return;
  await bulkUpsertStatistics(input);
}

export async function deleteStatistics(id: string): Promise<boolean> {
  try {
    const result = await statistics.deleteOne({ _id: idSchema.parse(id) });
    return result.deletedCount > 0;
  } catch (error) {
    return handleDbError(error);
  }
}

export async function getStatisticsByMetricAndDimensions(
  input: StatisticsSearch,
): Promise<Statistics | null> {
  try {
    const data = statisticsSearchSchema.parse(input);
    return await statistics.findOne(
      Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== undefined),
      ),
    );
  } catch (error) {
    return handleDbError(error);
  }
}
