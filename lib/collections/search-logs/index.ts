import { randomUUID } from "node:crypto";
import { db } from "@/lib/db/mongodb";
import { idSchema, now } from "@/lib/schema/mongodb-common";
import {
  createSearchLogSchema,
  SearchLogCreate,
  SearchLogUpdate,
  updateSearchLogSchema,
  SearchLog,
} from "@/lib/schema/search-log";

const searchHistory = db.collection<SearchLog>("search_history");

export async function listSearchLogs(
  userId?: string,
): Promise<SearchLog[] | null> {
  try {
    return await searchHistory
      .find(userId ? { user_id: idSchema.parse(userId) } : {})
      .sort({ searched_at: -1 })
      .limit(50)
      .toArray();
  } catch {
    return null;
  }
}

export async function getSearchLogById(id: string): Promise<SearchLog | null> {
  try {
    return await searchHistory.findOne({ _id: idSchema.parse(id) });
  } catch {
    return null;
  }
}

export async function createSearchLog(
  input: SearchLogCreate,
): Promise<SearchLog | null> {
  try {
    const data = createSearchLogSchema.parse(input);
    const searchLog: SearchLog = {
      _id: randomUUID(),
      user_id: data.user_id,
      query: data.query,
      searched_at: now(),
    };

    await searchHistory.insertOne(searchLog);
    return searchLog;
  } catch {
    return null;
  }
}

export async function updateSearchLog(
  id: string,
  input: SearchLogUpdate,
): Promise<SearchLog | null> {
  try {
    const data = updateSearchLogSchema.parse(input);
    const parsedId = idSchema.parse(id);
    const result = await searchHistory.updateOne(
      { _id: parsedId },
      { $set: { ...data } },
    );

    return result.matchedCount
      ? searchHistory.findOne({ _id: parsedId })
      : null;
  } catch {
    return null;
  }
}

export async function deleteSearchLog(id: string): Promise<boolean | null> {
  try {
    const result = await searchHistory.deleteOne({ _id: idSchema.parse(id) });
    return result.deletedCount > 0;
  } catch {
    return null;
  }
}
