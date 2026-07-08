"use server";

import { assertAgent, auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { ROUTES } from "@/lib/routes";
import { addTransaction } from "@/lib/services/transaction";
import type { CreateTransaction } from "@/lib/tables/transactions";
import { searchPropertiesByAddress } from "@/lib/tables/properties";
import type { PropertySearchResult } from "@/lib/tables/properties";

export async function searchPropertiesAction(
  query: string,
): Promise<PropertySearchResult[]> {
  await assertAgent();
  return searchPropertiesByAddress(query);
}

export async function createTransactionAction(
  input: CreateTransaction,
): Promise<string> {
  await assertAgent();
  const session = await auth();
  await addTransaction({ uploadedByUserId: session!.user.id, input });
  revalidatePath(ROUTES.TRANSACTIONS);
  return "ok";
}
