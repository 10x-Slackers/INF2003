import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import {
  createSearchLogSchema,
  idSchema,
  type SearchLog,
  type SearchLogCreate,
} from "./types";
import { handleDbError, now } from "@/lib/utils";

const searchHistory = db.collection<SearchLog>("search_history");
const DEFAULT_LIMIT = 50;

// set limit to 0 to return all search logs
export async function listSearchLogs(
  userId?: string,
  limit?: number,
): Promise<SearchLog[]> {
  try {
    return await searchHistory
      .find(userId ? { user_id: idSchema.parse(userId) } : {})
      .sort({ searched_at: -1 })
      .limit(limit ?? DEFAULT_LIMIT)
      .toArray();
  } catch (error) {
    return handleDbError(error);
  }
}

export async function getSearchLogById(id: string): Promise<SearchLog | null> {
  try {
    return await searchHistory.findOne({ _id: idSchema.parse(id) });
  } catch (error) {
    return handleDbError(error);
  }
}

export async function createSearchLog(
  input: SearchLogCreate,
): Promise<SearchLog> {
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
  } catch (error) {
    return handleDbError(error);
  }
}

export async function deleteSearchLog(id: string): Promise<boolean> {
  try {
    const result = await searchHistory.deleteOne({ _id: idSchema.parse(id) });
    return result.deletedCount > 0;
  } catch (error) {
    return handleDbError(error);
  }
}
