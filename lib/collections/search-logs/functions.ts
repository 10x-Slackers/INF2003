import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import {
  createSearchLogSchema,
  idSchema,
  searchLogListQuerySchema,
  type SearchLog,
  type SearchLogCreate,
  type SearchLogListQuery,
} from "./types";
import { handleDbError } from "@/lib/db-errors";
import { now } from "@/lib/utils";

const searchHistory = db.collection<SearchLog>("searchHistory");
const DEFAULT_LIMIT = 50;

// set limit to 0 to return all search logs
export async function listSearchLogs(
  input: SearchLogListQuery = {},
): Promise<SearchLog[]> {
  try {
    const data = searchLogListQuerySchema.parse(input);
    return await searchHistory
      .find(data.userId ? { userId: data.userId } : {})
      .sort({ searchedAt: -1 })
      .limit(data.limit ?? DEFAULT_LIMIT)
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
      userId: data.userId,
      query: data.query,
      searchedAt: now(),
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
