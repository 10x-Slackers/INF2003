"use server";

import {
  listTransactions,
  type TransactionListItem,
  type TransactionListQuery,
} from "@/lib/tables/transactions";

export async function fetchTransactionsAction(
  input: TransactionListQuery,
): Promise<{ data: TransactionListItem[]; total: number }> {
  return listTransactions(input);
}
