import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import {
  idSchema,
  type Statistics,
  type StatisticsSearch,
  type StatisticsUpsert,
  statisticsSearchSchema,
  upsertStatisticsSchema,
} from "./types";
import { handleDbError, now } from "@/lib/utils";

const statistics = db.collection<Statistics>("statistics");

export async function listStatistics(
  page: number,
  pageSize: number,
): Promise<Statistics[]> {
  try {
    return await statistics
      .find({})
      .sort({ computed_at: -1 })
      .skip(page * pageSize)
      .limit(pageSize)
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
    const document: Statistics = {
      ...data,
      computed_at: now(),
      _id: data._id ?? randomUUID(),
    };

    await statistics.updateOne(
      { _id: document._id },
      { $set: document },
      { upsert: true },
    );
    return document;
  } catch (error) {
    return handleDbError(error);
  }
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
