import { db, createWithUuid } from "@/lib/db";
import {
  createSearchLogSchema,
  type SearchLog,
  type SearchLogCreate,
} from "./types";
import { now } from "@/lib/utils";

const searchHistory = db.collection<SearchLog>("searchHistory");

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
