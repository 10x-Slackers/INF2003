import { db, findById, deleteDocById, createWithUuid } from "@/lib/db";
import {
  createSearchLogSchema,
  searchLogListQuerySchema,
  type SearchLog,
  type SearchLogCreate,
  type SearchLogListQuery,
} from "./types";
import { withDbError, now } from "@/lib/utils";

const searchHistory = db.collection<SearchLog>("searchHistory");
const DEFAULT_LIMIT = 50;

// set limit to 0 to return all search logs
export async function listSearchLogs(
  input: SearchLogListQuery = {},
): Promise<SearchLog[]> {
  return withDbError(async () => {
    const data = searchLogListQuerySchema.parse(input);
    return await searchHistory
      .find(data.userId ? { userId: data.userId } : {})
      .sort({ searchedAt: -1 })
      .limit(data.limit ?? DEFAULT_LIMIT)
      .toArray();
  });
}

export async function getSearchLogById(id: string): Promise<SearchLog | null> {
  return findById(searchHistory, id);
}

export async function createSearchLog(
  input: SearchLogCreate,
): Promise<SearchLog> {
  const data = createSearchLogSchema.parse(input);
  return createWithUuid(searchHistory, {
    userId: data.userId ?? null,
    query: data.query,
    searchedAt: now(),
  });
}

export async function deleteSearchLog(id: string): Promise<boolean> {
  return deleteDocById(searchHistory, id);
}
