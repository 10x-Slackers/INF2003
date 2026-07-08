"use server";

import { auth } from "@/lib/auth";
import { isAgent } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { ROUTES } from "@/lib/routes";
import { addTransaction } from "@/lib/services/transaction";
import { listFlatModels, listFlatTypes } from "@/lib/tables/lookups";
import { searchPropertiesByAddress } from "@/lib/tables/properties";
import type { PropertySearchResult } from "@/lib/tables/properties";
import { listTowns } from "@/lib/tables/towns";
import {
  listTransactions,
  type CreateTransaction,
  type TransactionListItem,
  type TransactionListQuery,
} from "@/lib/tables/transactions";

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
  if (!session || !isAgent(session.user.role)) {
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

export async function fetchTransactionFilters() {
  const [towns, flatTypes, flatModels] = await Promise.all([
    listTowns(),
    listFlatTypes(),
    listFlatModels(),
  ]);
  return { towns, flatTypes, flatModels };
}
