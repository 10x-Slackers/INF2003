import { randomUUID } from "node:crypto";
import { MongoError } from "mongodb";
import { db } from "@/lib/db";
import {
  createSearchLogSchema,
  idSchema,
  type SearchLog,
  type SearchLogCreate,
  type SearchLogUpdate,
  updateSearchLogSchema,
} from "./type";

const searchHistory = db.collection<SearchLog>("search_history");
const now = () => Math.floor(Date.now() / 1000);
type CollectionResult<T> = T | Error;
const handleError = (error: unknown) => {
  if (error instanceof MongoError) {
    throw error;
  }
  return error instanceof Error ? error : new Error(String(error));
};

export async function listSearchLogs(
  userId?: string,
): Promise<CollectionResult<SearchLog[]>> {
  try {
    return await searchHistory
      .find(userId ? { user_id: idSchema.parse(userId) } : {})
      .sort({ searched_at: -1 })
      .limit(50)
      .toArray();
  } catch (error) {
    return handleError(error);
  }
}

export async function getSearchLogById(
  id: string,
): Promise<CollectionResult<SearchLog | null>> {
  try {
    return await searchHistory.findOne({ _id: idSchema.parse(id) });
  } catch (error) {
    return handleError(error);
  }
}

export async function createSearchLog(
  input: SearchLogCreate,
): Promise<CollectionResult<SearchLog>> {
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
    return handleError(error);
  }
}

export async function updateSearchLog(
  id: string,
  input: SearchLogUpdate,
): Promise<CollectionResult<SearchLog | null>> {
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
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteSearchLog(
  id: string,
): Promise<CollectionResult<boolean>> {
  try {
    const result = await searchHistory.deleteOne({ _id: idSchema.parse(id) });
    return result.deletedCount > 0;
  } catch (error) {
    return handleError(error);
  }
}
