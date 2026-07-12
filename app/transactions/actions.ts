"use server";

import { assertAgent, auth } from "@/lib/auth";
import { addTransaction } from "@/lib/services/transaction";
import { searchPropertiesByAddress } from "@/lib/tables/properties";
import type { PropertySearchResult } from "@/lib/tables/properties";
import {
  listTransactions,
  type CreateTransaction,
  type TransactionListItem,
  type TransactionListQuery,
} from "@/lib/tables/transactions";
import { createSearchLog } from "@/lib/collections/search-logs";

export async function searchPropertiesAction(
  query: string,
): Promise<PropertySearchResult[]> {
  await assertAgent();
  return searchPropertiesByAddress(query);
}

export async function createTransactionAction(
  input: CreateTransaction,
): Promise<void> {
  const session = await assertAgent();
  await addTransaction({ uploadedByUserId: session.user.id, input });
}

export async function fetchTransactions(
  input: TransactionListQuery,
): Promise<{ data: TransactionListItem[]; total: number }> {
  void logTransactionSearch(input);
  return listTransactions(input);
}

async function logTransactionSearch(input: TransactionListQuery) {
  if ((input.page ?? 1) !== 1) return;

  const query: Record<string, unknown> = {};
  if (input.town_id) query.townId = [input.town_id];
  if (input.flat_type_id != null)
    query.flatTypeId = [String(input.flat_type_id)];
  if (input.flat_model_id != null)
    query.flatModelId = [String(input.flat_model_id)];
  if (input.price_min != null || input.price_max != null) {
    query.price = { min: input.price_min, max: input.price_max };
  }
  if (Object.keys(query).length === 0) return;

  const session = await auth();
  await createSearchLog({
    userId: session?.user?.id ?? undefined,
    query,
  }).catch(() => {});
}
