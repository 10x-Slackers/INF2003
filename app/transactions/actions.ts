"use server";

import { auth } from "@/lib/auth";
import { isAgent } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { ROUTES } from "@/lib/routes";
import { addTransaction } from "@/lib/services/transaction";
import { searchPropertiesByAddress } from "@/lib/tables/properties";
import type { PropertySearchResult } from "@/lib/tables/properties";
import {
  listTransactions,
  type CreateTransaction,
  type TransactionListItem,
  type TransactionListQuery,
} from "@/lib/tables/transactions";
import { fetchPropertyFilters } from "@/app/filters";

export async function searchPropertiesAction(
  query: string,
): Promise<PropertySearchResult[]> {
  const session = await auth();
  if (!isAgent(session?.user?.role)) throw new Error("Forbidden");
  return searchPropertiesByAddress(query);
}

export async function createTransactionAction(
  input: CreateTransaction,
): Promise<void> {
  const session = await auth();
  if (!session || !isAgent(session.user?.role)) {
    throw new Error("Forbidden");
  }
  await addTransaction({ uploadedByUserId: session.user.id, input });
  revalidatePath(ROUTES.TRANSACTIONS);
}

export async function fetchTransactions(
  input: TransactionListQuery,
): Promise<{ data: TransactionListItem[]; total: number }> {
  return listTransactions(input);
}

export { fetchPropertyFilters as fetchTransactionFilters };
