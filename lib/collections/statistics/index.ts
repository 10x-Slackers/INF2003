import { randomUUID } from "node:crypto";
import { db } from "@/lib/db/mongodb";
import { idSchema } from "@/lib/schema/mongodb-common";
import {
  createStatisticsSchema,
  type Statistics,
  type StatisticsCreate,
  type StatisticsUpdate,
  updateStatisticsSchema,
} from "@/lib/schema/statistics";

const statistics = db.collection<Statistics>("statistics");

const now = () => Math.floor(Date.now() / 1000);

export async function listStatistics(): Promise<Statistics[]> {
  return statistics.find({}).sort({ computed_at: -1 }).toArray();
}

export async function getStatisticsById(
  id: string,
): Promise<Statistics | null> {
  return statistics.findOne({ _id: idSchema.parse(id) });
}

export async function createStatistics(
  input: StatisticsCreate,
): Promise<Statistics> {
  const data = createStatisticsSchema.parse(input);
  const document: Statistics = {
    ...data,
    _id: data._id ?? randomUUID(),
    computed_at: now(),
  };

  await statistics.insertOne(document);
  return document;
}

export async function upsertStatistics(
  input: StatisticsCreate,
): Promise<Statistics> {
  const data = createStatisticsSchema.parse(input);
  const document: Statistics = {
    ...data,
    _id: data._id ?? randomUUID(),
    computed_at: now(),
  };

  await statistics.updateOne(
    { _id: document._id },
    { $set: document },
    { upsert: true },
  );
  return document;
}

export async function updateStatistics(
  id: string,
  input: StatisticsUpdate,
): Promise<Statistics | null> {
  const data = updateStatisticsSchema.parse(input);
  const parsedId = idSchema.parse(id);
  const result = await statistics.updateOne(
    { _id: parsedId },
    { $set: { ...data, computed_at: now() } },
  );

  return result.matchedCount ? statistics.findOne({ _id: parsedId }) : null;
}

export async function deleteStatistics(id: string): Promise<boolean> {
  const result = await statistics.deleteOne({ _id: idSchema.parse(id) });
  return result.deletedCount > 0;
}
