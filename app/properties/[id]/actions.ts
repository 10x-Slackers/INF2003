"use server";

import { fetchTransactions } from "@/app/transactions/actions";

export async function fetchTransactionsAction(
  input: Parameters<typeof fetchTransactions>[0],
): Promise<ReturnType<typeof fetchTransactions>> {
  return fetchTransactions(input);
}
