import { randomUUID } from "node:crypto";
import { db } from "@/lib/db/mongodb";
import { idSchema, now } from "@/lib/schema/mongodb-common";
import {
  createStatisticsSchema,
  type Statistics,
  type StatisticsCreate,
  type StatisticsSearch,
  type StatisticsUpsert,
  statisticsSearchSchema,
  type StatisticsUpdate,
  upsertStatisticsSchema,
  updateStatisticsSchema,
} from "@/lib/schema/statistics";

const statistics = db.collection<Statistics>("statistics");

export async function listStatistics(): Promise<Statistics[] | null> {
  try {
    return await statistics.find({}).sort({ computed_at: -1 }).toArray();
  } catch {
    return null;
  }
}

export async function getStatisticsById(
  id: string,
): Promise<Statistics | null> {
  try {
    return await statistics.findOne({ _id: idSchema.parse(id) });
  } catch {
    return null;
  }
}

export async function createStatistics(
  input: StatisticsCreate,
): Promise<Statistics | null> {
  try {
    const data = createStatisticsSchema.parse(input);
    const document = addUuidAndTime(data);

    await statistics.insertOne(document);
    return document;
  } catch {
    return null;
  }
}

export async function upsertStatistics(
  input: StatisticsUpsert,
): Promise<Statistics | null> {
  try {
    const data = upsertStatisticsSchema.parse(input);
    const document: Statistics = { ...data, computed_at: now() };

    await statistics.updateOne(
      { _id: document._id },
      { $set: document },
      { upsert: true },
    );
    return document;
  } catch {
    return null;
  }
}

export async function updateStatistics(
  id: string,
  input: StatisticsUpdate,
): Promise<Statistics | null> {
  try {
    const data = updateStatisticsSchema.parse(input);
    const parsedId = idSchema.parse(id);
    const result = await statistics.updateOne(
      { _id: parsedId },
      { $set: { ...data, computed_at: now() } },
    );

    return result.matchedCount ? statistics.findOne({ _id: parsedId }) : null;
  } catch {
    return null;
  }
}

export async function deleteStatistics(id: string): Promise<boolean | null> {
  try {
    const result = await statistics.deleteOne({ _id: idSchema.parse(id) });
    return result.deletedCount > 0;
  } catch {
    return null;
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
): Promise<Statistics | null> {
  try {
    const data = statisticsSearchSchema.parse(input);
    return await statistics.findOne(
      Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== undefined),
      ),
    );
  } catch {
    return null;
  }
}
