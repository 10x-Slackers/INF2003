"use server";

import { assertAgent } from "@/lib/auth";
import { getSearchStats } from "@/lib/collections/search-logs";

export async function getSearchStatsAction() {
  await assertAgent();
  return getSearchStats();
}
