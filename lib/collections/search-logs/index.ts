import { randomUUID } from "node:crypto";
import { db } from "@/lib/db/mongodb";
import { idSchema } from "@/lib/schema/mongodb-common";
import {
  createSearchLogSchema,
  SearchLogCreate,
  SearchLogUpdate,
  updateSearchLogSchema,
  SearchLog,
} from "@/lib/schema/search-log";

const searchHistory = db.collection<SearchLog>("search_history");

const now = () => Math.floor(Date.now() / 1000);

export async function listSearchLogs(userId?: string): Promise<SearchLog[]> {
  return searchHistory
    .find(userId ? { user_id: idSchema.parse(userId) } : {})
    .sort({ searched_at: -1 })
    .limit(50)
    .toArray();
}

export async function getSearchLogById(id: string): Promise<SearchLog | null> {
  return searchHistory.findOne({ _id: idSchema.parse(id) });
}

export async function createSearchLog(
  input: SearchLogCreate,
): Promise<SearchLog> {
  const data = createSearchLogSchema.parse(input);
  const searchLog: SearchLog = {
    _id: randomUUID(),
    user_id: data.user_id,
    query: data.query,
    searched_at: now(),
  };

  await searchHistory.insertOne(searchLog);
  return searchLog;
}

export async function updateSearchLog(
  id: string,
  input: SearchLogUpdate,
): Promise<SearchLog | null> {
  const data = updateSearchLogSchema.parse(input);
  const parsedId = idSchema.parse(id);
  const result = await searchHistory.updateOne(
    { _id: parsedId },
    { $set: { query: data.query } },
  );

  return result.matchedCount ? searchHistory.findOne({ _id: parsedId }) : null;
}

export async function deleteSearchLog(id: string): Promise<boolean> {
  const result = await searchHistory.deleteOne({ _id: idSchema.parse(id) });
  return result.deletedCount > 0;
}
