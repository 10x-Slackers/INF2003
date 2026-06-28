import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import {
  createSearchLogSchema,
  idSchema,
  type SearchLog,
  type SearchLogCreate,
  type SearchLogUpdate,
  updateSearchLogSchema,
} from "./types";
import { handleCollectionError, type CollectionResult } from "../utils";

const searchHistory = db.collection<SearchLog>("search_history");
const now = () => Math.floor(Date.now() / 1000);

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
    return handleCollectionError(error);
  }
}

export async function getSearchLogById(
  id: string,
): Promise<CollectionResult<SearchLog | null>> {
  try {
    return await searchHistory.findOne({ _id: idSchema.parse(id) });
  } catch (error) {
    return handleCollectionError(error);
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
    return handleCollectionError(error);
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
      { $set: { ...data, updated_at: now() } },
    );

    return result.matchedCount
      ? await searchHistory.findOne({ _id: parsedId })
      : null;
  } catch (error) {
    return handleCollectionError(error);
  }
}

export async function deleteSearchLog(
  id: string,
): Promise<CollectionResult<boolean>> {
  try {
    const result = await searchHistory.deleteOne({ _id: idSchema.parse(id) });
    return result.deletedCount > 0;
  } catch (error) {
    return handleCollectionError(error);
  }
}
