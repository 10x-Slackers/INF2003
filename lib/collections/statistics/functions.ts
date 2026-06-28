import { randomUUID } from "node:crypto";
import { MongoError } from "mongodb";
import { db } from "@/lib/db";
import {
  createStatisticsSchema,
  idSchema,
  type Statistics,
  type StatisticsCreate,
  type StatisticsSearch,
  type StatisticsUpsert,
  statisticsSearchSchema,
  type StatisticsUpdate,
  upsertStatisticsSchema,
  updateStatisticsSchema,
} from "./type";

const statistics = db.collection<Statistics>("statistics");
const now = () => Math.floor(Date.now() / 1000);
type CollectionResult<T> = T | Error;
const handleError = (error: unknown) => {
  if (error instanceof MongoError) {
    throw error;
  }
  return error instanceof Error ? error : new Error(String(error));
};

export async function listStatistics(
  page: number,
  pageSize: number,
): Promise<CollectionResult<Statistics[]>> {
  try {
    return await statistics
      .find({})
      .sort({ computed_at: -1 })
      .skip(page * pageSize)
      .limit(pageSize)
      .toArray();
  } catch (error) {
    return handleError(error);
  }
}

export async function getStatisticsById(
  id: string,
): Promise<CollectionResult<Statistics | null>> {
  try {
    return await statistics.findOne({ _id: idSchema.parse(id) });
  } catch (error) {
    return handleError(error);
  }
}

export async function createStatistics(
  input: StatisticsCreate,
): Promise<CollectionResult<Statistics>> {
  try {
    const data = createStatisticsSchema.parse(input);
    const document = addUuidAndTime(data);

    await statistics.insertOne(document);
    return document;
  } catch (error) {
    return handleError(error);
  }
}

export async function upsertStatistics(
  input: StatisticsUpsert,
): Promise<CollectionResult<Statistics>> {
  try {
    const data = upsertStatisticsSchema.parse(input);
    const document: Statistics = { ...data, computed_at: now() };

    await statistics.updateOne(
      { _id: document._id },
      { $set: document },
      { upsert: true },
    );
    return document;
  } catch (error) {
    return handleError(error);
  }
}

export async function updateStatistics(
  id: string,
  input: StatisticsUpdate,
): Promise<CollectionResult<Statistics | null>> {
  try {
    const data = updateStatisticsSchema.parse(input);
    const parsedId = idSchema.parse(id);
    const result = await statistics.updateOne(
      { _id: parsedId },
      { $set: { ...data, computed_at: now() } },
    );

    return result.matchedCount
      ? await statistics.findOne({ _id: parsedId })
      : null;
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteStatistics(
  id: string,
): Promise<CollectionResult<boolean>> {
  try {
    const result = await statistics.deleteOne({ _id: idSchema.parse(id) });
    return result.deletedCount > 0;
  } catch (error) {
    return handleError(error);
  }
}

function addUuidAndTime(data: StatisticsCreate): Statistics {
  return {
    ...data,
    _id: randomUUID(),
    computed_at: now(),
  };
}

export async function getStatisticsByMetricAndDimensions(
  input: StatisticsSearch,
): Promise<CollectionResult<Statistics | null>> {
  try {
    const data = statisticsSearchSchema.parse(input);
    return await statistics.findOne(
      Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== undefined),
      ),
    );
  } catch (error) {
    return handleError(error);
  }
}
